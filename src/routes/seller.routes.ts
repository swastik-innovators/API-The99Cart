// ─── Seller Routes ───────────────────────────────────────────────────────────
// Express routes defining the onboarding endpoints for sellers.

import { Router } from 'express';
import { sellerController } from '../controllers/seller.controller';
import { authenticate, authorize, validate } from '../middleware';
import { createSellerSchema, updateSellerSchema } from '../validators/seller.validator';

const router = Router();

// Protect all seller profile/onboarding routes under user roles
router.use(authenticate);
router.use(authorize('seller'));

/**
 * @swagger
 * /seller/status:
 *   get:
 *     summary: Retrieve seller onboarding status
 *     tags: [Seller Profile]
 *     security:
 *       - bearerAuth: []
 */
router.get('/status', sellerController.getStatus);

/**
 * @swagger
 * /seller/check-slug:
 *   get:
 *     summary: Verify if a store slug is available
 *     tags: [Seller Profile]
 *     security:
 *       - bearerAuth: []
 */
router.get('/check-slug', sellerController.checkSlug);

/**
 * @swagger
 * /seller/profile:
 *   get:
 *     summary: Retrieve seller store profile details
 *     tags: [Seller Profile]
 *     security:
 *       - bearerAuth: []
 */
router.get('/profile', sellerController.getProfile);

/**
 * @swagger
 * /seller/create:
 *   post:
 *     summary: Complete onboarding and create store profile
 *     tags: [Seller Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateSellerInput'
 */
router.post('/create', validate(createSellerSchema, 'body'), sellerController.create);

/**
 * @swagger
 * /seller/update:
 *   patch:
 *     summary: Update existing store profile details
 *     tags: [Seller Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateSellerInput'
 */
router.patch('/update', validate(updateSellerSchema, 'body'), sellerController.update);

export default router;
