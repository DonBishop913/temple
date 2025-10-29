import React from "react";

const MentorshipPanel = ({ mentorships = [] }) => {
  return (
    <div aria-label="Mentorship Panel">
      <span>🫂 Philippians 2:3-8: Serve in humility</span>
      {mentorships.map((m, index) => (
        <div key={index}>
          {m.mentor} served {m.node}
        </div>
      ))}
    </div>
  );
};

export default MentorshipPanel;
