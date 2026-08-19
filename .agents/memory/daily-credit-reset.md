---
name: Daily credit reset startup
description: Startup ordering constraint for the scheduled free-credit reset.
---

The daily free-credit reset must wait for Mongoose's `connected` event when MongoDB buffering is disabled; running the initial update immediately during server startup can fail before the first connection is ready.

**Why:** `bufferCommands: false` intentionally rejects model operations before a connection exists, and a failed one-time startup reset would otherwise wait until the next scheduled run.

**How to apply:** Register the cron schedule immediately, but run the initial reset only after checking `readyState` or subscribing to the connection event.