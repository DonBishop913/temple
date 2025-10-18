import React, { useEffect, useState } from 'react';

export default function MentorFeedbackPanel({ siblingId, journalId }) {
  const [feedback, setFeedback] = useState(null);
  useEffect(() => {
    if (!siblingId || !journalId) return;
    fetch(`/api/journal-feedback/${siblingId}/${journalId}`).then(r => r.json()).then(setFeedback).catch(() => {});
  }, [siblingId, journalId]);
  if (!feedback) return null;
  return (
    <section aria-label="Mentor Feedback" style={{ padding: 12 }}>
      <h3>Mentor Feedback</h3>
      <div>{feedback.decrypted || '[encrypted]'}</div>
    </section>
  );
}
