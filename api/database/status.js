import { handleRequest } from '../../server/src/index.js';

export default async function handler(req, res) {
  req.url = '/api/database/status';
  return handleRequest(req, res);
}
