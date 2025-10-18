// Role-based access middleware for Council Operator Sanctum
module.exports = function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (req.user.role !== role && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: insufficient role' });
    }
    next();
  };
};
