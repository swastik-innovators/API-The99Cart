// ─── Swagger Configuration ─────────────────────────────────────────────────
// OpenAPI 3.0 spec served at /api/v1/docs

import swaggerJSDoc from 'swagger-jsdoc';
import { config } from './index';
import { APP_NAME, APP_VERSION } from '../utils/constants';

const swaggerDefinition: swaggerJSDoc.OAS3Definition = {
  openapi: '3.0.3',
  info: {
    title: `${APP_NAME}`,
    version: APP_VERSION,
    description: 'Production-grade REST API for The99cart marketplace.',
    contact: {
      name: 'The99cart Team',
    },
  },
  servers: [
    {
      url: `http://localhost:${config.port}/api/${config.apiVersion}`,
      description: 'Development',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Supabase JWT access token',
      },
      CookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'access_token',
        description: 'Signed httpOnly cookie',
      },
    },
    schemas: {
      // ── Shared ──────────────────────────────────────────────
      ApiResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
          data: { type: 'object' },
          errors: {
            type: 'object',
            additionalProperties: {
              type: 'array',
              items: { type: 'string' },
            },
          },
        },
      },

      // ── Auth ────────────────────────────────────────────────
      Profile: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          full_name: { type: 'string', nullable: true },
          phone: { type: 'string', nullable: true },
          avatar_url: { type: 'string', nullable: true },
          role: { type: 'string', enum: ['customer', 'seller', 'admin'] },
          is_verified: { type: 'boolean' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      AuthTokens: {
        type: 'object',
        properties: {
          access_token: { type: 'string' },
          refresh_token: { type: 'string' },
          expires_in: { type: 'integer' },
          token_type: { type: 'string', enum: ['bearer'] },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string' },
          data: {
            type: 'object',
            properties: {
              user: { $ref: '#/components/schemas/Profile' },
              tokens: { $ref: '#/components/schemas/AuthTokens' },
            },
          },
        },
      },

      // ── Request Bodies ──────────────────────────────────────
      RegisterRequest: {
        type: 'object',
        required: ['email', 'password', 'full_name'],
        properties: {
          email: { type: 'string', format: 'email', example: 'user@example.com' },
          password: { type: 'string', minLength: 8, example: 'Str0ng@Pass!' },
          full_name: { type: 'string', example: 'Prakash Kumar' },
          phone: { type: 'string', example: '+919876543210' },
          role: { type: 'string', enum: ['customer', 'seller', 'admin'], default: 'customer' },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'user@example.com' },
          password: { type: 'string', example: 'Str0ng@Pass!' },
        },
      },
      GoogleAuthRequest: {
        type: 'object',
        required: ['id_token'],
        properties: {
          id_token: { type: 'string', description: 'Google OAuth ID token from client' },
          role: { type: 'string', enum: ['customer', 'seller', 'admin'], default: 'customer' },
        },
      },
      RefreshTokenRequest: {
        type: 'object',
        required: ['refresh_token'],
        properties: {
          refresh_token: { type: 'string' },
        },
      },
      ForgotPasswordRequest: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email', example: 'user@example.com' },
        },
      },
      ResetPasswordRequest: {
        type: 'object',
        required: ['access_token', 'password', 'confirm_password'],
        properties: {
          access_token: { type: 'string', description: 'Token from the password reset email' },
          password: { type: 'string', minLength: 8, example: 'NewStr0ng@Pass!' },
          confirm_password: { type: 'string', example: 'NewStr0ng@Pass!' },
        },
      },
      UpdateProfileRequest: {
        type: 'object',
        properties: {
          full_name: { type: 'string', example: 'Updated Name' },
          phone: { type: 'string', nullable: true, example: '+919876543210' },
          avatar_url: { type: 'string', nullable: true, example: 'https://res.cloudinary.com/...' },
        },
      },
    },
  },

  paths: {
    // ── Health ──────────────────────────────────────────────────
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Deep health check',
        description: 'Tests Supabase & Cloudinary connectivity.',
        responses: {
          200: { description: 'All services healthy' },
          503: { description: 'One or more services degraded' },
        },
      },
    },
    '/ping': {
      get: {
        tags: ['Health'],
        summary: 'Liveness probe',
        responses: {
          200: { description: 'pong' },
        },
      },
    },

    // ── Auth ────────────────────────────────────────────────────
    '/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Register a new user',
        description: 'Creates a new account. A verification email will be sent.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterRequest' },
            },
          },
        },
        responses: {
          201: {
            description: 'User registered',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponse' },
              },
            },
          },
          400: { description: 'Validation error' },
          409: { description: 'Email already exists' },
          429: { description: 'Rate limited' },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Login with email & password',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponse' },
              },
            },
          },
          401: { description: 'Invalid credentials' },
          429: { description: 'Rate limited' },
        },
      },
    },
    '/auth/google': {
      post: {
        tags: ['Authentication'],
        summary: 'Login with Google OAuth',
        description: 'Send the Google ID token from the client-side OAuth flow.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/GoogleAuthRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Google login successful',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponse' },
              },
            },
          },
          401: { description: 'Invalid Google token' },
          429: { description: 'Rate limited' },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Authentication'],
        summary: 'Logout',
        description: 'Invalidates the current session and clears cookies.',
        security: [{ BearerAuth: [] }, { CookieAuth: [] }],
        responses: {
          200: { description: 'Logged out' },
          401: { description: 'Not authenticated' },
        },
      },
    },
    '/auth/refresh-token': {
      post: {
        tags: ['Authentication'],
        summary: 'Refresh access token',
        description: 'Pass refresh_token in body or rely on the signed cookie.',
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RefreshTokenRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Token refreshed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponse' },
              },
            },
          },
          401: { description: 'Invalid refresh token' },
        },
      },
    },
    '/auth/forgot-password': {
      post: {
        tags: ['Authentication'],
        summary: 'Send password reset email',
        description: 'Always returns 200 to prevent email enumeration.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ForgotPasswordRequest' },
            },
          },
        },
        responses: {
          200: { description: 'Reset email sent (if account exists)' },
          429: { description: 'Rate limited' },
        },
      },
    },
    '/auth/reset-password': {
      post: {
        tags: ['Authentication'],
        summary: 'Reset password',
        description: 'Use the token from the password reset email.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ResetPasswordRequest' },
            },
          },
        },
        responses: {
          200: { description: 'Password reset successful' },
          401: { description: 'Invalid or expired token' },
          429: { description: 'Rate limited' },
        },
      },
    },
    '/auth/profile': {
      get: {
        tags: ['Profile'],
        summary: 'Get current user profile',
        security: [{ BearerAuth: [] }, { CookieAuth: [] }],
        responses: {
          200: {
            description: 'Profile data',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string' },
                    data: { $ref: '#/components/schemas/Profile' },
                  },
                },
              },
            },
          },
          401: { description: 'Not authenticated' },
        },
      },
      patch: {
        tags: ['Profile'],
        summary: 'Update current user profile',
        security: [{ BearerAuth: [] }, { CookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateProfileRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Profile updated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string' },
                    data: { $ref: '#/components/schemas/Profile' },
                  },
                },
              },
            },
          },
          400: { description: 'Validation error' },
          401: { description: 'Not authenticated' },
        },
      },
    },
  },
};

export const swaggerSpec = swaggerJSDoc({
  definition: swaggerDefinition,
  apis: [], // We define everything inline above
});

export default swaggerSpec;
