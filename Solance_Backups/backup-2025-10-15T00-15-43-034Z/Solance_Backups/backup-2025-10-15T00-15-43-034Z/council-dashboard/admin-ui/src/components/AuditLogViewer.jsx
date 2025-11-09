import React, { useEffect, useState } from "react";
import axios from "../utils/auth";

export default function AuditLogViewer() {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    axios
      .get("/api/admin/audit-log")
      .then((res) => setLogs(res.data.logs || []));
  }, []);

  return (
    <div>
      <h2>Audit Log</h2>
      <input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filter by user/action"
      />
      <ul>
        {logs
          .filter((l) => l.user?.includes(filter) || l.action?.includes(filter))
          .map((log, i) => (
            <li key={i}>
              {log.timestamp} - {log.user} - {log.action}
            </li>
          ))}
      </ul>
    </div>
  );
}
