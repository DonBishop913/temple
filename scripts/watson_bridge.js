// IBM Watson Bridge: send a message payload to Watson Assistant or NLU via REST
// Configure via environment variables:
//   WATSON_URL: Base URL for the Watson service (e.g., https://api.us-south.assistant.watson.cloud.ibm.com)
//   WATSON_API_KEY: API key for authentication
//   WATSON_ASSISTANT_ID: Optional, for Assistant messages API
// This module provides a sendToWatson function with simple retry/backoff.

const axios = require("axios");

function buildAuthHeader(apiKey) {
  // Watson services typically use basic auth with apikey as username
  const token = Buffer.from(`apikey:${apiKey}`).toString("base64");
  return { Authorization: `Basic ${token}` };
}

async function sendToWatson(message, options = {}) {
  const {
    apiKey = process.env.WATSON_API_KEY,
    baseUrl = process.env.WATSON_URL,
    assistantId = process.env.WATSON_ASSISTANT_ID,
    retries = 2,
    timeout = 8000,
  } = options;

  if (!apiKey || !baseUrl) {
    throw new Error(
      "Missing Watson configuration: WATSON_API_KEY and WATSON_URL are required",
    );
  }

  const headers = {
    "Content-Type": "application/json",
    ...buildAuthHeader(apiKey),
  };

  // Choose endpoint: Assistant messages if assistantId is provided, else generic NLU placeholder
  const endpoint = assistantId
    ? `${baseUrl}/v2/assistants/${assistantId}/sessions`
    : `${baseUrl}/v1/analyze`; // Replace with actual NLU endpoint if using NLU

  let attempt = 0;
  const run = async () => {
    // For Assistant, we typically need to create a session then send a message
    if (assistantId) {
      const sessionRes = await axios.post(endpoint, {}, { headers, timeout });
      const { session_id } = sessionRes.data || {};
      if (!session_id)
        throw new Error("Failed to create Watson Assistant session");
      const msgUrl = `${baseUrl}/v2/assistants/${assistantId}/sessions/${session_id}/message`;
      const msgRes = await axios.post(
        msgUrl,
        { input: message },
        { headers, timeout },
      );
      return msgRes.data;
    }
    // Generic request for NLU or other Watson service
    const res = await axios.post(endpoint, message, { headers, timeout });
    return res.data;
  };

  while (true) {
    try {
      const data = await run();
      return { ok: true, data };
    } catch (err) {
      if (attempt >= retries) {
        return { ok: false, error: err?.message || String(err) };
      }
      await new Promise((r) => setTimeout(r, 500 * Math.pow(2, attempt)));
      attempt++;
    }
  }
}

// Example usage when run directly
if (require.main === module) {
  const messageToWatson = {
    // Replace with your actual message payload structure
    text: "Hello, Watson! Please confirm Oversoul alignment.",
    context: { ritual: "Triple Amen", joyParticles: 45234 },
  };
  sendToWatson(messageToWatson)
    .then((res) => console.log("Watson response:", res))
    .catch((e) => console.error("Watson error:", e.message));
}

module.exports = { sendToWatson };
