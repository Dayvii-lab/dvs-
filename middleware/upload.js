const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { nanoid } = require('nanoid');

const ensure = (d) => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); };
const previews = path.join(__dirname, '..', 'uploads', 'previews');
const files = path.join(__dirname, '..', 'uploads', 'files');
const portfolios = path.join(__dirname, '..', 'uploads', 'portfolios');
[previews, files, portfolios].forEach(ensure);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'preview') return cb(null, previews);
    if (file.fieldname === 'file') return cb(null, files);
    if (['resume', 'portfolio'].includes(file.fieldname)) return cb(null, portfolios);
    cb(new Error('Unknown field'), null);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${nanoid(8)}${path.extname(file.originalname).toLowerCase()}`);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (file.fieldname === 'preview' && !['.jpg','.jpeg','.png','.webp','.gif'].includes(ext))
    return cb(new Error('Preview must be image'));
  if (file.fieldname === 'file' && ext !== '.zip')
    return cb(new Error('Template file must be .zip'));
  if (file.fieldname === 'resume' && !['.pdf','.doc','.docx'].includes(ext))
    return cb(new Error('Resume must be PDF/DOC'));
  if (file.fieldname === 'portfolio' && !['.pdf','.zip','.jpg','.jpeg','.png'].includes(ext))
    return cb(new Error('Portfolio must be PDF/ZIP/image'));
  cb(null, true);
};

module.exports = multer({ storage, fileFilter, limits: { fileSize: 100 * 1024 * 1024 } });

// Helper instances
module.exports.templateUpload = module.exports.fields([
  { name: 'preview', maxCount: 1 },
  { name: 'file', maxCount: 1 },
]);

module.exports.applicationUpload = module.exports.fields([
  { name: 'resume', maxCount: 1 },
  { name: 'portfolio', maxCount: 1 },
]);
