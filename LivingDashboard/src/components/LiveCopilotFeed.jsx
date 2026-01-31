import { useEffect, useState } from "react";

export default function LiveCopilotFeed() {
  const [feed, setFeed] = useState([]);
  useEffect(() => {
    fetch("http://localhost:3000/api/copilot")
      .then((r) => r.json())
      .then((d) => setFeed(d.liveFeed || []));
  }, []);
  return (
    <div className="space-y-1">
      {feed.map((item, i) => (
        <div key={i} className="text-sm text-gray-700">
          {item}
        </div>
      ))}
    </div>
  );
}
