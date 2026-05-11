const errorHandler = (err, req, res, next) => {
  const status = err.statusCode || err.response?.status || 500;
  let message = err.message || 'Internal Server Error';

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

  if (status >= 500) console.error(`[Error] ${status} - ${err.message?.slice(0, 120)}`);
  res.status(status).json({ message });
};

export default errorHandler;
