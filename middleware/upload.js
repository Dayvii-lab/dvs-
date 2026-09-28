const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { nanoid } = require('nanoid');

const ensureDir = (dir) => { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); };

const previewDir = path.join(__dirname, '..', 'uploads', 'previews');
const fileDir = path.join(__dirname, '..', 'uploads', 'files');
ensureDir(previewDir);
ensureDir(fileDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'preview') cb(null, previewDir);
    else if (file.fieldname === 'file') cb(null, fileDir);
    else cb(new Error('Unknown field'), null);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${nanoid(8)}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'preview') {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    if (!allowed.includes(path.extname(file.originalname).toLowerCase()))
      return cb(new Error('Preview must be an image'));
  }
  if (file.fieldname === 'file') {
    if (path.extname(file.originalname).toLowerCase() !== '.zip')
      return cb(new Error('Template file must be a .zip'));
  }
  cb(null, true);
};

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
}).fields([
  { name: 'preview', maxCount: 1 },
  { name: 'file', maxCount: 1 },
]);
