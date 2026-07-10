---
name: Error handler operational status codes
description: Which HTTP status codes should be treated as "operational" (expected) vs programmer errors in the global error handler
---

The global Express error handler distinguishes "operational" errors (expected, safe to show the real message) from "programmer" errors (unexpected, message gets replaced with a generic "something went wrong" string when status >= 500).

503 (Service Unavailable) must be in the operational set, not just 4xx codes.

**Why:** Upstream AI provider overload (e.g. Gemini returning 503 "model currently overloaded") is a normal, expected, transient condition — not a bug in this app's code. If 503 isn't classified as operational, the error handler swallows the real message and users/logs lose the actionable "try again shortly" context, making transient upstream issues indistinguishable from real bugs.

**How to apply:** When adding new upstream integrations that can return 503/429/timeout-style errors, make sure those status codes are in the operational allowlist in the error handler, and that the thrown error carries `statusCode` matching the real upstream status.
