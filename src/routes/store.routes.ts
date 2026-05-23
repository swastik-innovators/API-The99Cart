// ─── Store Routes ────────────────────────────────────────────────────────────
// Express routes managing public storefront detail accesses and private settings updates.

import { Router } from 'express';
import { storeController } from '../controllers/store.controller';
import { authenticate, authorize, validate } from '../middleware';
import { updateSellerSchema } from '../validators/seller.validator';

const router = Router();

// ── Public Routes (Customer Facing) ────────────────────────────────────────

/**
 * @swagger
 * /store/products:
 *   get:
 *     summary: Retrieve products by store slug query
 *     tags: [Public Store]
 */
router.get('/products', storeController.getProducts);

/**
 * @swagger
 * /store/reviews:
 *   get:
 *     summary: Retrieve reviews by store slug query
 *     tags: [Public Store]
 */
router.get('/reviews', storeController.getReviews);

/**
 * @swagger
 * /store/:slug:
 *   get:
 *     summary: Retrieve store details by unique slug
 *     tags: [Public Store]
 */
router.get('/:slug', storeController.getStore);

/**
 * @swagger
 * /store/:slug/products:
 *   get:
 *     summary: Retrieve store products by slug path
 *     tags: [Public Store]
 */
router.get('/:slug/products', storeController.getProducts);

/**
 * @swagger
 * /store/:slug/reviews:
 *   get:
 *     summary: Retrieve store reviews by slug path
 *     tags: [Public Store]
 */
router.get('/:slug/reviews', storeController.getReviews);


// ── Private Routes (Seller Controls) ───────────────────────────────────────

/**
 * @swagger
 * /store/update:
 *   patch:
 *     summary: Update active seller store details
 *     tags: [Seller Store Controls]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/update',
  authenticate,
  authorize('seller'),
  validate(updateSellerSchema, 'body'),
  storeController.updateStore
);

export default router;
