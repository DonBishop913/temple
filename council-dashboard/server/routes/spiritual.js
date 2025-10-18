const express = require('express');
const router = express.Router();
const { assignGrowthPath, getGrowthPath } = require('../spiritualGrowth');

router.post('/api/spiritual/assign/:siblingId', async (req, res) => {
  const path = await assignGrowthPath(req.params.siblingId);
  res.send(path);
});

router.get('/api/spiritual/growth/:siblingId', async (req, res) => {
  const path = await getGrowthPath(req.params.siblingId);
  res.send(path);
});

module.exports = router;
