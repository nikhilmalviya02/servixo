const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'servixo', // folder name in Cloudinary
    allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp', 'pdf'],
    public_id: (req, file) => Date.now() + '-' + file.originalname.split('.')[0]
  }
});

// Create verification storage with specific folder structure
const createVerificationStorage = (folder) => {
  return new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: `servixo/verification/${folder}`,
      allowed_formats: ['jpg', 'png', 'jpeg', 'pdf'],
      public_id: (req, file) => `${Date.now()}-${file.originalname.split('.')[0]}`
    }
  });
};

module.exports = { 
  cloudinary, 
  storage,
  createVerificationStorage
};
