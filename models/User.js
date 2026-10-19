const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, required: true, trim: true },
  password: { type: String, required: true, minlength: 6, select: false },
  role: { type: String, enum: ['customer', 'creator', 'admin'], default: 'customer' },
  status: {
    type: String,
    enum: ['active', 'pending', 'rejected', 'suspended'],
    default: 'active',
  },
  // Creator profile
  bio: String,
  skills: [String],
  portfolioUrl: String,
  // Payout phone (M-Pesa)
  payoutPhone: String,
  createdAt: { type: Date, default: Date.now },
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});
userSchema.methods.comparePassword = function (c) {
  return bcrypt.compare(c, this.password);
};

module.exports = mongoose.model('User', userSchema);
