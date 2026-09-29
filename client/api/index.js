import { handleRequest } from './src/index.js';

export { handleRequest };

/**
 * Vercel Serverless Function Root for /api (client scoped)
 */
export default async function handler(req, res) {
  return handleRequest(req, res);
}
