// ─── Shared Types ──────────────────────────────────────────────────────────
// Re-export all shared types from a single barrel file.

/** Standard API response envelope */
export interface ApiResponsePayload<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
  meta?: PaginationMeta;
}

/** Pagination metadata */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Pagination query params (pre-validated) */
export interface PaginationQuery {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/** Health-check response */
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services: {
    supabase: 'connected' | 'disconnected';
    cloudinary: 'connected' | 'disconnected';
  };
}

export * from './product';
