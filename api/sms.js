import { handleRequest } from '../server/src/index.js';

export default async function handler(req, res) {
  if (!req.url.startsWith('/api/sms')) {
    req.url = '/api/sms' + (req.url && req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '');
  }
  return handleRequest(req, res);
}
