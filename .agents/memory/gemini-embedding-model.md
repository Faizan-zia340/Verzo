---
name: Gemini embedding model name
description: Correct Gemini embedding model/API version to use for embedContent calls
---

`text-embedding-004` returns 404 Not Found via `@google/generative-ai` SDK on this account/key, regardless of `v1` or `v1beta` apiVersion.

`gemini-embedding-001` works reliably on `v1` apiVersion and returns 3072-dimension vectors.

**Why:** Discovered while building RAG semantic search — the documented/older embedding model name is no longer valid for this API key, likely due to a Gemini API model lineup change.

**How to apply:** When calling `genAI.getGenerativeModel({ model }, { apiVersion })` for embeddings, use `model: 'gemini-embedding-001'` and `apiVersion: 'v1'`. If this stops working in the future, re-run a quick probe script trying `text-embedding-004`, `gemini-embedding-001`, `embedding-001` across `v1`/`v1beta` before assuming the whole embeddings feature is broken.
