import { supabaseAdmin } from '../config/supabase';
import { CreateProductInput, UpdateProductInput, ProductFilters, Product, ProductFile } from '../types/product';
import { logger } from '../config/logger';

export class ProductService {
  /**
   * Helper: Generate unique slug from title
   */
  private async generateUniqueSlug(title: string): Promise<string> {
    const baseSlug = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    
    let uniqueSlug = baseSlug;
    let counter = 1;
    let isUnique = false;

    while (!isUnique) {
      const { data, error } = await supabaseAdmin
        .from('products')
        .select('id')
        .eq('slug', uniqueSlug)
        .maybeSingle();

      if (error) {
        throw new Error(`Slug verification error: ${error.message}`);
      }

      if (!data) {
        isUnique = true;
      } else {
        uniqueSlug = `${baseSlug}-${counter}`;
        counter++;
      }
    }

    return uniqueSlug;
  }

  /**
   * Create a new product (Private: Seller only)
   */
  public async create(sellerId: string, input: CreateProductInput): Promise<{ product: Product; files: ProductFile[] }> {
    logger.info(`Creating product for seller ID: ${sellerId}`, { title: input.title });

    // Validate that seller profile exists and they have a store
    const { data: store, error: storeErr } = await supabaseAdmin
      .from('sellers')
      .select('id')
      .eq('id', sellerId)
      .maybeSingle();

    if (storeErr) {
      throw new Error(`Store validation failed: ${storeErr.message}`);
    }

    if (!store) {
      throw new Error('Seller onboarding profile does not exist. Please complete onboarding first.');
    }

    // Generate unique slug
    const slug = await this.generateUniqueSlug(input.title);

    // 1. Insert product details
    const { data: product, error: prodErr } = await supabaseAdmin
      .from('products')
      .insert({
        seller_id: sellerId,
        store_id: sellerId,
        title: input.title,
        slug,
        short_description: input.short_description,
        description: input.description,
        product_type: input.product_type,
        price: input.price,
        sale_price: input.sale_price,
        currency: input.currency || 'USD',
        sku: input.sku,
        stock: input.stock || 0,
        thumbnail: input.thumbnail,
        preview_images: input.preview_images || [],
        category_id: input.category_id,
        subcategory_id: input.subcategory_id,
        tags: input.tags || [],
        status: input.status || 'draft',
        brand: input.brand,
        featured: input.featured || false,
        seo_title: input.seo_title,
        seo_description: input.seo_description,
        seo_keywords: input.seo_keywords || [],
        variants: input.variants || [],
        labels: input.labels || [],
        gst: input.gst || 0.00,
        faqs: input.faqs || [],
        testimonials: input.testimonials || [],
        digital_link: input.digital_link || null,
        demo_url: input.demo_url || null,
        file_size: input.file_size || null,
        file_format: input.file_format || null,
        key_features: input.key_features || [],
        bundle_products: input.bundle_products || [],
      })
      .select()
      .single();

    if (prodErr) {
      logger.error('Failed to create product record', prodErr);
      throw new Error(`Failed to create product: ${prodErr.message}`);
    }

    // 2. Insert digital files metadata if any
    const createdFiles: ProductFile[] = [];
    if (input.product_type === 'digital' && input.files && input.files.length > 0) {
      const filesToInsert = input.files.map(f => ({
        product_id: product.id,
        file_name: f.file_name,
        file_url: f.file_url,
        file_type: f.file_type,
        file_size: f.file_size,
        storage_type: f.storage_type || 'supabase',
      }));

      const { data: filesData, error: fileErr } = await supabaseAdmin
        .from('product_files')
        .insert(filesToInsert)
        .select();

      if (fileErr) {
        logger.error('Product record was created, but digital files metadata insert failed', fileErr);
        // We delete product to ensure rollback integrity
        await supabaseAdmin.from('products').delete().eq('id', product.id);
        throw new Error(`Failed to save digital product files metadata: ${fileErr.message}`);
      }

      if (filesData) {
        createdFiles.push(...(filesData as ProductFile[]));
      }
    }

    return { product: product as Product, files: createdFiles };
  }

  /**
   * Update existing product details (Private: Seller only)
   */
  public async update(sellerId: string, id: string, input: UpdateProductInput): Promise<{ product: Product; files: ProductFile[] }> {
    logger.info(`Updating product ID: ${id} for seller ID: ${sellerId}`);

    // Verify ownership
    const { data: existing, error: verifyErr } = await supabaseAdmin
      .from('products')
      .select('id, title, slug')
      .eq('id', id)
      .eq('seller_id', sellerId)
      .maybeSingle();

    if (verifyErr || !existing) {
      throw new Error('Product not found or you do not have permission to edit it');
    }

    const updatePayload: any = { ...input };
    delete updatePayload.files; // Handle files separately

    // Handle slug change if title changes
    if (input.title && input.title !== existing.title) {
      updatePayload.slug = await this.generateUniqueSlug(input.title);
    }

    const { data: product, error: updateErr } = await supabaseAdmin
      .from('products')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (updateErr) {
      throw new Error(`Failed to update product details: ${updateErr.message}`);
    }

    // Sync files if provided
    const syncedFiles: ProductFile[] = [];
    if (input.files) {
      // 1. Delete old metadata records
      await supabaseAdmin.from('product_files').delete().eq('product_id', id);

      if (input.files.length > 0) {
        const filesToInsert = input.files.map(f => ({
          product_id: id,
          file_name: f.file_name,
          file_url: f.file_url,
          file_type: f.file_type,
          file_size: f.file_size,
          storage_type: f.storage_type || 'supabase',
        }));

        const { data: filesData, error: fileErr } = await supabaseAdmin
          .from('product_files')
          .insert(filesToInsert)
          .select();

        if (fileErr) {
          throw new Error(`Failed to sync digital product files metadata: ${fileErr.message}`);
        }
        if (filesData) {
          syncedFiles.push(...(filesData as ProductFile[]));
        }
      }
    } else {
      // Fetch existing files if not updated
      const { data: filesData } = await supabaseAdmin
        .from('product_files')
        .select('*')
        .eq('product_id', id);
      
      if (filesData) {
        syncedFiles.push(...(filesData as ProductFile[]));
      }
    }

    return { product: product as Product, files: syncedFiles };
  }

