const WebSocket = require("ws");
const timeSync = require("./timeSync");
const { URL } = require("url");

const REPLAY_WS_PORT = Number(process.env.REPLAY_WS_PORT || 4323);
const POLL_INTERVAL_MS = Number(process.env.REPLAY_POLL_MS || 1000);
const INITIAL_FETCH_COUNT = Number(process.env.REPLAY_INITIAL_COUNT || 200);

let wss = null;

function start() {
  try {
    wss = new WebSocket.Server({ port: REPLAY_WS_PORT });
    console.log(`Replay WebSocket active on port ${REPLAY_WS_PORT}`);

    wss.on("connection", (ws, req) => {
      // Each client keeps its own play state and last-sent id
      const client = {
        ws,
        playing: true,
        lastId: null,
        pollHandle: null,
      };

      // Send a small handshake
      try {
        ws.send(
          JSON.stringify({
            type: "replay:hello",
            at: Date.now(),
            mode: "tail",
          }),
        );
      } catch {}

      // Bootstrap: send last N entries from timeSync
      (async () => {
        try {
          const entries = await timeSync.fetchRange(
            "-",
            "+",
            INITIAL_FETCH_COUNT,
          );
          if (entries && entries.length) {
            // sort by id ascending
            entries.sort((a, b) => a.id.localeCompare(b.id));
            for (const e of entries) {
              try {
                ws.send(JSON.stringify({ type: "replay:event", entry: e }));
              } catch {}
            }
            client.lastId = entries[entries.length - 1].id;
          }
        } catch (e) {
          console.warn("replay bootstrap failed", e && e.message);
        }
      })();

      // Polling loop to fetch new events and stream
      client.pollHandle = setInterval(async () => {
        if (!client.playing) return;
        try {
          // if no lastId, fetch tail by count
          let entries = [];
          if (!client.lastId) {
            entries = await timeSync.fetchRange("-", "+", INITIAL_FETCH_COUNT);
          } else {
            // XRANGE from (lastId) to +, but skip lastId itself
            // timeSync.fetchRange expects id range; use next lexicographic id by appending '-'
            const start = client.lastId;
            entries = await timeSync.fetchRange(start, "+", 1000);
            // filter out the one equal to lastId
            entries = entries.filter((e) => e.id !== start);
          }
          if (entries && entries.length) {
            entries.sort((a, b) => a.id.localeCompare(b.id));
            for (const e of entries) {
              try {
                ws.send(JSON.stringify({ type: "replay:event", entry: e }));
              } catch {}
              client.lastId = e.id;
            }
          }
        } catch (e) {
          try {
            ws.send(
              JSON.stringify({
                type: "replay:error",
                message: String(e && e.message),
              }),
            );
          } catch {}
        }
      }, POLL_INTERVAL_MS);

      ws.on("message", (msg) => {
        try {
          const parsed = JSON.parse(String(msg));
          const action = parsed.action;
          if (action === "pause") client.playing = false;
          else if (action === "play") client.playing = true;
          else if (action === "seek") {
            // expecting { action: 'seek', id: '<stream-id>' } or timestamp
            const id = parsed.id || parsed.fromId;
            const ts = parsed.timestamp;
            if (id) client.lastId = id;
            // if timestamp provided, do a range search and send events >= timestamp
            if (ts) {
              (async () => {
                try {
                  // naive approach: fetch large window and filter by event.timestamp
                  const entries = await timeSync.fetchRange("-", "+", 2000);
                  const filtered = entries.filter((e) => {
                    const t = Date.parse(e.timestamp || e.at || e.ts || 0);
                    return t >= Number(ts);
                  });
                  filtered.sort((a, b) => a.id.localeCompare(b.id));
                  for (const e of filtered)
                    try {
                      ws.send(
                        JSON.stringify({ type: "replay:event", entry: e }),
                      );
                    } catch {}
                  if (filtered.length)
                    client.lastId = filtered[filtered.length - 1].id;
                } catch (ee) {
                  console.warn("seek failed", ee && ee.message);
                }
              })();
            }
          }
        } catch (e) {
          try {
            ws.send(
              JSON.stringify({
                type: "replay:error",
                message: "invalid message",
              }),
            );
          } catch {}
        }
      });

      ws.on("close", () => {
        clearInterval(client.pollHandle);
      });
    });
  } catch (e) {
    console.warn("Replay WebSocket failed to start:", e && e.message);
  }
}

module.exports = { start };
