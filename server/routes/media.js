import { Router } from 'express';
import multer from 'multer';
import protect from '../middleware/auth.js';
import userRateLimit from '../middleware/userRateLimit.js';
import uploadLimit from '../middleware/uploadLimit.js';
import asyncHandler from '../utils/asyncHandler.js';
import Content from '../models/Content.js';
import {
  uploadImage,
  uploadAudio,
  deleteMedia,
  mediaResourceType,
  MediaNotConfiguredError,
  MAX_UPLOAD_BYTES,
} from '../utils/mediaStorage.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES },
  fileFilter: (_req, file, cb) => {
    const okImage = /^image\/(jpeg|png|webp|gif)$/.test(file.mimetype);
    const okAudio = /^audio\/(mpeg|wav|webm|ogg|mp4|x-m4a)$/.test(file.mimetype);
    if (okImage || okAudio) return cb(null, true);
    cb(new Error('Only images (JPG, PNG, WebP, GIF) or audio (MP3, WAV, WebM, OGG, M4A) up to 5 MB are allowed.'));
  },
});

const handleUploadError = (err, _req, res, next) => {
  if (!err) return next();
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ message: 'File is too large. Maximum upload size is 5 MB.' });
  }
  return res.status(400).json({ message: err.message || 'Invalid upload.' });
};

// Uploads are storage, not generation: no credit is charged here.
// Abuse is bounded by auth + 20 uploads/hour per user + the 5 MB cap +
// the daily upload-count limit (uploadLimit, after multer so rejected
// files never count).
router.post(
  '/upload',
  protect,
  userRateLimit(20, 'Media upload'),
  upload.single('file'),
  handleUploadError,
  uploadLimit('image'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'Attach one image or audio file (max 5 MB).' });
    }
    const isAudio = req.file.mimetype.startsWith('audio/');
    let media;
    try {
      media = isAudio
        ? await uploadAudio(req.file.buffer, {
            userId: req.user._id,
            filename: req.file.originalname,
            mimeType: req.file.mimetype,
          })
        : await uploadImage(req.file.buffer, {
            userId: req.user._id,
            filename: req.file.originalname,
            mimeType: req.file.mimetype,
          });
    } catch (err) {
      if (err instanceof MediaNotConfiguredError) {
        return res
          .status(503)
          .json({ message: 'Media uploads are not available right now. Please try again later.' });
      }
      if (err.status === 413) return res.status(413).json({ message: err.message });
      throw err;
    }

    // Optional: attach the upload to one of the caller's own history entries.
    // If the id does not belong to this user, delete the just-uploaded file
    // again so a failed attach never leaves an orphan file behind.
    if (req.body.contentId) {
      const content = await Content.findOneAndUpdate(
        { _id: req.body.contentId, user: req.user._id },
        {
          $set: {
            mediaUrl: media.mediaUrl,
            mediaPublicId: media.mediaPublicId,
            mediaType: media.mediaType,
            updatedAt: new Date(),
          },
        },
        { new: true, runValidators: true }
      );
      if (!content) {
        await deleteMedia(media.mediaPublicId, { resourceType: mediaResourceType(media.mediaType) });
        return res.status(404).json({ message: 'Content not found' });
      }
      return res.status(200).json({ ...media, contentId: content._id });
    }

    return res.status(200).json(media);
  })
);

export default router;
