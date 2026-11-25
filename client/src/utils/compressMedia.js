// Client-side compression, run BEFORE upload so the small file is what
// travels over the wire and what gets stored. If a browser cannot do a
// step (no canvas, no MediaRecorder, undecodable audio), the original file
// is returned untouched and Cloudinary's server-side transformation
// (q_auto/f_auto for images, mp3 64k for audio) is the fallback —
// compression then still happens, just after upload instead of before.

// Keep in sync with server/utils/mediaStorage.js MAX_UPLOAD_BYTES.
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const MAX_IMAGE_DIMENSION = 1600;
export const IMAGE_QUALITY = 0.8;
export const AUDIO_BIT_RATE = 64000;

const isImageFile = (file) => file?.type?.startsWith('image/');
const isAudioFile = (file) => file?.type?.startsWith('audio/');

export const isSupportedMedia = (file) => isImageFile(file) || isAudioFile(file);

// Pure + tested: scale down to fit maxDim on the long edge, never upscale.
export const computeTargetSize = (width, height, maxDim = MAX_IMAGE_DIMENSION) => {
  if (!width || !height) return { width, height };
  const scale = Math.min(1, maxDim / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
};

const fallbackResult = (file) => ({
  blob: file,
  name: file.name,
  type: file.type,
  originalBytes: file.size,
  compressedBytes: file.size,
  compressed: false,
});

// Image -> WebP via canvas. A 5 MB phone photo (4000x3000) becomes
// ~1600x1200 WebP at 80% quality, roughly 200-300 KB.
export const compressImage = async (
  file,
  { maxDim = MAX_IMAGE_DIMENSION, quality = IMAGE_QUALITY } = {}
) => {
  const fallback = fallbackResult(file);
  try {
    if (typeof document === 'undefined' || typeof createImageBitmap !== 'function') return fallback;
    const bitmap = await createImageBitmap(file);
    const { width, height } = computeTargetSize(bitmap.width, bitmap.height, maxDim);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return fallback;
    ctx.drawImage(bitmap, 0, 0, width, height);
    if (typeof bitmap.close === 'function') bitmap.close();
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
    if (!blob) return fallback;
    return {
      blob,
      name: file.name.replace(/\.[^.]+$/, '') + '.webp',
      type: 'image/webp',
      originalBytes: file.size,
      compressedBytes: blob.size,
      compressed: true,
    };
  } catch {
    return fallback;
  }
};

// Audio -> low-bitrate re-encode via Web Audio + MediaRecorder.
// Best-effort: if the browser cannot decode the file or has no
// MediaRecorder, the original is returned and Cloudinary converts it
// to mp3 64k on the server side instead.
export const compressAudio = async (file, { bitRate = AUDIO_BIT_RATE } = {}) => {
  const fallback = fallbackResult(file);
  try {
    if (
      typeof window === 'undefined' ||
      typeof MediaRecorder === 'undefined' ||
      typeof AudioContext === 'undefined'
    ) {
      return fallback;
    }
    const arrayBuffer = await file.arrayBuffer();
    const audioCtx = new AudioContext();
    let audioBuffer;
    try {
      audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    } catch {
      await audioCtx.close().catch(() => {});
      return fallback;
    }
    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    const dest = audioCtx.createMediaStreamDestination();
    source.connect(dest);
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : undefined;
    const recorder = new MediaRecorder(dest.stream, {
      ...(mimeType ? { mimeType } : {}),
      audioBitsPerSecond: bitRate,
    });
    const chunks = [];
    recorder.ondataavailable = (event) => {
      if (event.data?.size) chunks.push(event.data);
    };
    const stopped = new Promise((resolve) => {
      recorder.onstop = resolve;
    });
    source.onended = () => {
      try {
        recorder.stop();
      } catch {
        /* already stopped */
      }
    };
    recorder.start();
    source.start();
    await stopped;
    await audioCtx.close().catch(() => {});
    const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
    if (!blob.size) return fallback;
    return {
      blob,
      name: file.name.replace(/\.[^.]+$/, '') + '.webm',
      type: blob.type,
      originalBytes: file.size,
      compressedBytes: blob.size,
      compressed: true,
    };
  } catch {
    return fallback;
  }
};

// Dispatcher: image -> WebP, audio -> low-bitrate, anything else passes
// through untouched (the server still rejects unsupported types).
export const compressMedia = async (file, options = {}) => {
  if (isImageFile(file)) return compressImage(file, options);
  if (isAudioFile(file)) return compressAudio(file, options);
  return fallbackResult(file);
};

export default { compressMedia, compressImage, compressAudio, computeTargetSize, isSupportedMedia };
