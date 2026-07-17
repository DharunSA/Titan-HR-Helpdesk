/**
 * Cloudinary upload utility
 * Handles image upload to Cloudinary cloud storage
 */

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Validate image file before upload
 * @param {File} file - The image file to validate
 * @returns {Object} - { valid: boolean, error: string | null }
 */
export const validateImageFile = (file) => {
  if (!file) {
    return { valid: false, error: 'No file selected' };
  }

  // Check file type
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'Only image files are allowed' };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size must be less than 5MB. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
    };
  }

  return { valid: true, error: null };
};

/**
 * Upload image to Cloudinary
 * @param {File|Blob} file - The image file or blob to upload
 * @param {string} folder - Cloudinary folder to upload to (e.g., 'employees/avatars')
 * @returns {Promise<string>} - Returns the Cloudinary URL
 */
export const uploadToCloudinary = async (file, folder = 'titan_employees') => {
  try {
    // Validate the file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Check configuration
    if (!CLOUDINARY_CLOUD_NAME || !UPLOAD_PRESET) {
      throw new Error('Cloudinary configuration is not set. Please check your environment variables.');
    }

    // Create FormData for upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('folder', folder);

    // Upload to Cloudinary
    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to upload image');
    }

    const data = await response.json();
    return data.secure_url; // Return the secure URL
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

/**
 * Delete image from Cloudinary (requires server-side implementation with API key)
 * For now, we'll keep the logic on the server side for security
 */
export const deleteFromCloudinary = async (publicId) => {
  try {
    // This would be called via your backend API endpoint
    // We don't expose the Cloudinary API secret to the frontend
    const response = await fetch('/api/employees/delete-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publicId }),
    });

    if (!response.ok) {
      throw new Error('Failed to delete image');
    }

    return true;
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    throw error;
  }
};
