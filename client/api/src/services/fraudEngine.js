import db from '../db/database.js';

/**
 * Fraud Detection Engine for Service Master QR Voting System
 * Evaluates vote submissions against anti-cheat security rules.
 */
export class FraudEngine {
  /**
   * Validate and determine vote status based on fraud rules
   * @param {Object} params
   * @param {string} params.sm_id - ID of the Service Master being voted for
   * @param {string} params.voter_fingerprint - Unique device/browser hash
   * @param {string} params.ip_address - Client IP address
   * @param {string} params.user_agent - Client User-Agent string
   * @param {string} params.mode - 'general' or 'sm_specific'
   * @returns {Object} { allowed: boolean, status: 'valid' | 'flagged' | 'rejected', reason: string | null, error?: string }
   */
  static evaluateVote({ sm_id, voter_fingerprint, ip_address, user_agent, mode }) {
    const campaign = db.getActiveCampaign();
    const sm = db.getSMById(sm_id);

    // Rule 0: Target Service Master existence & active state
    if (!sm) {
      return {
        allowed: false,
        error: 'INVALID_SM',
        message: 'The selected Service Master does not exist or has been removed.'
      };
    }

    if (!sm.active) {
      return {
        allowed: false,
        error: 'SM_INACTIVE',
        message: 'This Service Master is currently not eligible for voting.'
      };
    }

    // Rule 1: Emergency Kill Switch
    if (campaign.kill_switch) {
      return {
        allowed: false,
        error: 'VOTING_SUSPENDED',
        message: 'Voting has been temporarily suspended by system administrators. Please check back later.'
      };
    }

    // Rule 2: Campaign Date Window
    const now = new Date();
    const campaignStart = new Date(campaign.start_date);
    const campaignEnd = new Date(campaign.end_date);

    if (now < campaignStart || now > campaignEnd) {
      return {
        allowed: false,
        error: 'OUTSIDE_CAMPAIGN_WINDOW',
        message: 'Voting is only available during the active campaign period.'
      };
    }

    // Rule 3: Operating Hours Check
    if (campaign.enforce_operating_hours) {
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const currentTimeVal = currentHours * 60 + currentMinutes;

      const [startH, startM] = (campaign.operating_hours_start || '06:00').split(':').map(Number);
      const [endH, endM] = (campaign.operating_hours_end || '22:00').split(':').map(Number);
      const startTimeVal = startH * 60 + startM;
      const endTimeVal = endH * 60 + endM;

      if (currentTimeVal < startTimeVal || currentTimeVal > endTimeVal) {
        return {
          allowed: false,
          error: 'OUTSIDE_OPERATING_HOURS',
          message: `Voting is only open during operating hours (${campaign.operating_hours_start} to ${campaign.operating_hours_end}).`
        };
      }
    }

    // --- FRAUD DETECTION FLAGS (Evaluated before blocking duplicates) ---

    // Rule 4: Self-Voting Detection
    // Check if voter's device fingerprint or IP matches SM's registered fingerprint or IP
    const matchesDevice = sm.device_fingerprint && voter_fingerprint && (sm.device_fingerprint === voter_fingerprint);
    const matchesIp = sm.ip_registered && ip_address && (sm.ip_registered === ip_address);

    if (matchesDevice || matchesIp) {
      const trigger = matchesDevice && matchesIp 
        ? 'device fingerprint AND registered IP' 
        : matchesDevice ? 'device fingerprint' : 'registered IP';
      return {
        allowed: true,
        status: 'flagged',
        reason: `possible_self_vote (Voter ${trigger} matches SM's registered profile)`
      };
    }

    // Rule 5: Duplicate Vote Check (Strict single vote per device per day/campaign)
    // Non-flagged duplicates are blocked at submission to give voter clear feedback
    if (!campaign.test_mode && db.hasVotedInWindow(voter_fingerprint, campaign.duplicate_window || 'daily')) {
      return {
        allowed: false,
        error: 'ALREADY_VOTED',
        message: campaign.duplicate_window === 'daily'
          ? 'You have already cast your vote today! Thank you for your support.'
          : 'You have already voted in this monthly campaign. Thank you!'
      };
    }

    // Rule 6: Rapid-Fire IP Detection (Spam bursts / bot clusters)
    const minutesWindow = campaign.rapid_fire_minutes || 10;
    const maxVotes = campaign.rapid_fire_max_votes || 5;
    const recentVotesFromIP = db.countVotesLastMinutesByIP(ip_address, minutesWindow);

    if (recentVotesFromIP >= maxVotes) {
      return {
        allowed: true,
        status: 'flagged',
        reason: `rapid_fire (${recentVotesFromIP + 1} votes detected from IP ${ip_address} within ${minutesWindow} minutes)`
      };
    }

    // Rule 7: User-Agent Suspicious / Bot check
    if (!user_agent || user_agent.length < 15 || /curl|postman|bot|crawl|spider/i.test(user_agent)) {
      return {
        allowed: true,
        status: 'flagged',
        reason: 'suspicious_client (Non-standard or automated user agent)'
      };
    }

    // All checks passed cleanly
    return {
      allowed: true,
      status: 'valid',
      reason: null
    };
  }
}

export default FraudEngine;
