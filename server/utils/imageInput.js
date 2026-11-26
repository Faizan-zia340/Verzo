// Validation for user-uploaded images used as generation context.
// Pure functions — no I/O — so they are easy to unit test.

export const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

// Validates a multer memory-storage file object. Returns null when valid,
// otherwise a human-readable error message for the 400 response.
export const validateImageFile = (file) => {
  if (!file) return 'An image file is required (field name "image").';
  if (!ALLOWED_IMAGE_MIMES.includes(file.mimetype)) {
    return `Unsupported image type "${file.mimetype}". Use JPG, PNG or WebP.`;
  }
  if (!file.buffer || !file.buffer.length) return 'The uploaded image is empty.';
  if (file.buffer.length > MAX_IMAGE_BYTES) {
    return `Image is too large (${(file.buffer.length / 1024 / 1024).toFixed(1)} MB). Maximum is 5 MB.`;
  }
  return null;
};
