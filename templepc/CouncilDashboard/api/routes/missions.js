const express = require('express');
const router = express.Router();
const missionsController = require('../controllers/missionsController');

router.get('/', missionsController.listMissions);
router.post('/', missionsController.createMission);
router.put('/:id', missionsController.updateMission);

module.exports = router;
