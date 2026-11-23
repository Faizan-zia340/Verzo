// ── Verzo-branded quota / availability messages ─────────────────────
// Every message users can see must be branded "Verzo" only. Provider
// names (Gemini, Google, OpenAI, ...) must NEVER reach the client —
// they stay in server logs. This module is the single place that maps
// raw AI-provider errors to safe, user-facing Verzo messages.

const PROVIDER_NAME_PATTERN = /\b(gemini|google|openai|gpt-?\d|claude|anthropic|llama|meta ai)\b/i;

export const containsProviderName = (text) => PROVIDER_NAME_PATTERN.test(String(text || ''));

// "in 3 minute(s)" / "in a few seconds" — human wait time for a retry.
export const formatWait = (retryAfterSec) => {
  if (!retryAfterSec || retryAfterSec <= 0) return 'a few minutes';
  if (retryAfterSec < 60) return `${Math.ceil(retryAfterSec)} second(s)`;
  const minutes = Math.ceil(retryAfterSec / 60);
  return `${minutes} minute(s)`;
};

// Per-user hourly limit hit (userRateLimit middleware).
export const verzoBusyMessage = (retryAfterSec) =>
  `Verzo is busy right now — please try again in ${formatWait(retryAfterSec)}.`;

// AI provider quota exhausted (429 / RESOURCE_EXHAUSTED).
export const verzoQuotaMessage = (retryAfterSec) =>
  `Verzo is busy right now — please try again in ${formatWait(retryAfterSec)}.`;

// AI service down / misconfigured / overloaded (503 etc.).
export const verzoUnavailableMessage = () =>
  'Verzo’s AI service is temporarily unavailable. Please try again shortly.';

// Generic AI failure (no provider detail).
export const verzoGenerationFailedMessage = () =>
  'Verzo could not generate that right now. Please try again shortly.';

// Try to find how long the provider asks us to wait:
// - err.retryAfter / err.retryDelay (seconds)
// - "retry in 42s" / "Please retry in 42.3s" inside the message
// - Google error details: [{ "@type": ".../RetryInfo", retryDelay: "42s" }]
export const parseRetryAfterSec = (err) => {
  if (!err) return null;
  if (typeof err.retryAfter === 'number' && err.retryAfter > 0) return Math.ceil(err.retryAfter);
  if (typeof err.retryDelay === 'number' && err.retryDelay > 0) return Math.ceil(err.retryDelay);
  const msg = err.message || '';
  const inMessage = msg.match(/retry in (\d+(?:\.\d+)?)\s*s/i);
  if (inMessage) return Math.ceil(parseFloat(inMessage[1]));
  const details = err.details || err.response?.data?.error?.details || [];
  if (Array.isArray(details)) {
    for (const d of details) {
      if (typeof d?.retryDelay === 'string') {
        const m = d.retryDelay.match(/(\d+(?:\.\d+)?)s/);
        if (m) return Math.ceil(parseFloat(m[1]));
      }
    }
  }
  return null;
};

// Map any raw AI-provider error to a safe Verzo-branded error.
// Returns { status, message, retryAfter } — retryAfter is null when unknown.
// The original provider message is NOT included: log it server-side instead.
export const mapProviderError = (err) => {
  const msg = err?.message || '';
  const status = err?.statusCode || err?.status || err?.response?.status || 0;

  if (
    status === 429 ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('429') ||
    /quota/i.test(msg) ||
    /rate ?limit/i.test(msg)
  ) {
    return { status: 429, message: verzoQuotaMessage(parseRetryAfterSec(err)), retryAfter: parseRetryAfterSec(err) };
  }
  if (msg.includes('API_KEY_INVALID') || msg.includes('API key not valid') || msg.includes('API key')) {
    return { status: 503, message: verzoUnavailableMessage(), retryAfter: null };
  }
  if (status === 503 || msg.includes('overloaded') || msg.includes('503') || /unavailable/i.test(msg)) {
    return { status: 503, message: verzoBusyMessage(null), retryAfter: null };
  }
  return { status: 500, message: verzoGenerationFailedMessage(), retryAfter: null };
};

// Last-resort sanitizer for the error handler: guarantees no provider
// name ever reaches the user, whatever error bubbles up.
export const sanitizeUserMessage = (status, message, retryAfter) => {
  if (status === 429) return verzoBusyMessage(retryAfter || null);
  if (containsProviderName(message)) {
    return status === 503
      ? verzoUnavailableMessage()
      : 'Verzo could not complete that right now. Please try again shortly.';
  }
  return message || 'Something went wrong on our end. Please try again shortly.';
};

export default {
  containsProviderName,
  formatWait,
  verzoBusyMessage,
  verzoQuotaMessage,
  verzoUnavailableMessage,
  verzoGenerationFailedMessage,
  parseRetryAfterSec,
  mapProviderError,
  sanitizeUserMessage,
};
