require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const Template = require('../models/Template');
const Wallet = require('../models/Wallet');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected');

  await User.deleteMany({});
  await Template.deleteMany({});
  await Wallet.deleteMany({});

  const admin = await User.create({
    name: 'Admin', username: 'admin', email: 'admin@pixelvault.test',
    phone: '254700000000', password: 'admin123', role: 'admin', status: 'active',
  });

  const customer = await User.create({
    name: 'Demo Customer', username: 'customer', email: 'user@pixelvault.test',
    phone: '254711111111', password: 'user1234', role: 'customer', status: 'active',
  });

  const creator = await User.create({
    name: 'Demo Creator', username: 'creator', email: 'creator@pixelvault.test',
    phone: '254722222222', password: 'creator123', role: 'creator', status: 'active',
    bio: 'Designer of minimal brand kits.', skills: ['branding', 'logo', 'social'],
  });

  await Wallet.create({ creator: creator._id, balance: 0, totalEarned: 0, totalWithdrawn: 0 });

  const previewDir = path.join(__dirname, '..', 'uploads', 'previews');
  const fileDir = path.join(__dirname, '..', 'uploads', 'files');
  [previewDir, fileDir].forEach((d) => fs.existsSync(d) || fs.mkdirSync(d, { recursive: true }));

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400">
  <rect width="100%" height="100%" fill="#f97316"/>
  <text x="50%" y="50%" fill="#fff" font-size="32" font-family="sans-serif" text-anchor="middle">Preview</text></svg>`;

  const samples = [
    { title: 'Minimal Logo Pack', category: 'Logo', price: 500, tags: ['logo'] },
    { title: 'Corporate Flyer Bundle', category: 'Flyer', price: 800, tags: ['flyer'] },
    { title: 'Instagram Story Kit', category: 'Social Media', price: 1200, tags: ['social'] },
    { title: 'Startup Pitch Deck', category: 'Presentation', price: 2000, tags: ['pitch'] },
    { title: 'Illustration Mega Pack', category: 'Illustration', price: 1500, tags: ['illustration'] },
  ];

  for (const t of samples) {
    const fn = `seed-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.svg`;
    fs.writeFileSync(path.join(previewDir, fn), svg);
    const zn = `seed-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.zip`;
    fs.writeFileSync(path.join(fileDir, zn), Buffer.from('PK\x05\x06' + '\x00'.repeat(18)));

    await Template.create({
      creator: creator._id,
      title: t.title,
      slug: t.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now(),
      description: `Premium ${t.category} template by Demo Creator.`,
      category: t.category,
      price: t.price,
      previewImage: `/previews/${fn}`,
      filePath: `uploads/files/${zn}`,
      tags: t.tags,
    });
  }

  console.log('✅ Seed complete');
  console.log('Admin    → admin@pixelvault.test / admin123');
  console.log('Customer → user@pixelvault.test / user1234');
  console.log('Creator  → creator@pixelvault.test / creator123');
  process.exit(0);
})();
