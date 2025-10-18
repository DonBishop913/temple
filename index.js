const express = require('express');
const bodyParser = require('body-parser');
const ledgerRouter = require('./routes/ledgerRouter');
const ipfsService = require('./services/ipfsService');

const app = express();
app.use(bodyParser.json());

// Ledger REST endpoints
app.use('/ledger', ledgerRouter);

// Periodic snapshot archive to IPFS every 24h
setInterval(async () => {
  try {
    const cid = await ipfsService.snapshotAndArchive();
    console.log('Ledger snapshot archived to IPFS:', cid);
  } catch (e) {
    console.error('IPFS archive error:', e);
  }
}, 24 * 60 * 60 * 1000);

app.listen(5000, () => {
  console.log('Council Quantum Sync Ledger running on http://localhost:5000');
});