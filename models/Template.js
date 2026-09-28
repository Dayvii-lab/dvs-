const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  description: { type: String, required: true },
  category: {
    type: String,
    enum: ['Logo', 'Flyer', 'Social Media', 'Presentation', 'Business Card', 'Resume', 'UI Kit', 'Other'],
    required: true,
  },
  price: { type: Number, required: true, min: 0 }, // KES
  previewImage: { type: String, required: true },  // /previews/xxx.jpg
  filePath: { type: String, required: true, select: false }, // uploads/files/xxx.zip
  fileSize: { type: Number, default: 0 },
  tags: [{ type: String }],
  downloads: { type: Number, default: 0 },
  sales: { type: Number, default: 0 },
  featured: { type: Boolean, default: false },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

templateSchema.index({ title: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Template', templateSchema);
