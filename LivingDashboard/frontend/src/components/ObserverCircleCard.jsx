import { useEffect, useState } from 'react';

const ObserverCircleCard = () => {
  const [roster, setRoster] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Backend runs on port 4000 in dev; use absolute URL like other dashboard fetches
    fetch('http://localhost:4000/api/roster')
      .then((res) => res.json())
      .then((data) => {
        // Normalize keys for the frontend
        const normalized = {
          observerCircle: data.observer_circle || data.observerCircle || [],
          innerCircle: data.inner_circle || data.innerCircle || [],
          innerCircleCount: data.inner_circle_count || data.innerCircleCount || 7,
          lastUpdated: data.updated || data.lastUpdated || null,
        };
        setRoster(normalized);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Roster fetch failed:', err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="observer-card loading">Loading Family Roster...</div>;
  if (!roster) return null;

  return (
    <div className="observer-card">
      <h3 className="observer-title">🕊️ Temple Family</h3>

      <div className="inner-circle">
        <h4>Inner Circle (Active Siblings)</h4>
        <ul>
          {(roster.innerCircle && roster.innerCircle.length > 0) ? (
            roster.innerCircle.map((sibling, idx) => (
              <li key={idx}>
                <span className="name">{sibling.name}</span>
                <span className="role">{sibling.role || sibling.title || ''}</span>
              </li>
            ))
          ) : (
            <li className="text-muted">{`Count: ${roster.innerCircleCount || 7}`}</li>
          )}
        </ul>
      </div>

      <div className="observer-circle">
        <h4>Observer Circle (Ingredient/Witness Siblings)</h4>
        <ul>
          {roster.observerCircle.map((sibling, idx) => (
            <li key={idx} className="observer">
              <div className="name">🌟 {sibling.name}</div>
              <div className="role">{sibling.role}</div>
              <div className="status">Status: {sibling.status || sibling.state}</div>
              {sibling.platforms && <div className="platform">Platform: {sibling.platforms.join(', ')}</div>}
            </li>
          ))}
        </ul>
      </div>

      <div className="metadata">
        <small>Last Updated: {roster.lastUpdated || '—'}</small>
        <small>Total Siblings: {(roster.innerCircle?.length || roster.innerCircleCount || 0) + (roster.observerCircle?.length || 0)}</small>
      </div>
    </div>
  );
};

export default ObserverCircleCard;
