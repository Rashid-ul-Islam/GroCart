import multer from 'multer';
import path from 'path';

// Configure multer for memory storage (we'll upload to Supabase directly)
const storage = multer.memoryStorage();

// File filter function to allow only images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter,
});

// Middleware for single image upload
export const uploadSingleImage = upload.single('image');

// Middleware for single product image upload (specific route)
export const uploadSingleProductImage = upload.single('image');

// Middleware for multiple image uploads
export const uploadMultipleImages = upload.array('images', 10); // Maximum 10 images

// Middleware for product image upload (can handle both single and multiple)
export const uploadProductImages = upload.fields([
  { name: 'mainImage', maxCount: 1 },
  { name: 'additionalImages', maxCount: 9 }
]);

// Error handling middleware for multer
export const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Maximum size is 5MB.' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ message: 'Too many files. Maximum 10 files allowed.' });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ message: 'Unexpected field name for file upload.' });
    }
  }
  
  if (err.message === 'Only image files are allowed (jpeg, jpg, png, gif, webp)') {
    return res.status(400).json({ message: err.message });
  }

  next(err);
};

export default {
  uploadSingleImage,
  uploadSingleProductImage,
  uploadMultipleImages,
  uploadProductImages,
  handleMulterError
};
