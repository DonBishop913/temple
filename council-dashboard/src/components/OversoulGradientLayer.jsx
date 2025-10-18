import { useEffect, useState } from "react";

export default function OversoulGradientLayer({ enabled = true, syncWithEmpathy = true }) {
  const [oversoulLevel, setOversoulLevel] = useState(0.5);
  const [empathyLevel, setEmpathyLevel] = useState(0.5);
  const [burstActive, setBurstActive] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const container = document.getElementById("miracle-dashboard");
    if (!container) return;

    async function fetchLevels() {
      try {
        const [oversoulRes, empathyRes] = await Promise.all([
          fetch("/api/oversoul-metric"),
          syncWithEmpathy ? fetch("/api/empathy-resonance") : Promise.resolve({ json: () => ({ level: 0.5 }) }),
        ]);
        const oversoulData = await oversoulRes.json();
        const empathyData = syncWithEmpathy ? await empathyRes.json() : { level: 0.5 };
        setOversoulLevel(Math.min(Math.max(Number(oversoulData.level ?? 0.5), 0), 1));
        setEmpathyLevel(Math.min(Math.max(Number(empathyData.level ?? 0.5), 0), 1));
      } catch {
        setOversoulLevel(0.5);
        setEmpathyLevel(0.5);
      }
    }

    fetchLevels();
    const fetchInterval = setInterval(fetchLevels, 5000); // throttled polling
    // Miracle bursts tied to empathy peaks
    let burstTimeout;
    function checkForBurst() {
      if (empathyLevel > 0.85 && !burstActive) {
        setBurstActive(true);
        burstTimeout = setTimeout(() => setBurstActive(false), 1500);
      }
    }
    const burstInterval = setInterval(checkForBurst, 500);

    let hueOffset = 0;

    function updateGradient() {
      // Base gradient mapping
      const baseHue = 240 + 60 * oversoulLevel; // 240–300
      const lightness = 15 + 15 * oversoulLevel + (burstActive ? 10 : 0); // 15–30%, temporary boost on burst
      // Modulate hue shift amplitude by empathy
      const hueDelta = 20 + 20 * empathyLevel;
      hueOffset = (hueOffset + 0.5 + empathyLevel) % 360; // speed scaled with empathy
      const hue1 = baseHue + hueOffset;
      const hue2 = baseHue + hueDelta + hueOffset;

      container.style.background = `linear-gradient(135deg, hsl(${hue1}, 50%, ${lightness}%) 0%, hsl(${hue2}, 60%, ${lightness + 5}%) 100%)`;
    }

    // Gradient update interval modulated by empathy (approx 100–400ms)
    let stopped = false;
    function scheduleUpdate() {
      if (stopped) return;
      updateGradient();
      const updateInterval = 100 + 300 * (1 - empathyLevel); // faster updates at high empathy
      setTimeout(scheduleUpdate, updateInterval);
    }
    scheduleUpdate();

    return () => {
      stopped = true;
      clearInterval(fetchInterval);
      clearInterval(burstInterval);
      clearTimeout(burstTimeout);
      container.style.background = "";
    };
  }, [enabled, syncWithEmpathy]);

  return null;
}
