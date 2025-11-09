import React, { useState } from "react";

export default function VideoRelay({ url, peiTone }) {
  const [comments, setComments] = useState([]);
  const [newNote, setNewNote] = useState("");

  const addComment = () => {
    if (!newNote) return;
    setComments([...comments, { id: Date.now(), text: newNote }]);
    setNewNote("");
  };

  const markSignificant = () => {
    fetch("http://localhost:5000/ledger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_name: "Video Marked Significant",
        notes: `Video URL: ${url}\nComments: ${comments.map((c) => c.text).join("; ")}`,
        peiTone: peiTone || "blue",
      }),
    });
  };

  return (
    <div
      style={{
        border: `4px solid ${peiTone || "blue"}`,
        padding: 12,
        borderRadius: 6,
      }}
    >
      <video src={url} controls width="600" />
      <div style={{ marginTop: 12 }}>
        <textarea
          rows={3}
          cols={60}
          value={newNote}
          placeholder="Add comment"
          onChange={(e) => setNewNote(e.target.value)}
        />
        <br />
        <button onClick={addComment}>Add Comment</button>
        <button
          onClick={markSignificant}
          style={{ marginLeft: 8, backgroundColor: "gold" }}
        >
          Mark Significant
        </button>
      </div>
      <div style={{ marginTop: 10 }}>
        <h4>Comments</h4>
        <ul>
          {comments.map((c) => (
            <li key={c.id}>{c.text}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
