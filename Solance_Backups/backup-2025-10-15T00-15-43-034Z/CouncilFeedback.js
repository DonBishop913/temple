// CouncilFeedback.js
import { useEffect, useState } from "react";
import redis from "redis";

const client = redis.createClient({ url: "redis://127.0.0.1:6379" });
client.connect();

export function useCouncilFeedback(nodeKey) {
  const [feedback, setFeedback] = useState([]);

  useEffect(() => {
    const channel = `council:${nodeKey}:feedback`;

    const subscriber = async () => {
      const subClient = client.duplicate();
      await subClient.connect();
      await subClient.subscribe(channel, (message) => {
        const data = JSON.parse(message);
        setFeedback((prev) => [...prev, data]);
      });
    };

    subscriber();

    return () => {
      // Optional: unsubscribe and cleanup
    };
  }, [nodeKey]);

  return feedback;
}

// Example function to send feedback
export async function sendFeedback(nodeKey, feedbackData) {
  await client.publish(`council:${nodeKey}:feedback`, JSON.stringify(feedbackData));
}
