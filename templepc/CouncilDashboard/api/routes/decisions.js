const express = require("express");
const router = express.Router();
const decisionsController = require("../controllers/decisionsController");

router.get("/explain", decisionsController.explainDecision);

module.exports = router;
