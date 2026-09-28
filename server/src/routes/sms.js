import express from 'express';
import db from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/sms - List all active SMs (public for voting page)
router.get('/', (req, res) => {
  const { branch, all } = req.query;
  const filter = {};
  if (!all) {
    filter.active = true;
  }
  if (branch) {
    filter.branch = branch;
  }
  const sms = db.getSMs(filter);
  res.json({ sms });
});

// GET /api/sms/:id - Get single SM details (public)
router.get('/:id', (req, res) => {
  const sm = db.getSMById(req.params.id);
  if (!sm) {
    return res.status(404).json({ error: 'NOT_FOUND', message: 'Service Master not found' });
  }
  res.json({ sm });
});

// POST /api/sms - Create new SM (Admin only)
router.post('/', authenticateToken, (req, res) => {
  const { name, photo_url, branch, station, shift, bio, device_fingerprint, ip_registered } = req.body;

  if (!name || !branch) {
    return res.status(400).json({ error: 'MISSING_FIELDS', message: 'Name and Branch are required' });
  }

  const newSM = db.createSM({
    name,
    photo_url,
    branch,
    station,
    shift,
    bio,
    device_fingerprint,
    ip_registered
  });

  db.logAction({
    admin_id: req.user.id,
    action: 'CREATE_SM',
    target_id: newSM.id,
    details: `Added new Service Master: ${newSM.name} (${newSM.branch})`
  });

  res.status(201).json({ sm: newSM });
});

// PUT /api/sms/:id - Update SM (Admin only)
router.put('/:id', authenticateToken, (req, res) => {
  const updated = db.updateSM(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'NOT_FOUND', message: 'Service Master not found' });
  }

  db.logAction({
    admin_id: req.user.id,
    action: 'UPDATE_SM',
    target_id: updated.id,
    details: `Updated Service Master: ${updated.name}`
  });

  res.json({ sm: updated });
});

// DELETE /api/sms/:id - Remove SM (Admin only)
router.delete('/:id', authenticateToken, (req, res) => {
  const sm = db.getSMById(req.params.id);
  if (!sm) {
    return res.status(404).json({ error: 'NOT_FOUND', message: 'Service Master not found' });
  }

  db.deleteSM(req.params.id);
  db.logAction({
    admin_id: req.user.id,
    action: 'DELETE_SM',
    target_id: req.params.id,
    details: `Deleted Service Master: ${sm.name}`
  });

  res.json({ success: true, message: 'Service Master deleted successfully' });
});

// POST /api/sms/:id/register-device - Calibrate anti-self-vote fingerprint
router.post('/:id/register-device', authenticateToken, (req, res) => {
  const { device_fingerprint, ip_address } = req.body;
  const sm = db.getSMById(req.params.id);

  if (!sm) {
    return res.status(404).json({ error: 'NOT_FOUND', message: 'Service Master not found' });
  }

  const updated = db.updateSM(req.params.id, {
    device_fingerprint: device_fingerprint || sm.device_fingerprint,
    ip_registered: ip_address || sm.ip_registered
  });

  db.logAction({
    admin_id: req.user.id,
    action: 'REGISTER_SM_DEVICE',
    target_id: sm.id,
    details: `Calibrated anti-self-vote hardware profile for ${sm.name}`
  });

  res.json({ sm: updated, message: 'Device anti-cheat calibration updated' });
});

export default router;
