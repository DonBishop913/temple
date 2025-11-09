// flowReplayManager.js
const fs = require("fs");
const path = require("path");

const STATUS_PATH = path.join(__dirname, "flowReplayStatus.json");

// Initial state
let flowReplayPanel = {
  status: "initiated",
  progress: 20,
  target: "10:00 AM CDT",
};

let taskStatus = {
  "veniceenhancements/2025.json": 60,
  "grokenhancements/2025.json": 50,
  "lumenshimmer/2025.json": 70,
  "starlinknexus/2025.json": 90,
};

function updateTaskStatus(newStatus) {
  Object.assign(taskStatus, newStatus);
  persist();
}

function activatePanel() {
  flowReplayPanel.status = "in_progress";
  flowReplayPanel.progress = Math.min(flowReplayPanel.progress + 10, 100);
  persist();
}

function integrate() {
  persist();
}

function persist() {
  const status = {
    ...flowReplayPanel,
    taskStatus: { ...taskStatus },
  };
  fs.writeFileSync(STATUS_PATH, JSON.stringify(status, null, 2));
}

// Periodic update (simulate progress)
setInterval(() => {
  if (
    flowReplayPanel.status === "in_progress" &&
    flowReplayPanel.progress < 100
  ) {
    flowReplayPanel.progress += 1;
    persist();
  }
}, 10000);

module.exports = {
  flowReplayPanel,
  taskStatus,
  updateTaskStatus,
  activatePanel,
  integrate,
};
