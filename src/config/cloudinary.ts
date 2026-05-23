// ─── Cloudinary Configuration ──────────────────────────────────────────────
// Initialises and exports the Cloudinary SDK instance.

import { v2 as cloudinary } from 'cloudinary';
import { config } from './index';
import { logger } from './logger';

// ── Configure SDK ──────────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
  secure: true,
});

// ── Connection Test ────────────────────────────────────────────────────────
export async function testCloudinaryConnection(): Promise<boolean> {
  try {
    await cloudinary.api.ping();
    logger.info('✅ Cloudinary connection established');
    return true;
  } catch (err) {
    logger.warn('⚠️  Cloudinary connection test failed', {
      error: err instanceof Error ? err.message : err,
    });
    return false;
  }
}

export default cloudinary;
