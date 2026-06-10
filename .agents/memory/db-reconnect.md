---
name: MongoDB reconnect fix
description: How the DB auto-reconnect works and why bufferCommands:false needs an explicit reconnect handler
---

**Problem:** `mongoose.set('bufferCommands', false)` makes operations fail immediately when the connection drops momentarily. Without a reconnect trigger, the app stays broken until a full process restart.

**Fix in `server/config/database.js`:**
- `mongoose.connection.on('disconnected', ...)` handler calls `connectDB()` after 2s
- `isRetrying` boolean flag prevents multiple simultaneous retry loops
- `connectDB()` resets `isRetrying = false` on success or after MAX_RETRIES exhausted

**Why:** Mongoose does NOT auto-reconnect by default when `bufferCommands:false` — the disconnected event fires but nothing triggers a new `mongoose.connect()` call unless you do it explicitly.

**How to apply:** Always keep the `disconnected` handler in database.js. If you add reconnect logic elsewhere, check `isRetrying` first.
