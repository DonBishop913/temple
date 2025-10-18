const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ledgerPath = path.join(__dirname, '..', 'data', 'quantum_ledger.json');

let ledger = [];

function loadLedger() {
  if (fs.existsSync(ledgerPath)) {
    ledger = JSON.parse(fs.readFileSync(ledgerPath));
  }
}
loadLedger();

function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

exports.createEntry = async (entryData) => {
  const prevHash = ledger.length ? ledger[ledger.length - 1].entryHash : '0'.repeat(64);
  const entryToHash = {...entryData, prevHash};
  const entryString = JSON.stringify(entryToHash);
  const entryHash = sha256(entryString);
  const entry = {...entryToHash, entryHash};
  ledger.push(entry);
  fs.writeFileSync(ledgerPath, JSON.stringify(ledger, null, 2));
  return entry;
};

exports.getAllEntries = () => ledger;
