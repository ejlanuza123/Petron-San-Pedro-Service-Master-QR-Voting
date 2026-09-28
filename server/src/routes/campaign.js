import express from 'express';
import db from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/campaign - Get active campaign & public operational rules
router.get('/', (req, res) => {
  const campaign = db.getActiveCampaign();
  if (!campaign) {
    return res.status(404).json({ error: 'NO_CAMPAIGN', message: 'No active campaign configured' });
  }

  const now = new Date();
  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();
  const currentTimeVal = currentHours * 60 + currentMinutes;

  const [startH, startM] = (campaign.operating_hours_start || '06:00').split(':').map(Number);
  const [endH, endM] = (campaign.operating_hours_end || '22:00').split(':').map(Number);
  const startTimeVal = startH * 60 + startM;
  const endTimeVal = endH * 60 + endM;

  const isWithinHours = !campaign.enforce_operating_hours || (currentTimeVal >= startTimeVal && currentTimeVal <= endTimeVal);
  const isWithinWindow = now >= new Date(campaign.start_date) && now <= new Date(campaign.end_date);
  const isVotingOpen = !campaign.kill_switch && isWithinHours && isWithinWindow;

  res.json({
    campaign,
    status: {
      is_voting_open: isVotingOpen,
      kill_switch_active: campaign.kill_switch,
      is_within_hours: isWithinHours,
      is_within_window: isWithinWindow,
      test_mode: campaign.test_mode
    }
  });
});

// PUT /api/campaign - Update campaign & fraud thresholds (Admin only)
router.put('/', authenticateToken, (req, res) => {
  const current = db.getActiveCampaign();
  const updated = db.updateCampaign(current.id, req.body);

  db.logAction({
    admin_id: req.user.id,
    action: 'UPDATE_CAMPAIGN_RULES',
    target_id: current.id,
    details: req.body
  });

  res.json({ campaign: updated, message: 'Campaign and security rules updated successfully' });
});

// POST /api/campaign/toggle-kill-switch - Emergency pause toggle (Admin only)
router.post('/toggle-kill-switch', authenticateToken, (req, res) => {
  const current = db.getActiveCampaign();
  const newState = !current.kill_switch;
  const updated = db.updateCampaign(current.id, { kill_switch: newState });

  db.logAction({
    admin_id: req.user.id,
    action: newState ? 'EMERGENCY_KILL_SWITCH_ENGAGED' : 'KILL_SWITCH_DEACTIVATED',
    target_id: current.id,
    details: `Voting kill switch ${newState ? 'ACTIVATED' : 'DEACTIVATED'}`
  });

  res.json({
    kill_switch: newState,
    message: newState ? 'EMERGENCY KILL SWITCH ENGAGED: Voting is now disabled.' : 'Kill switch deactivated: Voting resumed.'
  });
});

// POST /api/campaign/toggle-test-mode - Toggle test mode (Admin only)
router.post('/toggle-test-mode', authenticateToken, (req, res) => {
  const current = db.getActiveCampaign();
  const newState = !current.test_mode;
  const updated = db.updateCampaign(current.id, { test_mode: newState });

  db.logAction({
    admin_id: req.user.id,
    action: 'TOGGLE_TEST_MODE',
    target_id: current.id,
    details: `Test mode ${newState ? 'ACTIVATED' : 'DEACTIVATED'}`
  });

  res.json({
    test_mode: newState,
    message: newState ? 'Test mode activated: votes will be tagged as test entries.' : 'Test mode deactivated.'
  });
});

export default router;
