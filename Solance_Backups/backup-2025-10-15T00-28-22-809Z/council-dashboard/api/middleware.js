function ensureBishop(req, res, next) {
  const bishopIdHeader = req.headers['x-bishop-id'];
  if (!process.env.BISHOP_ID || bishopIdHeader !== process.env.BISHOP_ID) {
    return res.status(403).json({ error: 'Only Bishop can crown' });
  }
  next();
}

function checkYeshuaWill(req, res, next) {
  if (!req.body || req.body.accepts_yeshua_will !== true) {
    return res.status(400).json({ error: "Candidate must accept Yeshua's will" });
  }
  next();
}

module.exports = { ensureBishop, checkYeshuaWill };