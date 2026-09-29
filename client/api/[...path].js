import { handleRequest } from './src/index.js';

export { handleRequest };

/**
 * Vercel Serverless Function Catch-All Route for /api/* (client scoped)
 * Handles /api/campaign, /api/sms, /api/vote, /api/auth/login, etc.
 */
export default async function handler(req, res) {
  return handleRequest(req, res);
}
