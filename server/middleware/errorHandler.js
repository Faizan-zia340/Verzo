import logger from '../utils/logger.js';

const OPERATIONAL_STATUS_CODES = new Set([400, 401, 402, 403, 404, 409, 422, 429, 503]);

const errorHandler = (err, req, res, next) => {
  const status = err.statusCode || err.response?.status || 500;
  let message = err.message || 'Internal Server Error';
  const isOperational = err.isOperational === true || OPERATIONAL_STATUS_CODES.has(status);

  // Sanitize raw MongoDB / Mongoose errors — never leak internals to the client
  const msg = message.toLowerCase();
  if (
    msg.includes('buffering timed out') ||
    msg.includes('buffering') ||
    msg.includes('econnrefused') ||
    msg.includes('not connected') ||
    msg.includes('topology was destroyed') ||
    msg.includes('atlas') ||
    msg.includes('whitelist') ||
    msg.includes('ssl') ||
    msg.includes('tls') ||
    (status === 500 && msg.includes('mongo'))
  ) {
    message = 'The database is temporarily unreachable. Please try again in a moment.';
  }

  const reqId = req.id || req.headers['x-request-id'];

  if (isOperational) {
    logger.warn({ reqId, status, path: req.originalUrl, message: err.message }, 'Operational error');
  } else {
    logger.error({ reqId, status, path: req.originalUrl, err }, 'Unhandled programmer error');
    if (status >= 500) message = 'Something went wrong on our end. Please try again shortly.';
  }

  res.status(status).json({ message, ...(reqId ? { requestId: reqId } : {}) });
};

export default errorHandler;