  /**
   * Delete a product record (Private: Seller only)
   */
  public async delete(sellerId: string, id: string): Promise<void> {
    logger.info(`Deleting product ID: ${id} for seller ID: ${sellerId}`);

    const { data: existing, error: verifyErr } = await supabaseAdmin
      .from('products')
      .select('id')
      .eq('id', id)
      .eq('seller_id', sellerId)
      .maybeSingle();

    if (verifyErr || !existing) {
      throw new Error('Product not found or you do not have permission to delete it');
    }

    const { error: deleteErr } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('id', id);

    if (deleteErr) {
      throw new Error(`Failed to delete product: ${deleteErr.message}`);
    }
  }

  /**
   * Private: Get all products for the active seller
   */
  public async getSellerProducts(sellerId: string): Promise<any[]> {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select(`
        *,
        product_files (*)
      `)
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to load seller products: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Private: Get single product details for seller owner
   */
  public async getSellerProductById(sellerId: string, id: string): Promise<any> {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select(`
        *,
        product_files (*)
      `)
      .eq('id', id)
      .eq('seller_id', sellerId)
      .maybeSingle();

    if (error || !data) {
      throw new Error('Product not found or unauthorized');
    }

    return data;
  }

  /**
   * Public: Query list of products with filters, search, and dynamic sorting
   */
  public async query(filters: ProductFilters): Promise<{ products: any[]; total: number }> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('products')
      .select(`
        *,
        sellers (
          store_name,
          store_slug,
          profile_image
        )
      `, { count: 'exact' });

    // Apply Filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    } else {
      query = query.eq('status', 'active'); // Default only active
    }

    if (filters.category_id) {
      query = query.eq('category_id', filters.category_id);
    }
    if (filters.subcategory_id) {
      query = query.eq('subcategory_id', filters.subcategory_id);
    }
    if (filters.featured !== undefined) {
      query = query.eq('featured', filters.featured);
    }
    if (filters.product_type) {
      query = query.eq('product_type', filters.product_type);
    }
    if (filters.min_price !== undefined) {
      query = query.gte('price', filters.min_price);
    }
    if (filters.max_price !== undefined) {
      query = query.lte('price', filters.max_price);
    }

    // Apply Search
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,short_description.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    // Sorting
    switch (filters.sort_by) {
      case 'price_asc':
        query = query.order('price', { ascending: true });
        break;
      case 'price_desc':
        query = query.order('price', { ascending: false });
        break;
      case 'popular':
        query = query.order('views', { ascending: false });
        break;
      case 'best_selling':
        query = query.order('total_sales', { ascending: false });
        break;
      case 'newest':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    // Pagination bounds
    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) {
      logger.error('Failed to query products from database', error);
      throw new Error(`Failed to list products: ${error.message}`);
    }

    return {
      products: data || [],
      total: count || 0,
    };
  }

  /**
   * Public: Retrieve a single product by its unique slug
   */
  public async getBySlug(slugOrId: string): Promise<any> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
    
    let query = supabaseAdmin
      .from('products')
      .select(`
        *,
        sellers (
          store_name,
          store_slug,
          profile_image,
          description
        ),
        product_files (*)
      `);

    if (isUuid) {
      query = query.eq('id', slugOrId);
    } else {
      query = query.eq('slug', slugOrId);
    }

    const { data, error } = await query.maybeSingle();

    if (error || !data) {
      throw new Error('Product not found');
    }

    // Increment view count asynchronously in background
    supabaseAdmin
      .rpc('increment_product_views', { product_id: data.id })
      .then(({ error: rpcErr }) => {
        if (rpcErr) {
          // If RPC is not created yet, do standard update query
          supabaseAdmin
            .from('products')
            .update({ views: data.views + 1 })
            .eq('id', data.id)
            .then(() => {});
        }
      });

    return data;
  }

  /**
   * Public: Get products from a specific store using its slug
   */
  public async getProductsByStoreSlug(storeSlug: string): Promise<any[]> {
    const { data: store, error: storeErr } = await supabaseAdmin
      .from('sellers')
      .select('id')
      .eq('store_slug', storeSlug)
      .maybeSingle();

    if (storeErr || !store) {
      throw new Error('Store not found');
    }

    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('store_id', store.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to load store products: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Public: Get trending or featured list
   */
  public async getFeatured(): Promise<any[]> {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select(`
        *,
        sellers (
          store_name,
          store_slug
        )
      `)
      .eq('featured', true)
      .eq('status', 'active')
      .limit(6)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to load featured products: ${error.message}`);
    }

    return data || [];
  }

  public async getTrending(): Promise<any[]> {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select(`
        *,
        sellers (
          store_name,
          store_slug
        )
      `)
      .eq('status', 'active')
      .limit(8)
      .order('views', { ascending: false });

    if (error) {
      throw new Error(`Failed to load trending products: ${error.message}`);
    }

    return data || [];
  }
}

export const productService = new ProductService();
export default productService;
