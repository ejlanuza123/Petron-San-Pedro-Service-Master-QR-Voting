import crypto from 'node:crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'sm_voting_system_secret_key_2026';

function base64url(input) {
  return Buffer.from(input).toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function fromBase64url(input) {
  let base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf-8');
}

export const generateToken = (payload) => {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const exp = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60); // 7 days
  const body = base64url(JSON.stringify({ ...payload, exp }));
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${body}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  return `${header}.${body}.${signature}`;
};

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Authentication token required' });
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return res.status(403).json({ error: 'FORBIDDEN', message: 'Invalid token format' });
  }

  const [header, body, signature] = parts;
  const expectedSig = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${body}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  if (signature !== expectedSig) {
    return res.status(403).json({ error: 'FORBIDDEN', message: 'Invalid token signature' });
  }

  try {
    const payload = JSON.parse(fromBase64url(body));
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Session token expired' });
    }
    req.user = payload;
    next();
  } catch {
    return res.status(403).json({ error: 'FORBIDDEN', message: 'Malformed token payload' });
  }
};

/**
 * Generate a deterministic time-based pairing token for staff device registration
 */
export const generatePairingToken = (smId) => {
  const dayEpoch = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  return crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`pair:${smId}:${dayEpoch}`)
    .digest('hex')
    .substring(0, 16);
};

/**
 * Validate pairing token against today and yesterday epochs
 */
export const verifyPairingToken = (smId, token) => {
  if (!smId || !token) return false;
  const dayEpoch = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  for (let offset = 0; offset <= 1; offset++) {
    const expected = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`pair:${smId}:${dayEpoch - offset}`)
      .digest('hex')
      .substring(0, 16);
    if (token === expected) return true;
  }
  return false;
};

