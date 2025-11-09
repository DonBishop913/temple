const http = require("http");

const data = JSON.stringify({
  source: "node_anomaly_test",
  sr: [{ frequency: 7.83, amplitude: 5.0, label: "anomaly_test_high" }],
  meta: { tester: "test_sr_anomaly.js" },
});

const options = {
  hostname: "localhost",
  port: 5174,
  path: "/data-ingest",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(data),
  },
};

const req = http.request(options, (res) => {
  let body = "";
  res.setEncoding("utf8");
  res.on("data", (chunk) => (body += chunk));
  res.on("end", () => {
    console.log("STATUS", res.statusCode);
    console.log("BODY", body);
  });
});

req.on("error", (e) => console.error("Request error", e));
req.write(data);
req.end();
