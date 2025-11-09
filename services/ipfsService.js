const { create } = require("ipfs-http-client");
const fs = require("fs");
const path = require("path");

const ipfs = create({ url: "https://ipfs.infura.io:5001/api/v0" }); // Use your IPFS node or gateway
const ledgerPath = path.join(__dirname, "..", "data", "quantum_ledger.json");
const archiveLog = path.join(__dirname, "..", "data", "ipfs_archive_log.json");

exports.snapshotAndArchive = async () => {
  const ledgerData = JSON.parse(fs.readFileSync(ledgerPath));
  const { cid } = await ipfs.add(JSON.stringify(ledgerData));
  const logEntry = { cid: cid.toString(), timestamp: new Date().toISOString() };
  fs.appendFileSync(archiveLog, JSON.stringify(logEntry) + "\n");
  return cid.toString();
};
