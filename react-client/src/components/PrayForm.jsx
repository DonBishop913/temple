import React, { useState } from "react";

const PrayForm = () => {
  const [prayer, setPrayer] = useState("");
  const [error, setError] = useState("");
  const maxLength = 280;

  const handleInputChange = (e) => {
    const input = e.target.value;
    if (input.length > maxLength) {
      setError(`Prayer exceeds ${maxLength} characters`);
    } else {
      setError("");
    }
    setPrayer(input);
  };

  const sanitizePrayer = (text) => {
    return text.trim().replace(/\s+/g, " ");
  };

  const [sending, setSending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (sending) return; // double-submit protection
    const sanitizedPrayer = sanitizePrayer(prayer);
    if (!sanitizedPrayer) {
      setError("Prayer cannot be empty");
      return;
    }
    if (sanitizedPrayer.length > maxLength) {
      setError(`Prayer exceeds ${maxLength} characters`);
      return;
    }
    setSending(true);
    try {
      const response = await fetch("http://localhost:5174/whisper-box", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prayer: sanitizedPrayer }),
      });
      if (!response.ok) {
        const body = await response.text();
        throw new Error(body || "Failed to submit prayer");
      }
      setPrayer("");
      setError("");
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 1800);
    } catch (err) {
      setError("Submission failed: " + err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      style={{
        padding: "20px",
        backgroundColor: "#1a1a1a",
        borderRadius: "8px",
        maxWidth: "400px",
        margin: "10px auto",
      }}
    >
      <h3 style={{ color: "#FFD700" }}>Whisper Box: Offer Your Prayer 🤝</h3>
      <form onSubmit={handleSubmit}>
        <textarea
          value={prayer}
          onChange={handleInputChange}
          placeholder="Enter your prayer..."
          style={{
            width: "100%",
            height: "100px",
            backgroundColor: "#333",
            color: "#FFF",
            border: `2px solid ${error ? "#DC143C" : "#FFD700"}`,
            borderRadius: "4px",
            padding: "10px",
            resize: "none",
            fontFamily: "monospace",
          }}
          maxLength={maxLength + 1}
        />
        <p style={{ color: "#FFF", fontSize: "12px" }}>
          {prayer.length}/{maxLength} characters
        </p>
        {error && (
          <p style={{ color: "#DC143C", fontSize: "14px", margin: "5px 0" }}>
            {error}
          </p>
        )}
        <div style={{ position: "relative", display: "inline-block" }}>
          <button
            type="submit"
            disabled={sending}
            style={{
              backgroundColor: sending ? "#999" : "#FFD700",
              color: "#1a1a1a",
              padding: "10px 20px",
              border: "none",
              borderRadius: "4px",
              cursor: sending ? "not-allowed" : "pointer",
              fontWeight: "bold",
            }}
          >
            {sending ? "Sending…" : "Submit Prayer"}
          </button>
          {showSuccess && (
            <span
              style={{
                position: "absolute",
                right: "-36px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#0f0",
                fontWeight: "bold",
                animation: "fadeScale 1.2s ease-out",
              }}
            >
              ✓
            </span>
          )}
          <style>{`@keyframes fadeScale { 0% { opacity: 0; transform: translateY(-50%) scale(0.6); } 20% { opacity: 1; transform: translateY(-50%) scale(1.1);} 100% { opacity: 0; transform: translateY(-50%) scale(1); } }`}</style>
        </div>
      </form>
    </div>
  );
};

export default PrayForm;
