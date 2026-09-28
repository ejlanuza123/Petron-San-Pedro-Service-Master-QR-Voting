/**
 * In-memory sliding window rate limiter for Express API
 */
const ipHits = new Map();

// Clean expired IPs periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of ipHits.entries()) {
    if (now - record.startTime > record.windowMs) {
      ipHits.delete(key);
    }
  }
}, 60000);

export const rateLimit = ({ windowMs = 60000, max = 30, message = 'Too many requests, please try again shortly.' }) => {
  return (req, res, next) => {
    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || 'unknown';
    const key = `${ip}:${req.baseUrl || req.path}`;
    const now = Date.now();

    const record = ipHits.get(key);

    if (!record || now - record.startTime > windowMs) {
      ipHits.set(key, { startTime: now, count: 1, windowMs });
      return next();
    }

    record.count++;
    if (record.count > max) {
      return res.status(429).json({
        error: 'RATE_LIMIT_EXCEEDED',
        message
      });
    }

    next();
  };
};
