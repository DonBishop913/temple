import React, { useState, useEffect } from "react";

function verifyChain(ledger) {
  for (let i = 1; i < ledger.length; i++) {
    if (ledger[i].prevHash !== ledger[i - 1].entryHash) {
      return false;
    }
  }
  return true;
}

export default function QuantumSyncLedger() {
  const [ledger, setLedger] = useState([]);
  const [chainValid, setChainValid] = useState(true);

  useEffect(() => {
    fetch("http://localhost:5000/ledger")
      .then((res) => res.json())
      .then((data) => {
        setLedger(data);
        setChainValid(verifyChain(data));
      })
      .catch(() => {
        setLedger([]);
        setChainValid(false);
      });
  }, []);

  return (
    <div>
      <h2>Quantum Sync Ledger</h2>
      <p style={{ color: chainValid ? "green" : "red" }}>
        Chain Status: {chainValid ? "Valid" : "TAMPERED"}
      </p>
      <table>
        <thead>
          <tr>
            <th>Event</th>
            <th>Local Time</th>
            <th>UTC Time</th>
            <th>Lunar Phase</th>
            <th>Solar Longitude</th>
            <th>PEI Tone</th>
            <th>Notes</th>
            <th>Hash</th>
          </tr>
        </thead>
        <tbody>
          {ledger.map((e) => (
            <tr key={e.id} style={{ borderLeft: `5px solid ${e.peiTone}` }}>
              <td>{e.event_name}</td>
              <td>{e.local_time}</td>
              <td>{e.utc_time}</td>
              <td>{e.lunar_phase}</td>
              <td>{e.solar_longitude}</td>
              <td>{e.peiTone}</td>
              <td>{e.notes}</td>
              <td style={{ fontFamily: "monospace", fontSize: 10 }}>
                {e.entryHash.substring(0, 10)}...
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
