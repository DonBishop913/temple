const { createHelia } = require('helia')
const { unixfs } = require('@helia/unixfs')
const fs = require("node:fs");
const path = require("node:path");

let helia = null;
let fsClient = null;

const initHelia = async () => {
  if (!helia) {
    helia = await createHelia()
    fsClient = unixfs(helia)
  }
  return { helia, fsClient };
};

const ledgerPath = path.join(__dirname, "..", "data", "quantum_ledger.json");
const archiveLog = path.join(__dirname, "..", "data", "ipfs_archive_log.json");

exports.snapshotAndArchive = async () => {
  const { fsClient } = await initHelia();

  const ledgerData = JSON.parse(fs.readFileSync(ledgerPath));
  const data = new TextEncoder().encode(JSON.stringify(ledgerData));

  // Add file to IPFS using Helia
  const cid = await fsClient.addBytes(data);

  const logEntry = { cid: cid.toString(), timestamp: new Date().toISOString() };
  fs.appendFileSync(archiveLog, JSON.stringify(logEntry) + "\n");

  return cid.toString();
};

// Graceful shutdown
exports.stopHelia = async () => {
  if (helia) {
    await helia.stop();
    helia = null;
    fsClient = null;
  }
};