const express = require('express');
const Order = require('../models/Order');
const Template = require('../models/Template');
const { protect } = require('../middleware/auth');
const { stkPush, stkQuery, normalizePhone } = require('../utils/mpesa');

const router = express.Router();

// Initiate STK Push
router.post('/mpesa/stkpush', protect, async (req, res) => {
  try {
    const { orderId, phone } = req.body;
    if (!orderId || !phone) return res.status(400).json({ error: 'orderId and phone required' });

    const order = await Order.findById(orderId).populate('template');
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (String(order.user) !== String(req.user._id))
      return res.status(403).json({ error: 'Forbidden' });
    if (order.status === 'paid')
      return res.json({ alreadyPaid: true, order });

    const normalized = normalizePhone(phone);

    const result = await stkPush({
      phone: normalized,
      amount: order.amount,
      accountReference: `PV-${order._id.toString().slice(-8)}`,
      transactionDesc: `Purchase: ${order.template.title}`,
    });

    order.checkoutRequestId = result.CheckoutRequestID;
    order.merchantRequestId = result.MerchantRequestID;
    order.phone = normalized;
    await order.save();

    res.json({
      message: 'STK push sent. Enter your M-Pesa PIN.',
      checkoutRequestId: result.CheckoutRequestID,
      orderId: order._id,
    });
  } catch (err) {
    console.error('STK error:', err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data?.errorMessage || err.message });
  }
});

// Poll status endpoint — frontend can call this
router.get('/mpesa/status/:orderId', protect, async (req, res) => {
  const order = await Order.findById(req.params.orderId);
  if (!order) return res.status(404).json({ error: 'Not found' });

  if (order.status === 'paid') return res.json({ status: 'paid', order });

  // Optionally query Daraja for latest status
  try {
    if (order.checkoutRequestId) {
      const q = await stkQuery({ checkoutRequestId: order.checkoutRequestId });
      if (q.ResultCode === '0') {
        order.status = 'paid';
        order.paidAt = new Date();
        if (!order.mpesaReceipt) order.mpesaReceipt = q.ResultDesc || 'CONFIRMED';
        await order.save();
        await Template.findByIdAndUpdate(order.template, { $inc: { sales: 1 } });
      }
      return res.json({ status: order.status, raw: q });
    }
  } catch (e) {
    // ignore
  }

  res.json({ status: order.status });
});

// Daraja callback — this is where we VERIFY payment server-side
router.post('/callback', async (req, res) => {
  try {
    const body = req.body?.Body?.stkCallback;
    if (!body) return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });

    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = body;

    const order = await Order.findOne({ checkoutRequestId: CheckoutRequestID });
    if (!order) {
      console.warn('Callback: order not found for', CheckoutRequestID);
      return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
    }

    if (ResultCode === 0) {
      let receipt = null;
      if (CallbackMetadata?.Item) {
        const found = CallbackMetadata.Item.find((i) => i.Name === 'MpesaReceiptNumber');
        receipt = found?.Value;
      }
      order.status = 'paid';
      order.paidAt = new Date();
      order.mpesaReceipt = receipt;
      await order.save();
      await Template.findByIdAndUpdate(order.template, { $inc: { sales: 1 } });
      console.log('✅ Payment confirmed for order', order._id, 'Receipt:', receipt);
    } else {
      order.status = ResultCode === 1032 ? 'cancelled' : 'failed';
      order.mpesaReceipt = ResultDesc;
      await order.save();
      console.log('❌ Payment failed:', ResultDesc);
    }

    res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (err) {
    console.error('Callback error', err);
    res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }
});

module.exports = router;
