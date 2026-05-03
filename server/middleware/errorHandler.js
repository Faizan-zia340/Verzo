const errorHandler = (err, req, res, next) => {
  const status = err.statusCode || err.response?.status || 500;
  const message = err.message || 'Internal Server Error';
  if (status >= 500) console.error(`[Error] ${status} - ${message}`);
  res.status(status).json({ message });
};

export default errorHandler;
