const auditService = require('../../services/auditService');

exports.explainDecision = (req, res) => {
  // TODO: Fetch and return decision rationale from audit log
  const id = req.query.id;
  const explanation = auditService.explainDecision(id);
  res.json({ id, explanation });
};
