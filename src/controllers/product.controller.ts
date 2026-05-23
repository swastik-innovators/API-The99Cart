import { Request, Response, NextFunction } from 'express';
import { productService } from '../services/product.service';
import { createProductSchema, updateProductSchema, productFiltersSchema } from '../validators/product.validator';

export class ProductController {
  /**
   * Private: Create new product record
   * POST /api/v1/products
   */
  public createProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sellerId = req.userId!;
      
      // Validate input
      const validationResult = createProductSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationResult.error.flatten().fieldErrors,
        });
        return;
      }

      const result = await productService.create(sellerId, validationResult.data);

      res.status(201).json({
        success: true,
        message: 'Product created successfully and live everywhere.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * Private: Update existing product details
   * PATCH /api/v1/products/:id
   */
  public updateProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sellerId = req.userId!;
      const id = req.params.id as string;

      // Validate input
      const validationResult = updateProductSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationResult.error.flatten().fieldErrors,
        });
        return;
      }

      const result = await productService.update(sellerId, id, validationResult.data);

      res.status(200).json({
        success: true,
        message: 'Product details updated successfully.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * Private: Delete a product
   * DELETE /api/v1/products/:id
   */
  public deleteProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sellerId = req.userId!;
      const id = req.params.id as string;

      await productService.delete(sellerId, id);

      res.status(200).json({
        success: true,
        message: 'Product deleted successfully.',
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * Private: Get seller's own products
   * GET /api/v1/products/my-products
   */
  public getSellerProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sellerId = req.userId!;
      const products = await productService.getSellerProducts(sellerId);

      res.status(200).json({
        success: true,
        data: products,
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * Private: Get seller's own product details by ID
   * GET /api/v1/products/my-products/:id
   */
  public getSellerProductById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sellerId = req.userId!;
      const id = req.params.id as string;
      
      const product = await productService.getSellerProductById(sellerId, id);

      res.status(200).json({
        success: true,
        data: product,
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * Public: Query products with filters, sorting, and pagination
   * GET /api/v1/products
   */
  public queryProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate and parse query parameters
      const filterResult = productFiltersSchema.safeParse(req.query);
      if (!filterResult.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid query filters provided',
          errors: filterResult.error.flatten().fieldErrors,
        });
        return;
      }

      const { products, total } = await productService.query(filterResult.data);
      const page = filterResult.data.page;
      const limit = filterResult.data.limit;

      res.status(200).json({
        success: true,
        data: products,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * Public: Get product by its unique slug
   * GET /api/v1/products/:slug
   */
  public getProductBySlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const slug = req.params.slug as string;
      const product = await productService.getBySlug(slug);

      res.status(200).json({
        success: true,
        data: product,
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * Public: Retrieve products listed by a store slug
   * GET /api/v1/store/:slug/products
   */
  public getStoreProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const slug = req.params.slug as string;
      const products = await productService.getProductsByStoreSlug(slug);

      res.status(200).json({
        success: true,
        data: products,
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * Public: Retrieve featured list
   * GET /api/v1/products/featured
   */
  public getFeaturedProducts = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const products = await productService.getFeatured();

      res.status(200).json({
        success: true,
        data: products,
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * Public: Retrieve trending list
   * GET /api/v1/products/trending
   */
  public getTrendingProducts = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const products = await productService.getTrending();

      res.status(200).json({
        success: true,
        data: products,
      });
    } catch (err) {
      next(err);
    }
  };
}

export const productController = new ProductController();
export default productController;
