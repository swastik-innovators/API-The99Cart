// ─── Environment Type Definitions ──────────────────────────────────────────
// Strongly-type process.env so config reads are safe at compile time.

declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    PORT: string;
    API_VERSION: string;

    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
    SUPABASE_SERVICE_ROLE_KEY: string;

    CLOUDINARY_CLOUD_NAME: string;
    CLOUDINARY_API_KEY: string;
    CLOUDINARY_API_SECRET: string;

    CORS_ORIGIN: string;

    RATE_LIMIT_WINDOW_MS: string;
    RATE_LIMIT_MAX_REQUESTS: string;

    COOKIE_SECRET: string;

    GOOGLE_CLIENT_ID: string;
    FRONTEND_URL: string;

    LOG_LEVEL: string;
  }
}
