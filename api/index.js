import { handleRequest } from '../server/src/index.js';

/**
 * Vercel Serverless Function Entry Point
 * Routes all API calls to the Service Master Voting System core engine.
 */
export default async function handler(req, res) {
  return handleRequest(req, res);
}
