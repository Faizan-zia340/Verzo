// Validation for user-uploaded images used as generation context.
// Pure functions — no I/O — so they are easy to unit test.
import { REQUIRED_FIELDS } from './validators.js';
import { getPurpose } from '../config/contentTypes.js';

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

// Plain name per content type, used for the default image prompt
// (article included so "an email" / "an ad" read correctly).
const IMAGE_TYPE_NAMES = {
  blog: 'a blog post',
  social: 'a social media post',
  email: 'an email',
  ad: 'an ad',
  product: 'a product description',
};

// Neutral stand-ins for required detail fields. Only used by the image
// route: the uploaded photo is the topic, so missing details must not
// block generation. The strict generateSchema is unchanged.
const IMAGE_DEFAULT_DETAILS = {
  topic: 'The photo',
  audience: 'General readers',
  product: 'The product in the photo',
  cta: 'Learn more',
  company: 'The company in the photo',
  role: 'The role in the photo',
  location: 'The location in the photo',
  senderName: 'The sender',
  applyLink: 'See the photo for the link',
  contact: 'See the photo for contact details',
  recipient: 'The recipient',
  deadline: 'No deadline given',
};

// ChatGPT-style image generation: upload a photo, pick a type, submit —
// no prompt or details needed. Fills a missing/short prompt with a
// type-aware default ("Write a blog post about what's in this photo.")
// and any missing required detail fields with neutral values, so the
// strict generateSchema passes. Returns a new object; the input is
// untouched. Only the /with-image route uses this — / and /stream stay
// strict (prompt and details still required there).
export const applyImageDefaults = (body = {}) => {
  const out = { ...body };
  const typeName = IMAGE_TYPE_NAMES[out.type] || 'a piece of content';
  if (typeof out.prompt !== 'string' || out.prompt.trim().length < 10) {
    out.prompt = `Write ${typeName} about what's in this photo.`;
  }
  // Same required-field resolution as missingRequiredFields in
  // validators.js (purpose config wins, else the per-type fields).
  const hasValue = (key) => typeof out[key] === 'string' && out[key].trim().length > 0;
  const purposeConfig = out.purpose ? getPurpose(out.type, out.purpose) : null;
  const required = purposeConfig ? purposeConfig.requiredFields : REQUIRED_FIELDS[out.type] || [];
  for (const field of required) {
    if (field.alt) {
      // Satisfied by either key — default the alternate one.
      if (!hasValue(field.key) && !hasValue(field.alt)) {
        out[field.alt] = IMAGE_DEFAULT_DETAILS[field.alt] ?? 'See the photo';
      }
    } else if (!hasValue(field.key)) {
      out[field.key] = IMAGE_DEFAULT_DETAILS[field.key] ?? 'The photo';
    }
  }
  return out;
};
