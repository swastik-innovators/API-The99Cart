import { Router } from 'express';
import { productController } from '../controllers/product.controller';
import { authenticate, authorize } from '../middleware';

const router = Router();

// ─── PRIVATE SELLER ENDPOINTS ────────────────────────────────────────────────
// MUST precede generic wildcards (like :slug) to prevent REST parameter clashes!
router.get('/my-products', authenticate, authorize('seller'), productController.getSellerProducts);
router.get('/my-products/:id', authenticate, authorize('seller'), productController.getSellerProductById);

router.post('/', authenticate, authorize('seller'), productController.createProduct);
router.patch('/:id', authenticate, authorize('seller'), productController.updateProduct);
router.delete('/:id', authenticate, authorize('seller'), productController.deleteProduct);

// ─── PUBLIC ENDPOINTS ────────────────────────────────────────────────────────
router.get('/', productController.queryProducts);
router.get('/featured', productController.getFeaturedProducts);
router.get('/trending', productController.getTrendingProducts);
router.get('/:slug', productController.getProductBySlug);

export default router;
