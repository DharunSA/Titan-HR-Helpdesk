// server/utils/cloudinaryUtils.js
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Extract public ID from Cloudinary URL
 * @param {string} url - Cloudinary URL
 * @returns {string} - Public ID
 */
export const extractPublicIdFromUrl = (url) => {
  if (!url) return null;
  const matches = url.match(/\/v\d+\/(.+)\./);
  return matches ? matches[1] : null;
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Public ID of the image
 */
export const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
    console.log(`✅ Deleted image from Cloudinary: ${publicId}`);
  } catch (error) {
    console.error(`❌ Failed to delete image from Cloudinary: ${error.message}`);
    throw error;
  }
};

/**
 * Validate if URL is from Cloudinary
 * @param {string} url - URL to validate
 * @returns {boolean}
 */
export const isCloudinaryUrl = (url) => {
  return url && url.includes('cloudinary.com');
};
