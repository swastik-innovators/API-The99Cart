import { Router } from 'express';
import multer from 'multer';
import { uploadController } from '../controllers/upload.controller';
import { authenticate, authorize } from '../middleware';

const router = Router();

// Configure Multer Memory Storage for high-speed serverless stream uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100 MB max file size for digital bundles
  },
});

// Protect all upload endpoints (Seller authorization required)
router.use(authenticate);
router.use(authorize('seller'));

/**
 * POST /api/v1/upload/image
 * Query params: ?folder=products|stores|avatars|previews
 * Uploads images securely to Cloudinary
 */
router.post('/image', upload.array('images', 10), uploadController.uploadImage);

/**
 * POST /api/v1/upload/product-files
 * Query params: ?folder=product-files|seller-files|bundle-files
 * Uploads digital download ZIP files securely to Supabase Storage
 */
router.post('/product-files', upload.array('files', 5), uploadController.uploadProductFiles);

export default router;
