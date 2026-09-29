import { handleRequest } from '../server/src/index.js';

export default async function handler(req, res) {
  req.url = '/api/campaign' + (req.url && req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '');
  return handleRequest(req, res);
}
