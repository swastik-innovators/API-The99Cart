// ─── Health Routes ─────────────────────────────────────────────────────────
import { Router } from 'express';
import { healthCheck, ping } from '../controllers/health.controller';

const router = Router();

/**
 * GET /health
 * Deep health check — tests Supabase & Cloudinary connectivity.
 */
router.get('/health', healthCheck);

/**
 * GET /ping
 * Lightweight liveness probe.
 */
router.get('/ping', ping);

export default router;
