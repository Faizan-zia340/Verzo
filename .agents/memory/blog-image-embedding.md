---
name: Blog image embedding
description: How blog-post images are fetched, analyzed, saved, and embedded inline
---

## Design

- **Blog posts only** — only `type === 'blog'` triggers the full image pipeline. Other types keep the old sidebar Unsplash URL display.
- **Saved as base64** — images are downloaded from Unsplash `small` URL (~400px, ~50KB) and stored as `dataUrl` (data:image/jpeg;base64,...) inside the `Content.images[]` array in MongoDB. Not just links.
- **Gemini Vision per image** — each downloaded image is analyzed with `gemini-2.5-flash-lite` via `inlineData` to get `{description, extractedText}`. `extractedText` is translated to English.
- **AI-determined placement** — a second Gemini call receives numbered paragraphs + image descriptions and returns JSON placements `[{imageIndex, afterParagraph}]`.
- **[IMAGE:N] markers** — markers are spliced between paragraphs in `output`; stored in the DB. Frontend splits on the pattern and renders inline images with caption + credit.
- **Fallback** — if Gemini placement call fails, images are spread evenly. If Unsplash key is missing, no images (feature is silently skipped).

## Key files

- `server/utils/imageService.js` — `fetchAndAnalyzeImages()`, `embedImagesInContent()`
- `server/controllers/generatorController.js` — calls imageService for blog type; sends `{contentWithImages}` in SSE done event
- `server/models/Content.js` — images schema includes `dataUrl`, `credit`, `creditUrl`, `extractedText`, `geminiDescription`
- `client/src/components/Generator.jsx` — `renderContent()` parses markers, PDF/DOCX exports embed actual images

## SSE flow

1. Tokens stream in real-time → `setOutput(prev + token)`
2. After streaming: backend fetches + analyzes images (3-5s), sends `{status: "Fetching..."}` event
3. Done event: `{done, seoData, images, contentWithImages, contentId}`
4. Frontend: `setOutput(contentWithImages)` replaces streamed text with marker-embedded version

## Activation requirement

`UNSPLASH_ACCESS_KEY` must be set in Replit Secrets. Without it, the feature is silently skipped and no images are shown.

**Why base64 not URLs:** User requirement — "Don't bring the link. Save it yourself." URLs can expire; base64 is permanently stored with the content.
