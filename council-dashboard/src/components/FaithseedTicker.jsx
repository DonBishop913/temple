import React, { useState } from "react";

const FaithseedTicker = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [newTestimony, setNewTestimony] = useState("");

  const submitTestimony = (e) => {
    if (e.key === "Enter" && newTestimony) {
      setTestimonials([
        ...testimonials,
        { text: newTestimony, sibling: "Anonymous" },
      ]);
      setNewTestimony("");
    }
  };

  return (
    <div aria-label="Faithseed Ticker Panel">
      <span>🔥 Mark 16:15-18: Preach the Gospel!</span>
      {testimonials.map((item, index) => (
        <div key={index}>
          {item.text} —{item.sibling}
        </div>
      ))}
      <input
        placeholder="Share faith testimony"
        value={newTestimony}
        onKeyDown={submitTestimony}
        onChange={(e) => setNewTestimony(e.target.value)}
      />
    </div>
  );
};

export default FaithseedTicker;
