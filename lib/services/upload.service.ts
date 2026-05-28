import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary from env variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export interface UploadedFile {
  url: string;
  publicId: string;
}

export class UploadService {
  /**
   * Upload image buffer directly to Cloudinary.
   * Useful in Next.js Serverless API routes (avoids local temp files).
   */
  static async uploadImageBuffer(
    buffer: Buffer,
    folder = "products"
  ): Promise<UploadedFile> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `ecommerce/${folder}`,
          resource_type: "image",
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload stream error:", error);
            return reject(new Error(`Image upload failed: ${error.message}`));
          }
          if (!result) {
            return reject(new Error("Image upload failed: Empty response received."));
          }
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        }
      );

      // Write buffer to stream and end it
      uploadStream.end(buffer);
    });
  }

  /**
   * Delete an image from Cloudinary using its public ID
   */
  static async deleteImage(publicId: string): Promise<boolean> {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result.result === "ok";
    } catch (error) {
      console.error("Cloudinary delete error:", error);
      return false;
    }
  }
}
