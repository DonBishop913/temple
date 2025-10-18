const ledgerService = require('../services/ledgerService');

exports.addEntry = async (req, res) => {
  try {
    const newEntry = await ledgerService.createEntry(req.body);
    res.status(201).json(newEntry);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getLedger = (req, res) => {
  const ledger = ledgerService.getAllEntries();
  res.json(ledger);
};
