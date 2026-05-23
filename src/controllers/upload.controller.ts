import { Request, Response, NextFunction } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import { supabaseAdmin } from '../config/supabase';
import { logger } from '../config/logger';

export class UploadController {
  /**
   * Upload image to Cloudinary
   * POST /api/v1/upload/image
   */
  public uploadImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const folder = (req.query.folder as string) || 'products';
      const allowedFolders = ['products', 'stores', 'avatars', 'previews'];
      
      if (!allowedFolders.includes(folder)) {
        res.status(400).json({
          success: false,
          message: `Invalid folder target. Allowed values: ${allowedFolders.join(', ')}`,
        });
        return;
      }

      if (!req.files && !req.file) {
        res.status(400).json({
          success: false,
          message: 'No files provided for upload',
        });
        return;
      }

      const files = req.files 
        ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat())
        : [req.file!];

      const uploadPromises = files.map(file => {
        return new Promise<string>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: `99cart/${folder}`,
              resource_type: 'image',
              quality: 'auto',
              fetch_format: 'auto',
            },
            (error, result) => {
              if (error) {
                logger.error('Cloudinary stream upload failed', error);
                reject(new Error(`Cloudinary upload failed: ${error.message}`));
              } else {
                resolve(result!.secure_url);
              }
            }
          );
          uploadStream.end(file.buffer);
        });
      });

      const urls = await Promise.all(uploadPromises);

      res.status(200).json({
        success: true,
        message: 'Images uploaded successfully to Cloudinary',
        data: urls.length === 1 ? { url: urls[0] } : { urls },
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * Upload digital downloads or pack files to Supabase Storage
   * POST /api/v1/upload/product-files
   */
  public uploadProductFiles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const folder = (req.query.folder as string) || 'product-files';
      const allowedFolders = ['product-files', 'seller-files', 'bundle-files'];

      if (!allowedFolders.includes(folder)) {
        res.status(400).json({
          success: false,
          message: `Invalid folder target. Allowed values: ${allowedFolders.join(', ')}`,
        });
        return;
      }

      if (!req.files && !req.file) {
        res.status(400).json({
          success: false,
          message: 'No digital product assets provided',
        });
        return;
      }

      const files = req.files
        ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat())
        : [req.file!];

      const uploadPromises = files.map(async file => {
        const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${file.originalname}`;
        const filePath = `${folder}/${uniqueFileName}`;

        // Upload directly to Supabase storage bucket named 'downloads' or fallback bucket 'digital-downloads'
        const bucketName = 'digital-downloads';

        // Check/Create bucket silently if possible, or directly upload to it
        try {
          await supabaseAdmin.storage.createBucket(bucketName, {
            public: true,
          });
        } catch (bucketErr) {
          // Silently ignore if bucket already exists
        }

        const { error } = await supabaseAdmin.storage
          .from(bucketName)
          .upload(filePath, file.buffer, {
            contentType: file.mimetype,
            upsert: true,
          });

        if (error) {
          logger.error('Supabase storage upload failed', error);
          throw new Error(`Supabase Storage upload failed: ${error.message}`);
        }

        // Generate public url or download url
        const { data: { publicUrl } } = supabaseAdmin.storage
          .from(bucketName)
          .getPublicUrl(filePath);

        return {
          file_name: file.originalname,
          file_url: publicUrl,
          file_type: file.mimetype,
          file_size: file.size,
          storage_type: 'supabase' as const,
        };
      });

      const uploadedFiles = await Promise.all(uploadPromises);

      res.status(200).json({
        success: true,
        message: 'Digital assets uploaded successfully to Supabase Storage',
        data: uploadedFiles.length === 1 ? uploadedFiles[0] : { files: uploadedFiles },
      });
    } catch (err) {
      next(err);
    }
  };
}

export const uploadController = new UploadController();
export default uploadController;
