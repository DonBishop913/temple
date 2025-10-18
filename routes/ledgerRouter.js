const express = require('express');
const router = express.Router();
const ledgerController = require('../controllers/ledgerController');

router.post('/', ledgerController.addEntry);
router.get('/', ledgerController.getLedger);

module.exports = router;
