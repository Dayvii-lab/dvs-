const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  description: { type: String, required: true },
  category: {
    type: String,
    enum: ['Logo', 'Flyer', 'Social Media', 'Presentation', 'Business Card', 'Resume', 'UI Kit', 'Illustration', 'Other'],
    required: true,
  },
  price: { type: Number, required: true, min: 0 },
  previewImage: { type: String, required: true },
  filePath: { type: String, required: true, select: false },
  fileSize: { type: Number, default: 0 },
  tags: [String],
  downloads: { type: Number, default: 0 },
  sales: { type: Number, default: 0 },
  featured: { type: Boolean, default: false },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

templateSchema.index({ title: 'text', description: 'text', tags: 'text' });
module.exports = mongoose.model('Template', templateSchema);
