// ─── Constants ─────────────────────────────────────────────────────────────
// App-wide constants. Keep business constants in their respective modules.

export const APP_NAME = 'The99cart API';
export const APP_VERSION = '1.0.0';

/** HTTP status codes used across the app */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

/** Cookie options shared across the app */
export const COOKIE_DEFAULTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

/** Cloudinary upload presets / folders */
export const CLOUDINARY_FOLDERS = {
  PRODUCTS: 'the99cart/products',
  AVATARS: 'the99cart/avatars',
  BANNERS: 'the99cart/banners',
  DOCUMENTS: 'the99cart/documents',
} as const;
