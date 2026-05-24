import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { ApiError } from '../utils/api-error';
import { logger } from '../config/logger';

export class SellerExtraController {
  // ─── 1. ORDERS ─────────────────────────────────────────────────────────────
  public getOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sellerId = req.userId!;
      
      const { data: orders, error } = await supabaseAdmin
        .from('orders')
        .select(`
          *,
          products (
            title,
            thumbnail,
            price
          )
        `)
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false });

      if (error) {
        throw ApiError.internal(`Failed to fetch orders: ${error.message}`);
      }

      res.status(200).json({
        success: true,
        data: orders || [],
      });
    } catch (err) {
      next(err);
    }
  };

  public updateOrderStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sellerId = req.userId!;
      const { id } = req.params;
      const { status, message } = req.body;

      if (!status) {
        throw ApiError.badRequest('Status is required');
      }

      // Fetch existing order to verify ownership
      const { data: order, error: fetchErr } = await supabaseAdmin
        .from('orders')
        .select('timeline, status')
        .eq('id', id)
        .eq('seller_id', sellerId)
        .maybeSingle();

      if (fetchErr || !order) {
        throw ApiError.notFound('Order not found or unauthorized');
      }

      const timeline = order.timeline || [];
      const newLog = {
        status,
        timestamp: new Date().toISOString(),
        message: message || `Order status updated to ${status}`
      };
      
      const updatedTimeline = [...timeline, newLog];

      const { data: updatedOrder, error: updateErr } = await supabaseAdmin
        .from('orders')
        .update({
          status,
          timeline: updatedTimeline
        })
        .eq('id', id)
        .select()
        .single();

      if (updateErr) {
        throw ApiError.internal(`Failed to update order: ${updateErr.message}`);
      }

      res.status(200).json({
        success: true,
        message: 'Order status updated successfully.',
        data: updatedOrder,
      });
    } catch (err) {
      next(err);
    }
  };

  // ─── 2. COUPONS ────────────────────────────────────────────────────────────
  public getCoupons = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sellerId = req.userId!;
      
      const { data: coupons, error } = await supabaseAdmin
        .from('coupons')
        .select('*')
        .eq('store_id', sellerId)
        .order('created_at', { ascending: false });

      if (error) {
        throw ApiError.internal(`Failed to fetch coupons: ${error.message}`);
      }

      res.status(200).json({
        success: true,
        data: coupons || [],
      });
    } catch (err) {
      next(err);
    }
  };

  public createCoupon = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sellerId = req.userId!;
      const { code, discount_type, discount_value, expires_at, usage_limit } = req.body;

      if (!code || !discount_type || discount_value === undefined) {
        throw ApiError.badRequest('Missing required coupon parameters');
      }

      const { data: coupon, error } = await supabaseAdmin
        .from('coupons')
        .insert({
          store_id: sellerId,
          code: code.toUpperCase().trim(),
          discount_type,
          discount_value: parseFloat(discount_value),
          expires_at: expires_at || null,
          usage_limit: usage_limit ? parseInt(usage_limit, 10) : null,
          usage_count: 0
        })
        .select()
        .single();

      if (error) {
        if (error.message.includes('unique')) {
          throw ApiError.badRequest('Coupon code already exists for this store.');
        }
        throw ApiError.internal(`Failed to create coupon: ${error.message}`);
      }

      res.status(201).json({
        success: true,
        message: 'Coupon created successfully.',
        data: coupon,
      });
    } catch (err) {
      next(err);
    }
  };

  public deleteCoupon = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sellerId = req.userId!;
      const { id } = req.params;

      const { error } = await supabaseAdmin
        .from('coupons')
        .delete()
        .eq('id', id)
        .eq('store_id', sellerId);

      if (error) {
        throw ApiError.internal(`Failed to delete coupon: ${error.message}`);
      }

      res.status(200).json({
        success: true,
        message: 'Coupon deleted successfully.',
      });
    } catch (err) {
      next(err);
    }
  };

  // ─── 3. REVIEWS ────────────────────────────────────────────────────────────
  public getReviews = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sellerId = req.userId!;

      const { data: reviews, error } = await supabaseAdmin
        .from('reviews')
        .select(`
          *,
          products (
            title,
            thumbnail
          )
        `)
        .eq('store_id', sellerId)
        .order('created_at', { ascending: false });

      if (error) {
        throw ApiError.internal(`Failed to fetch reviews: ${error.message}`);
      }

      res.status(200).json({
        success: true,
        data: reviews || [],
      });
    } catch (err) {
      next(err);
    }
  };

  // ─── 4. PAYMENTS & WITHDRAWALS ──────────────────────────────────────────────
  public getPayments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sellerId = req.userId!;

      // Fetch completed orders to sum revenue
      const { data: completedOrders, error: orderErr } = await supabaseAdmin
        .from('orders')
        .select('amount')
        .eq('seller_id', sellerId)
        .eq('status', 'delivered');

      if (orderErr) {
        throw ApiError.internal(`Failed to calculate balance: ${orderErr.message}`);
      }

      const totalRevenue = completedOrders?.reduce((sum, o) => sum + Number(o.amount), 0) || 0;

      // Fetch withdrawal requests
      const { data: withdrawals, error: wErr } = await supabaseAdmin
        .from('withdrawals')
        .select('*')
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false });

      if (wErr) {
        throw ApiError.internal(`Failed to fetch withdrawals: ${wErr.message}`);
      }

      const totalWithdrawn = withdrawals
        ?.filter(w => w.status === 'approved')
        .reduce((sum, w) => sum + Number(w.amount), 0) || 0;

      const totalPending = withdrawals
        ?.filter(w => w.status === 'pending')
        .reduce((sum, w) => sum + Number(w.amount), 0) || 0;

      const availableBalance = Math.max(0, totalRevenue - totalWithdrawn - totalPending);

      res.status(200).json({
        success: true,
        data: {
          balance: {
            available: availableBalance,
            pending: totalPending,
            total_earned: totalRevenue,
            withdrawn: totalWithdrawn
          },
          transactions: withdrawals || []
        }
      });
    } catch (err) {
      next(err);
    }
  };

  public requestWithdrawal = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sellerId = req.userId!;
      const { amount } = req.body;

      if (!amount || parseFloat(amount) <= 0) {
        throw ApiError.badRequest('Valid withdrawal amount is required');
      }

      // Check balance first
      const { data: completedOrders } = await supabaseAdmin
        .from('orders')
        .select('amount')
        .eq('seller_id', sellerId)
        .eq('status', 'delivered');

      const { data: withdrawals } = await supabaseAdmin
        .from('withdrawals')
        .select('*')
        .eq('seller_id', sellerId);

      const totalRevenue = completedOrders?.reduce((sum, o) => sum + Number(o.amount), 0) || 0;
      const totalWithdrawn = withdrawals?.filter(w => w.status === 'approved').reduce((sum, w) => sum + Number(w.amount), 0) || 0;
      const totalPending = withdrawals?.filter(w => w.status === 'pending').reduce((sum, w) => sum + Number(w.amount), 0) || 0;

      const available = totalRevenue - totalWithdrawn - totalPending;

      if (parseFloat(amount) > available) {
        throw ApiError.badRequest('Insufficient available balance for withdrawal');
      }

      const { data: withdrawal, error } = await supabaseAdmin
        .from('withdrawals')
        .insert({
          seller_id: sellerId,
          amount: parseFloat(amount),
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        throw ApiError.internal(`Failed to request payout: ${error.message}`);
      }

      res.status(201).json({
        success: true,
        message: 'Payout withdrawal requested successfully. Processed within 3 business days.',
        data: withdrawal
      });
    } catch (err) {
      next(err);
    }
  };

  // ─── 5. SUPPORT TICKETS ────────────────────────────────────────────────────
  public getTickets = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sellerId = req.userId!;

      const { data: tickets, error } = await supabaseAdmin
        .from('support_tickets')
        .select('*')
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false });

      if (error) {
        throw ApiError.internal(`Failed to fetch tickets: ${error.message}`);
      }

      res.status(200).json({
        success: true,
        data: tickets || []
      });
    } catch (err) {
      next(err);
    }
  };

  public createTicket = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sellerId = req.userId!;
      const { title, message } = req.body;

      if (!title || !message) {
        throw ApiError.badRequest('Title and message are required');
      }

      const { data: ticket, error } = await supabaseAdmin
        .from('support_tickets')
        .insert({
          seller_id: sellerId,
          title,
          message,
          status: 'open'
        })
        .select()
        .single();

      if (error) {
        throw ApiError.internal(`Failed to create support ticket: ${error.message}`);
      }

      res.status(201).json({
        success: true,
        message: 'Support ticket registered successfully.',
        data: ticket
      });
    } catch (err) {
      next(err);
    }
  };

  // ─── 6. AI CO-PILOT ────────────────────────────────────────────────────────
  public generateProductListing = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { title, keywords } = req.body;
      if (!title) {
        throw ApiError.badRequest('Product title is required');
      }

      const cleanKeywords = keywords || 'digital asset, template, source code';

      // Fallback high-quality template response
      const aiResponse = {
        title: `${title} - Ultimate SaaS Template Kit`,
        description: `### ⚡ Features\n- **Production-ready Architecture**: Built with React & Next.js.\n- **Scalable Codebase**: Meticulously structured code folders.\n- **Modern Styling**: Responsive layouts with Tailwind CSS.\n\n### 📦 What's Inside\n- Full backend integration instructions\n- Premium Figma file links\n- Responsive components catalog`,
        seo_title: `Download ${title} | The99Cart Marketplace`,
        seo_description: `Get the premium ${title} template. Clean code, customizable components, and lifetime support. Download instantly on The99Cart.`,
        tags: [title.toLowerCase().replace(/\s+/g, '-'), 'nextjs', 'saas', 'tailwind', 'boilerplate'],
        faqs: [
          { question: "Is support included?", answer: "Yes! Lifetime updates and active developer support are included." },
          { question: "Can I use this for client commercial projects?", answer: "Yes, our licenses cover commercial usages for one production domain." }
        ]
      };

      res.status(200).json({
        success: true,
        data: aiResponse
      });
    } catch (err) {
      next(err);
    }
  };

  public getAiGrowth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { conversionRate, bounceRate } = req.body;

      const recommendations = [];
      if (conversionRate && parseFloat(conversionRate) < 2.0) {
        recommendations.push({
          issue: "Low conversion rate (< 2%)",
          solution: "Consider adding a Live Demo video or including dynamic product FAQs to resolve user doubts before buying."
        });
      }
      if (bounceRate && parseFloat(bounceRate) > 60) {
        recommendations.push({
          issue: "High storefront bounce rate",
          solution: "Optimize store load speed, verify thumbnail resolutions, and add a striking banner in the Store Builder."
        });
      }

      if (recommendations.length === 0) {
        recommendations.push({
          issue: "Healthy conversion & traffic",
          solution: "Keep sharing your short links on LinkedIn, Twitter, and developer communities to boost your impressions!"
        });
      }

      res.status(200).json({
        success: true,
        data: {
          tips: recommendations
        }
      });
    } catch (err) {
      next(err);
    }
  };
}

export const sellerExtraController = new SellerExtraController();
export default sellerExtraController;
