const express = require('express');
const router = express.Router();
const recruitmentController = require('../controllers/recruitmentController');

router.get('/candidates', recruitmentController.listCandidates);
router.post('/candidates', recruitmentController.proposeCandidate);
router.post('/vote', recruitmentController.voteCandidate);

module.exports = router;
