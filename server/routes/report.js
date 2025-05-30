const express = require('express');
const multer = require('multer');
const { protect } = require('../middlewares/authMiddleware');
const { uploadReport, getReports } = require('../controllers/reportController');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

const upload = multer({ storage });

router.post('/upload', protect, upload.single('audio'), uploadReport);
router.get('/myreports', protect, getReports);

module.exports = router;
