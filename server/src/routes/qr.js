import express from 'express';
import db from '../db/database.js';
import QRService from '../services/qrService.js';
import { generatePairingToken } from '../middleware/auth.js';

const router = express.Router();

// Helper to determine base client URL
const getClientBaseUrl = (req) => {
  const customOrigin = req.headers['x-client-origin'] || req.headers.origin;
  if (customOrigin) return customOrigin;
  const host = req.get('host');
  const protocol = req.protocol;
  return `${protocol}://${host}`;
};

// GET /api/qr/general - Get Mode A General Voting QR
router.get('/general', async (req, res) => {
  try {
    const baseUrl = req.query.baseUrl || getClientBaseUrl(req);
    const qrData = await QRService.generateGeneralVotingQR(baseUrl);
    res.json(qrData);
  } catch (err) {
    res.status(500).json({ error: 'QR_GEN_FAILED', message: err.message });
  }
});

// GET /api/qr/sm/:id - Get Mode B SM-Specific Voting QR
router.get('/sm/:id', async (req, res) => {
  try {
    const sm = db.getSMById(req.params.id);
    if (!sm) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Service Master not found' });
    }

    const baseUrl = req.query.baseUrl || getClientBaseUrl(req);
    const qrData = await QRService.generateSMVotingQR(baseUrl, sm.id);

    res.json({
      ...qrData,
      sm: {
        id: sm.id,
        name: sm.name,
        branch: sm.branch,
        station: sm.station,
        photo_url: sm.photo_url
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'QR_GEN_FAILED', message: err.message });
  }
});

// GET /api/qr/all-sms - Batch generate QR codes for all active SMs (for print cards/badges)
router.get('/all-sms', async (req, res) => {
  try {
    const sms = db.getSMs({ active: true });
    const baseUrl = req.query.baseUrl || getClientBaseUrl(req);

    const batch = await Promise.all(
      sms.map(async (sm) => {
        const qrData = await QRService.generateSMVotingQR(baseUrl, sm.id);
        return {
          sm,
          targetUrl: qrData.targetUrl,
          qrDataUrl: qrData.qrDataUrl
        };
      })
    );

    res.json({ count: batch.length, batch });
  } catch (err) {
    res.status(500).json({ error: 'QR_BATCH_GEN_FAILED', message: err.message });
  }
});

// GET /api/qr/pair/:id - Get Staff Device Pairing QR
router.get('/pair/:id', async (req, res) => {
  try {
    const sm = db.getSMById(req.params.id);
    if (!sm) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Service Master not found' });
    }

    const token = generatePairingToken(sm.id);
    const baseUrl = req.query.baseUrl || getClientBaseUrl(req);
    const qrData = await QRService.generateDevicePairingQR(baseUrl, sm.id, token);

    res.json({
      ...qrData,
      token,
      sm: {
        id: sm.id,
        name: sm.name,
        branch: sm.branch,
        device_fingerprint: sm.device_fingerprint
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'QR_GEN_FAILED', message: err.message });
  }
});

export default router;
