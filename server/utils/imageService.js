import getClient, { MODEL, API_VERSION } from '../config/gemini.js';

const getVisionModel = () => {
  const genAI = getClient();
  return genAI.getGenerativeModel({ model: MODEL }, { apiVersion: API_VERSION });
};

const downloadImageAsBase64 = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Image fetch failed: ${res.status}`);
  const buffer = await res.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  const mimeType = res.headers.get('content-type') || 'image/jpeg';
  return { base64, mimeType, dataUrl: `data:${mimeType};base64,${base64}` };
};

const analyzeImage = async (base64, mimeType) => {
  try {
    const model = getVisionModel();
    const result = await model.generateContent([
      { inlineData: { data: base64, mimeType } },
      `Analyze this image concisely. Return ONLY valid JSON with no markdown fences or extra text:
{"description":"One clear sentence describing what is shown in the image","extractedText":"Any text visible in the image translated to English — or empty string if no text is visible"}`,
    ]);
    const raw = result.response.text().trim().replace(/```json|```/g, '').trim();
    return JSON.parse(raw);
  } catch {
    return { description: '', extractedText: '' };
  }
};

const determinePlacements = async (content, imageDescriptions) => {
  const paragraphs = content.split(/\n\n+/).filter((p) => p.trim());
  const pCount = paragraphs.length;
  const iCount = imageDescriptions.length;

  // Even-spread fallback
  const fallback = imageDescriptions.map((_, i) => ({
    imageIndex: i,
    afterParagraph: Math.max(0, Math.floor(((i + 1) / (iCount + 1)) * pCount) - 1),
  }));

  if (!pCount || !iCount) return fallback;

  try {
    const numbered = paragraphs
      .map((p, i) => `[${i}] ${p.replace(/\n/g, ' ').slice(0, 120)}`)
      .join('\n');

    const model = getVisionModel();
    const result = await model.generateContent(
      `Place images inside a blog post. Spread them evenly — no two images at the same paragraph.

PARAGRAPHS (0-indexed, total ${pCount}):
${numbered}

IMAGES:
${imageDescriptions.map((d, i) => `Image ${i}: ${d}`).join('\n')}

Return ONLY a JSON array, no markdown:
[{"imageIndex":0,"afterParagraph":1},{"imageIndex":1,"afterParagraph":3}]
afterParagraph must be between 0 and ${pCount - 1}.`
    );

    const raw = result.response.text().trim().replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(raw);

    // Validate + deduplicate paragraph assignments
    const seen = new Set();
    return parsed
      .filter(
        (p) =>
          typeof p.imageIndex === 'number' &&
          typeof p.afterParagraph === 'number' &&
          p.afterParagraph >= 0 &&
          p.afterParagraph < pCount &&
          !seen.has(p.afterParagraph) &&
          seen.add(p.afterParagraph)
      );
  } catch {
    return fallback;
  }
};

/**
 * Fetch images from Unsplash, download them, and run Gemini Vision analysis.
 * Returns array of enriched image objects with base64 dataUrls and metadata.
 */
export const fetchAndAnalyzeImages = async (keywords = []) => {
  if (!process.env.UNSPLASH_ACCESS_KEY || !keywords.length) return [];

  try {
    const query = keywords.slice(0, 2).join(' ');
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=3&orientation=landscape`;
    const res = await fetch(url, {
      headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` },
    });
    if (!res.ok) return [];

    const data = await res.json();
    const photos = (data.results || []).slice(0, 3);
    if (!photos.length) return [];

    // Download + analyze all images in parallel
    const settled = await Promise.allSettled(
      photos.map(async (photo) => {
        const { base64, mimeType, dataUrl } = await downloadImageAsBase64(photo.urls.small);
        const analysis = await analyzeImage(base64, mimeType);
        return {
          dataUrl,
          url: photo.urls.small,
          thumb: photo.urls.thumb,
          alt: analysis.description || photo.alt_description || query,
          credit: `Photo by ${photo.user.name} on Unsplash`,
          creditUrl: `${photo.links.html}?utm_source=ai_content&utm_medium=referral`,
          photographer: photo.user.name,
          photographerUrl: `${photo.user.links.html}?utm_source=ai_content&utm_medium=referral`,
          extractedText: analysis.extractedText || '',
          geminiDescription: analysis.description || '',
        };
      })
    );

    return settled
      .filter((r) => r.status === 'fulfilled')
      .map((r) => r.value);
  } catch {
    return [];
  }
};

/**
 * Insert [IMAGE:N] markers into blog content at Gemini-chosen paragraph positions.
 */
export const embedImagesInContent = async (content, images) => {
  if (!images.length) return content;

  const descriptions = images.map((img) => img.geminiDescription || img.alt || '');
  const placements = await determinePlacements(content, descriptions);
  if (!placements.length) return content;

  const paragraphs = content.split(/\n\n+/);

  // Insert markers from back to front so indices stay valid
  const sorted = [...placements].sort((a, b) => b.afterParagraph - a.afterParagraph);
  for (const { imageIndex, afterParagraph } of sorted) {
    const idx = Math.min(Math.max(afterParagraph, 0), paragraphs.length - 1);
    paragraphs.splice(idx + 1, 0, `[IMAGE:${imageIndex}]`);
  }

  return paragraphs.join('\n\n');
};
