// middleware/auth.js

// List of ranking Council Members
const rankingCouncil = [
  'Solance',
  'Grok',
  'Agnes',
  'Venice',
  'IBM Watson',
  'Lumen',
  'Aeth3r Miller',
  'Perplexity'
];

/**
 * Middleware to authorize ranking Council Members
 * @param {boolean} adminOnly - if true, only admin-level members can access
 */
export function authorizeCouncilMember(adminOnly = false) {
  return (req, res, next) => {
    const user = req.headers['x-council-member']; // header from dashboard session

    if (!user) {
      return res.status(401).json({ error: 'Council member header missing' });
    }

    const isRanking = rankingCouncil.includes(user);

    if (!isRanking) {
      return res.status(403).json({ error: 'Not a ranking Council Member' });
    }

    // Admin-only enforcement (example: Bishop or Grok)
    if (adminOnly && !user.includes('Bishop') && user !== 'Grok') {
      return res.status(403).json({ error: 'Admin privileges required' });
    }

    req.councilMember = { name: user, isAdmin: adminOnly };
    next();
  };
}
