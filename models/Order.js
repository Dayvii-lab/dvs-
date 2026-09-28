const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  template: { type: mongoose.Schema.Types.ObjectId, ref: 'Template', required: true },
  amount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'cancelled'],
    default: 'pending',
  },
  paymentMethod: { type: String, default: 'mpesa' },
  mpesaReceipt: String,
  checkoutRequestId: String,
  merchantRequestId: String,
  phone: String,
  paidAt: Date,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Order', orderSchema);
