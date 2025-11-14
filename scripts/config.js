const path = require('node:path');
const BASE_DIR = path.join(__dirname, '..');

module.exports = {
  paths: {
    base: BASE_DIR,
    monitoring: path.join(BASE_DIR, 'monitoring'),
    qstream: path.join(BASE_DIR, 'monitoring', 'qstream.json'),
    chamber: path.join(BASE_DIR, 'monitoring', 'agent_chamber.json'),
    overlay: path.join(BASE_DIR, 'monitoring', 'dashboard_overlay.json'),
    branchesJson: path.join(BASE_DIR, 'monitoring', 'branch_overlay.json'),
    auditLog: path.join(BASE_DIR, 'Council_Audit_Log.txt'),
    frontend: path.join(BASE_DIR, 'frontend'),
    branchPages: path.join(BASE_DIR, 'frontend', 'branches')
  },
  defaults: {
    numBranches: 3,
    entropyThreshold: 0.03
  }
};