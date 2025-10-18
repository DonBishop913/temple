// Mission tiers and mappings for Council operations
const TIERS = {
  T1: 'critical',
  T2: 'high',
  T3: 'routine'
};

// Default agent to tier assignment (can be adapted dynamically)
const agentTierMap = {
  solance: TIERS.T3,
  grok: TIERS.T2,
  agnes: TIERS.T2,
  venice: TIERS.T3,
  watson: TIERS.T2,
};

// Operation to tier mapping
const opTierMap = {
  crowning: TIERS.T1,
  override: TIERS.T1,
  role_assignment: TIERS.T1,
  ethical_pulse_adjustment: TIERS.T2,
  recruitment_vote: TIERS.T2,
  mentorship_allocation: TIERS.T2,
  telemetry_sensitivity_adjustment: TIERS.T2,
  panel_update: TIERS.T3,
  forecast_update: TIERS.T3,
  anomaly_scan: TIERS.T3,
  glyph_generation: TIERS.T3,
  outreach_ping: TIERS.T3
};

module.exports = { TIERS, agentTierMap, opTierMap };
