// ─── Seller Controller ───────────────────────────────────────────────────────
// Express controller endpoints for seller profile onboarding operations.

import { Request, Response, NextFunction } from 'express';
import { sellerService } from '../services/seller.service';

export class SellerController {
  /**
   * Complete onboarding and create a new seller profile.
   * POST /api/v1/seller/create
   */
  public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.userId!;
      const newProfile = await sellerService.create(userId, req.body);

      res.status(201).json({
        success: true,
        message: 'Onboarding completed successfully! Your store profile is now active.',
        data: newProfile,
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * Update an existing seller store profile.
   * PATCH /api/v1/seller/update
   */
  public update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.userId!;
      const updatedProfile = await sellerService.update(userId, req.body);

      res.status(200).json({
        success: true,
        message: 'Seller store profile updated successfully.',
        data: updatedProfile,
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * Retrieve active seller profile details.
   * GET /api/v1/seller/profile
   */
  public getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.userId!;
      const profile = await sellerService.getProfile(userId);

      res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * Get onboarding completed status.
   * GET /api/v1/seller/status
   */
  public getStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.userId!;
      const status = await sellerService.getStatus(userId);

      res.status(200).json({
        success: true,
        data: status,
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * Check if a store slug is unique and available.
   * GET /api/v1/seller/check-slug
   */
  public checkSlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const slug = req.query.slug as string;
      if (!slug) {
        res.status(400).json({
          success: false,
          message: 'Slug query parameter is required',
        });
        return;
      }

      const isUnique = await sellerService.isSlugUnique(slug);

      res.status(200).json({
        success: true,
        data: {
          available: isUnique,
        },
      });
    } catch (err) {
      next(err);
    }
  };
}

export const sellerController = new SellerController();
export default sellerController;
