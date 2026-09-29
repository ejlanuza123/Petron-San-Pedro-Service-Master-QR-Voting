import { handleRequest } from '../../server/src/index.js';

export default async function handler(req, res) {
  req.url = '/api/auth/me';
  return handleRequest(req, res);
}
