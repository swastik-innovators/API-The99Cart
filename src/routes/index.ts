// ─── Route Registry ────────────────────────────────────────────────────────
// All route modules are mounted here. This is the single source of truth.

import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import sellerRoutes from './seller.routes';
import storeRoutes from './store.routes';
import productRoutes from './product.routes';
import uploadRoutes from './upload.routes';
import adminRoutes from './admin.routes';

const router = Router();

// ── Mount routes ───────────────────────────────────────────────────────────
router.use('/', healthRoutes);
router.use('/auth', authRoutes);
router.use('/seller', sellerRoutes);
router.use('/store', storeRoutes);
router.use('/products', productRoutes);
router.use('/upload', uploadRoutes);
router.use('/admin', adminRoutes);

export default router;
