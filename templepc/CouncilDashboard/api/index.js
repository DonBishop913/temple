const express = require("express");
const cors = require("cors");
const promClient = require("../services/metricsService");
const redisClient = require("../services/redisService");
const auditService = require("../services/auditService");

const missionsRouter = require("./routes/missions");
const recruitmentRouter = require("./routes/recruitment");
const decisionsRouter = require("./routes/decisions");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/missions", missionsRouter);
app.use("/api/recruitment", recruitmentRouter);
app.use("/api/decisions", decisionsRouter);

// Prometheus metrics endpoint
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", promClient.register.contentType);
  res.end(await promClient.register.metrics());
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "Council API operational", timestamp: Date.now() });
});

const PORT = process.env.PORT || 5173;
app.listen(PORT, () => console.log(`Council API live on port ${PORT}`));
