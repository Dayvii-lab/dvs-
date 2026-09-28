require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const Template = require('../models/Template');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected');

  await User.deleteMany({});
  await Template.deleteMany({});

  const admin = await User.create({
    name: 'Admin',
    email: 'admin@pixelvault.test',
    password: 'admin123',
    role: 'admin',
  });

  const user = await User.create({
    name: 'Demo User',
    email: 'user@pixelvault.test',
    password: 'user1234',
  });

  // Ensure placeholder dirs & files
  const previewDir = path.join(__dirname, '..', 'uploads', 'previews');
  const fileDir = path.join(__dirname, '..', 'uploads', 'files');
  [previewDir, fileDir].forEach((d) => fs.existsSync(d) || fs.mkdirSync(d, { recursive: true }));

  const placeholderSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400">
    <rect width="100%" height="100%" fill="#4f46e5"/>
    <text x="50%" y="50%" fill="#fff" font-size="32" font-family="sans-serif" text-anchor="middle">Preview</text>
  </svg>`;

  const sampleTemplates = [
    { title: 'Minimal Logo Pack', category: 'Logo', price: 500, tags: ['logo', 'minimal', 'brand'] },
    { title: 'Corporate Flyer Bundle', category: 'Flyer', price: 800, tags: ['flyer', 'corporate'] },
    { title: 'Instagram Story Kit', category: 'Social Media', price: 1200, tags: ['instagram', 'stories'] },
    { title: 'Startup Pitch Deck', category: 'Presentation', price: 2000, tags: ['pitch', 'startup'] },
    { title: 'Business Card Set', category: 'Business Card', price: 400, tags: ['card', 'print'] },
    { title: 'Modern Resume Pack', category: 'Resume', price: 600, tags: ['resume', 'cv'] },
  ];

  for (const t of sampleTemplates) {
    const filename = `seed-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.svg`;
    fs.writeFileSync(path.join(previewDir, filename), placeholderSvg);

    const zipName = `seed-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.zip`;
    // Create a tiny valid zip placeholder (empty bytes is enough for seed)
    fs.writeFileSync(path.join(fileDir, zipName), Buffer.from('PK\x05\x06' + '\x00'.repeat(18)));

    await Template.create({
      title: t.title,
      slug: t.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: `A premium ${t.category.toLowerCase()} template designed for professionals. Fully editable, print-ready and included with source files.`,
      category: t.category,
      price: t.price,
      previewImage: `/previews/${filename}`,
      filePath: `uploads/files/${zipName}`,
      tags: t.tags,
      featured: Math.random() > 0.5,
    });
  }

  console.log('✅ Seed complete');
  console.log('Admin → admin@pixelvault.test / admin123');
  console.log('User  → user@pixelvault.test / user1234');
  process.exit(0);
})();
