// ─── Store Controller ────────────────────────────────────────────────────────
// Public and private endpoints for customer-facing store pages and seller settings.

import { Request, Response, NextFunction } from 'express';
import { sellerService } from '../services/seller.service';

export class StoreController {
  /**
   * Public: Retrieve a store by its unique slug.
   * GET /api/v1/store/:slug
   */
  public getStore = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const slug = req.params.slug as string;
      const store = await sellerService.getStoreBySlug(slug);

      res.status(200).json({
        success: true,
        data: store,
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * Private: Update store details for the authenticated logged-in seller.
   * PATCH /api/v1/store/update
   */
  public updateStore = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.userId!;
      const updatedProfile = await sellerService.update(userId, req.body);

      res.status(200).json({
        success: true,
        message: 'Store settings updated successfully.',
        data: updatedProfile,
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * Public: Get products listed by a store.
   * GET /api/v1/store/:slug/products or GET /api/v1/store/products?slug=...
   */
  public getProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const slug = (req.params.slug || req.query.slug) as string;
      if (!slug) {
        res.status(400).json({
          success: false,
          message: 'Slug parameter or query is required',
        });
        return;
      }

      const products = await sellerService.getStoreProducts(slug);

      res.status(200).json({
        success: true,
        data: products,
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * Public: Get store reviews and feedback rating.
   * GET /api/v1/store/:slug/reviews or GET /api/v1/store/reviews?slug=...
   */
  public getReviews = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const slug = (req.params.slug || req.query.slug) as string;
      if (!slug) {
        res.status(400).json({
          success: false,
          message: 'Slug parameter or query is required',
        });
        return;
      }

      const reviews = await sellerService.getStoreReviews(slug);

      res.status(200).json({
        success: true,
        data: reviews,
      });
    } catch (err) {
      next(err);
    }
  };
}

export const storeController = new StoreController();
export default storeController;
