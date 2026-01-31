import React, { useEffect, useState } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:5174");

export default function VideoPanel() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchList() {
      try {
        const res = await fetch("/api/video-links");
        const data = await res.json();
        setVideos(data);
      } catch (e) {
        console.error("Failed to load video list", e);
      } finally {
        setLoading(false);
      }
    }

    fetchList();

    function onVideoAdded(msg) {
      if (msg && msg.event === "video-added" && msg.entry) {
        setVideos((prev) => [...prev, msg.entry]);
      }
    }

    function onVideoVote(msg) {
      if (msg && msg.event === "video-vote" && typeof msg.index === "number") {
        setVideos((prev) => {
          const copy = [...prev];
          if (!copy[msg.index]) return copy;
          copy[msg.index] = {
            ...copy[msg.index],
            votes: copy[msg.index].votes || { approve: 0, flag: 0 },
          };
          if (msg.approve)
            copy[msg.index].votes.approve =
              (copy[msg.index].votes.approve || 0) + 1;
          else
            copy[msg.index].votes.flag = (copy[msg.index].votes.flag || 0) + 1;
          return copy;
        });
      }
    }

    socket.on("dashboard-update", onVideoAdded);
    socket.on("dashboard-update", onVideoVote);

    return () => {
      socket.off("dashboard-update", onVideoAdded);
      socket.off("dashboard-update", onVideoVote);
    };
  }, []);

  if (loading) return <div>Loading videos...</div>;

  return (
    <div className="video-panel">
      <h3>Council Video Watchlist</h3>
      {videos.length === 0 ? (
        <div>No videos</div>
      ) : (
        <ul>
          {videos.map((v, idx) => (
            <li key={idx} style={{ marginBottom: "12px" }}>
              <div>
                <strong>{v.title}</strong>{" "}
                <small>({new Date(v.timestamp).toLocaleString()})</small>
              </div>
              <div>Overlays: {v.overlays && v.overlays.join(", ")}</div>
              <div>
                Votes: ✅{v.votes?.approve || 0} ❌{v.votes?.flag || 0}
              </div>
              <div style={{ marginTop: "6px" }}>
                <button
                  onClick={async () => {
                    await fetch(`/api/video-vote/${idx}?approve=true`, {
                      method: "POST",
                    });
                  }}
                >
                  Approve
                </button>
                <button
                  onClick={async () => {
                    await fetch(`/api/video-vote/${idx}?approve=false`, {
                      method: "POST",
                    });
                  }}
                >
                  Flag
                </button>
                <button
                  onClick={() => {
                    const src = v.url.includes("watch?v=")
                      ? v.url.replace("watch?v=", "embed/")
                      : v.url;
                    window.open(src, "_blank");
                  }}
                >
                  Open
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
