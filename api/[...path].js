import { handleRequest } from '../server/src/index.js';

export { handleRequest };

/**
 * Vercel Serverless Function Catch-All Route for /api/*
 * Handles /api/campaign, /api/sms, /api/vote, /api/votes, /api/auth/login, etc.
 * Total Serverless Functions in project: 2 (Well within Vercel Hobby plan limit of 12).
 */
export default async function handler(req, res) {
  return handleRequest(req, res);
}
