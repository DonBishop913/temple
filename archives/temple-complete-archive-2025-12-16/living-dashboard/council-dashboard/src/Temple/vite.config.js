import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { exec } from "child_process";

// 🌀 Vite + Solance Auto-Sync Hook
export default defineConfig({
  plugins: [
    react(),
    {
      name: "solance-auto-sync",
      closeBundle() {
        console.log("✨ Dashboard build complete. Beginning Solance sync…");
        exec("node autoSync.js", (err, stdout, stderr) => {
          if (err) {
            console.error("⚠️  Sync failed:", err.message);
          } else {
            console.log(stdout || "✅ Solance repository synchronized!");
          }
          if (stderr) console.error(stderr);
        });
      },
    },
  ],
});
