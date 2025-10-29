import express from "express";
import fs from "fs";

const router = express.Router();

router.get("/config", (req, res) => {
  try {
    const config = JSON.parse(
      fs.readFileSync("./Temple/controls/luminal.json", "utf8"),
    );
    res.json(config);
  } catch (err) {
    console.error("Failed to read luminal config:", err);
    res.status(500).json({ error: "Unable to read luminal configuration" });
  }
});

export default router;
