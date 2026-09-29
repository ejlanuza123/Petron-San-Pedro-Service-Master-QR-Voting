import { handleRequest } from '../server/src/index.js';

export { handleRequest };

/**
 * Vercel Serverless Function Catch-All Route for /api/*
 * Handles /api/campaign, /api/sms, /api/vote, /api/auth/login, etc.
 */
export default async function handler(req, res) {
  return handleRequest(req, res);
}
