// ─── Health Controller ─────────────────────────────────────────────────────
// Returns system health status and connected service info.

import { Request, Response } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { ApiResponse } from '../utils/api-response';
import { testSupabaseConnection } from '../config/supabase';
import { testCloudinaryConnection } from '../config/cloudinary';
import { config } from '../config';
import { APP_VERSION } from '../utils/constants';
import { HealthStatus } from '../types';

export const healthCheck = asyncHandler(async (_req: Request, res: Response) => {
  const [supabaseOk, cloudinaryOk] = await Promise.all([
    testSupabaseConnection(),
    testCloudinaryConnection(),
  ]);

  const status: HealthStatus = {
    status: supabaseOk && cloudinaryOk ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    version: APP_VERSION,
    environment: config.env,
    services: {
      supabase: supabaseOk ? 'connected' : 'disconnected',
      cloudinary: cloudinaryOk ? 'connected' : 'disconnected',
    },
  };

  const httpStatus = status.status === 'healthy' ? 200 : 503;
  ApiResponse.success(res, status, 'Health check completed', httpStatus);
});

export const ping = asyncHandler(async (_req: Request, res: Response) => {
  ApiResponse.success(res, { pong: true, timestamp: Date.now() }, 'pong');
});
