// ─── Environment Config ────────────────────────────────────────────────────
// Centralised, validated configuration object.
// Fails fast on startup if required env vars are missing.

import dotenv from 'dotenv';
import path from 'path';

// Load .env before anything else
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// ── Validation ─────────────────────────────────────────────────────────────
const requiredVars = [
  'NODE_ENV',
  'PORT',
  'API_VERSION',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'CORS_ORIGIN',
  'COOKIE_SECRET',
  'GOOGLE_CLIENT_ID',
] as const;

const missing = requiredVars.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(
    `\n❌  Missing required environment variables:\n   ${missing.join('\n   ')}\n`
  );
  console.error('   → Copy .env.example to .env and fill in the values.\n');
  process.exit(1);
}

// ── Typed Config ───────────────────────────────────────────────────────────
export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  apiVersion: process.env.API_VERSION || 'v1',
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',

  supabase: {
    url: process.env.SUPABASE_URL!,
    anonKey: process.env.SUPABASE_ANON_KEY!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    apiSecret: process.env.CLOUDINARY_API_SECRET!,
  },

  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  cookie: {
    secret: process.env.COOKIE_SECRET!,
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID!,
  },

  log: {
    level: process.env.LOG_LEVEL || 'debug',
  },
} as const;

export default config;
