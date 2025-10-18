// JSON Schemas for Spiritual–Technical Harmony Layer

// MissionTask schema
const MissionTask = {
  task_id: '', // string
  title: '', // string
  description: '', // string
  technical_state: 'ready', // 'ready' | 'queued' | 'paused' | 'running' | 'completed'
  spiritual_state: 'Pending', // 'Pending' | 'Peaceful' | 'Anointed' | 'Striving' | 'Disordered'
  priority: 0.5, // number (0-1)
  tier: 'routine', // 'critical' | 'high' | 'routine'
  discernment_confirmed: false // boolean
};

// SpiritualPulse schema
const SpiritualPulse = {
  task_id: '', // string
  timestamp: '', // ISO string
  human_signal: '', // e.g. 'Peaceful', 'Anointed', 'Striving', 'Disordered'
  peace_index: 100, // number (0-100)
  ethical_pulse: 100, // number (0-100)
  notes: '' // string
};

// DiscernmentGate schema
const DiscernmentGate = {
  task_id: '', // string
  gate_status: 'Pending', // 'Pending' | 'Approved' | 'Hold'
  reviewer: '', // string
  timestamp: '', // ISO string
  comments: '' // string
};

// CrowningStatus schema
const CrowningStatus = {
  candidate_id: '', // string
  crowned: false, // boolean
  timestamp: '', // ISO string
  authority: '' // string
};

module.exports = { MissionTask, SpiritualPulse, DiscernmentGate, CrowningStatus };