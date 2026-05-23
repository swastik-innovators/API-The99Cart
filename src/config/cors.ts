// ─── CORS Configuration ────────────────────────────────────────────────────
// Dynamic origin validation with sensible defaults.

import { CorsOptions } from 'cors';
import { config } from './index';

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = config.cors.origin;

    // Allow requests with no origin (mobile apps, Postman, server-to-server)
    if (!origin) {
      callback(null, true);
      return;
    }

    // Allow all localhost origins in development to prevent port mismatch blocks
    const isLocalhost = 
      origin.startsWith('http://localhost:') || 
      origin.startsWith('https://localhost:') || 
      origin === 'http://localhost' || 
      origin === 'https://localhost';

    // Allow wildcard subdomains of the99cart.com and lvh.me (local subdomain testing)
    const isSubdomainMatch = 
      origin.endsWith('.the99cart.com') || 
      origin === 'https://the99cart.com' ||
      /\.lvh\.me(:\d+)?$/.test(origin) ||
      origin.startsWith('http://lvh.me') ||
      origin.startsWith('https://lvh.me');

    if (isLocalhost || isSubdomainMatch || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-Request-ID',
  ],
  exposedHeaders: ['X-Request-ID', 'X-RateLimit-Remaining'],
  maxAge: 86400, // 24 hours preflight cache
  optionsSuccessStatus: 204,
};

export default corsOptions;
