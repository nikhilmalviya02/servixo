const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { cloudinary } = require('../config/cloudinary');

// Single file upload
router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    res.json({ 
      success: true,
      url: req.file.path,
      public_id: req.file.filename
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Multiple files upload
router.post('/upload-multiple', upload.array('images', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const urls = req.files.map(file => ({
      url: file.path,
      public_id: file.filename
    }));
    
    res.json({ 
      success: true,
      images: urls 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete image
router.delete('/delete/:publicId', async (req, res) => {
  try {
    await cloudinary.uploader.destroy(req.params.publicId);
    res.json({ 
      success: true,
      message: 'Image deleted successfully' 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
