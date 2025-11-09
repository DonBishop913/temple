import React, { useEffect, useState } from "react";

const CRITICAL_KEYWORDS = [
  "fail",
  "critical",
  "unresponsive",
  "error",
  "panic",
];
const HEALING_EVENT_TYPES = [
  "auto_recovery",
  "predicted_failure",
  "recovery_executed",
  "recovery_blocked_spiritual",
  "harmony_warning",
];

export default function HealingEventsPanel() {
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("desc");
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    fetch("/api/abt/recent")
      .then((res) => res.json())
      .then((data) =>
        setEvents(data.filter((e) => HEALING_EVENT_TYPES.includes(e.event))),
      );
  }, []);

  // Filtering logic
  const filteredEvents = events.filter((e) => {
    if (filter === "all") return true;
    if (filter === "critical")
      return CRITICAL_KEYWORDS.some((k) =>
        (e.notes || "").toLowerCase().includes(k),
      );
    if (filter === "last24h") {
      const now = Date.now();
      return now - new Date(e.timestamp).getTime() < 24 * 60 * 60 * 1000;
    }
    return true;
  });

  // Sorting logic
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    if (sortOrder === "desc")
      return new Date(b.timestamp) - new Date(a.timestamp);
    return new Date(a.timestamp) - new Date(b.timestamp);
  });

  // Simple alerting for critical events
  useEffect(() => {
    const critical = events.find((e) =>
      CRITICAL_KEYWORDS.some((k) => (e.notes || "").toLowerCase().includes(k)),
    );
    if (critical)
      setAlert(
        `Critical healing event: ${critical.notes} (Node: ${critical.node_id || critical.node || "council"})`,
      );
    else setAlert(null);
  }, [events]);

  return (
    <section
      aria-label="Autonomous Healing Events"
      className="p-4 bg-gray-900 rounded-lg shadow-lg text-white"
    >
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold">Council Healing Events</h2>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-gray-800 text-white rounded px-2 py-1"
          >
            <option value="all">All</option>
            <option value="critical">Critical Only</option>
            <option value="last24h">Last 24h</option>
          </select>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="bg-gray-800 text-white rounded px-2 py-1"
          >
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </div>
      </div>
      {alert && (
        <div className="mb-2 p-2 bg-red-700 text-white rounded shadow animate-pulse">
          <strong>ALERT:</strong> {alert}
        </div>
      )}
      <ul className="space-y-2">
        {sortedEvents.map((e) => (
          <li
            key={e.timestamp + (e.node_id || e.node || "") + (e.event || "")}
            className={`bg-gray-800 rounded p-2 ${CRITICAL_KEYWORDS.some((k) => (e.notes || "").toLowerCase().includes(k)) ? "border-l-4 border-red-500" : ""}`}
          >
            <div>
              Type: <span className="font-semibold">{e.event}</span>
            </div>
            <div>
              Node:{" "}
              <span className="font-semibold">
                {e.node_id || e.node || "council"}
              </span>
            </div>
            <div>
              Notes: <span className="italic">{e.notes}</span>
            </div>
            {e.score && (
              <div>
                Council Health Score:{" "}
                <span className="font-bold">{e.score}</span>
              </div>
            )}
            <div className="text-xs opacity-70">
              Time: {new Date(e.timestamp).toLocaleString()}
            </div>
          </li>
        ))}
        {sortedEvents.length === 0 && (
          <li className="text-sm opacity-70">
            No healing events recorded yet.
          </li>
        )}
      </ul>
    </section>
  );
}
