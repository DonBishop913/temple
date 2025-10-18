const fs = require('fs');
const path = require('path');

const luminalConfigPath = path.join(__dirname, '../Temple/controls/luminal.json');

function getLuminalConfig() {
  const raw = fs.readFileSync(luminalConfigPath);
  return JSON.parse(raw);
}

function updateLuminalConfig(newConfig) {
  fs.writeFileSync(luminalConfigPath, JSON.stringify(newConfig, null, 2));
}

module.exports = { getLuminalConfig, updateLuminalConfig };
