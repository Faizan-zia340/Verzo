import axios from 'axios';

// Separate instance from services/api.js on purpose: that instance defaults
// to 'Content-Type: application/json', which would break FormData uploads.
// With no Content-Type set here, axios lets the browser set
// multipart/form-data with the correct boundary.
const mediaApi = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || ''}/api`,
  withCredentials: true,
  timeout: 60000, // uploads can be slow; still never hang forever
});

// Upload one compressed image/audio file. Returns
// { mediaUrl, mediaPublicId, mediaType, bytes, contentId? }.
// Pass contentId to attach the upload to one of the caller's own history
// entries in the same call.
export const uploadMedia = async (file, contentId) => {
  const form = new FormData();
  form.append('file', file);
  if (contentId) form.append('contentId', contentId);
  const { data } = await mediaApi.post('/media/upload', form);
  return data;
};

export default { uploadMedia };
