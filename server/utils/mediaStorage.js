import logger from './logger.js';

// Hard caps — same numbers on client and server so neither side can be
// bypassed by skipping the client compression step.
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const MAX_IMAGE_DIMENSION = 1600;

// Thrown when the server has no Cloudinary keys. The route maps this to a
// 503 with a generic message — the provider name never reaches the user.
export class MediaNotConfiguredError extends Error {
  constructor() {
    super('Media uploads are not configured');
    this.name = 'MediaNotConfiguredError';
    this.status = 503;
  }
}

const isConfigured = () =>
  Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );

// One folder per user so one user's files can never be listed or cleaned
// up as another user's. ObjectIds are hex, but the sanitize keeps the
// folder safe even if a caller passes something unexpected.
const sanitizeFolderSegment = (value) =>
  String(value ?? '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64) || 'unknown';

export const buildUploadFolder = (userId) => `penlix/${sanitizeFolderSegment(userId)}`;

// Images: deliver small + modern. q_auto/f_auto let Cloudinary serve
// WebP/AVIF at the right quality; width caps the stored derivative at
// 1600px (crop: limit never upscales a smaller image).
export const imageTransformations = () => [
  { quality: 'auto', fetch_format: 'auto', width: MAX_IMAGE_DIMENSION, crop: 'limit' },
];

// Audio: mono-ish voice, 64k mp3. A 1-minute voice note lands near 100 KB.
// Cloudinary stores audio under resource_type 'video'.
export const audioTransformations = () => [{ audio_codec: 'mp3', bit_rate: '64k' }];

export const mediaResourceType = (mediaType) => (mediaType === 'audio' ? 'video' : 'image');

// Cloudinary is lazy-loaded: importing this module must never crash a
// server (or a test run) that has no cloudinary package / keys installed.
// Tests inject a fake client through `deps.cloudinary` instead.
let cachedClient = null;
const getCloudinary = async () => {
  if (cachedClient) return cachedClient;
  const mod = await import('cloudinary');
  const client = mod.v2;
  client.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  cachedClient = client;
  return client;
};

const assertConfigured = () => {
  if (!isConfigured()) throw new MediaNotConfiguredError();
};

const assertSize = (buffer) => {
  if (!Buffer.isBuffer(buffer)) throw new Error('Upload must be a Buffer');
  if (buffer.length > MAX_UPLOAD_BYTES) {
    const err = new Error('File is too large. Maximum upload size is 5 MB.');
    err.status = 413;
    throw err;
  }
};

// Multer gives us a memory buffer; Cloudinary's upload accepts a data URI,
// so the file never touches disk on our side either.
const toDataUri = (buffer, mimeType) => `data:${mimeType};base64,${buffer.toString('base64')}`;

const publicIdFor = (filename) =>
  `${Date.now()}-${sanitizeFolderSegment(String(filename || 'file').replace(/\.[^.]+$/, '')).slice(0, 32)}`;

export const uploadImage = async (
  buffer,
  { userId, filename = 'image', mimeType = 'image/jpeg' } = {},
  deps = {}
) => {
  assertConfigured();
  assertSize(buffer);
  const client = deps.cloudinary || (await getCloudinary());
  const result = await client.uploader.upload(toDataUri(buffer, mimeType), {
    folder: buildUploadFolder(userId),
    public_id: publicIdFor(filename),
    resource_type: 'image',
    transformation: imageTransformations(),
  });
  return {
    mediaUrl: result.secure_url,
    mediaPublicId: result.public_id,
    mediaType: 'image',
    bytes: result.bytes ?? buffer.length,
    format: result.format,
  };
};

export const uploadAudio = async (
  buffer,
  { userId, filename = 'audio', mimeType = 'audio/mpeg' } = {},
  deps = {}
) => {
  assertConfigured();
  assertSize(buffer);
  const client = deps.cloudinary || (await getCloudinary());
  const result = await client.uploader.upload(toDataUri(buffer, mimeType), {
    folder: buildUploadFolder(userId),
    public_id: publicIdFor(filename),
    resource_type: 'video',
    format: 'mp3',
    transformation: audioTransformations(),
  });
  return {
    mediaUrl: result.secure_url,
    mediaPublicId: result.public_id,
    mediaType: 'audio',
    bytes: result.bytes ?? buffer.length,
    format: result.format,
  };
};

// Best-effort by design: history delete must succeed even if Cloudinary is
// down or unconfigured. Never throws — callers treat { ok: false } as
// "file may still exist, try again later" and move on.
export const deleteMedia = async (publicId, { resourceType = 'image' } = {}, deps = {}) => {
  if (!publicId) return { ok: false, skipped: true };
  if (!isConfigured()) return { ok: false, skipped: true };
  try {
    const client = deps.cloudinary || (await getCloudinary());
    const result = await client.uploader.destroy(publicId, { resource_type: resourceType });
    // 'not found' means the file is already gone — that is also clean.
    return { ok: result?.result === 'ok' || result?.result === 'not found', result: result?.result };
  } catch (err) {
    logger.warn({ err: err.message, publicId }, 'Cloudinary delete failed (best-effort)');
    return { ok: false, error: err.message };
  }
};

export default { uploadImage, uploadAudio, deleteMedia, isConfigured, MediaNotConfiguredError };
