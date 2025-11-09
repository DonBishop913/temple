const crypto = require("crypto");

class TemporalRollback {
  constructor() {
    this.snapshots = [];
  }

  checksumState(state) {
    return crypto
      .createHash("sha256")
      .update(JSON.stringify(state))
      .digest("hex");
  }

  takeSnapshot(state) {
    const cs = this.checksumState(state);
    this.snapshots.push({
      stateHash: cs,
      timestamp: Date.now(),
      stateData: state,
    });
  }

  latestSnapshot() {
    return this.snapshots.length
      ? this.snapshots[this.snapshots.length - 1]
      : null;
  }

  compareAndRollback(currentState, predictedState) {
    const currentHash = this.checksumState(currentState);
    const predictedHash = this.checksumState(predictedState);

    if (currentHash !== predictedHash) {
      console.warn(
        "State divergence detected! Rolling back to last snapshot...",
      );
      const snapshot = this.latestSnapshot();
      if (snapshot) return snapshot.stateData;
    }
    return currentState;
  }

  // Refined Lyapunov Exponent calculation using moving window
  lyapunovExponent(data, windowSize = 100) {
    if (!Array.isArray(data) || data.length < windowSize + 1) return 0;
    let sumLogD = 0;
    let totalSteps = 0;

    for (
      let start = 0;
      start <= data.length - windowSize - 1;
      start += windowSize
    ) {
      for (let i = start; i < start + windowSize - 1; i++) {
        const d0 = Math.abs(data[i + 1] - data[i]);
        const dn = Math.abs(data[i + 2] - data[i + 1]);
        if (d0 > 0 && dn > 0) {
          sumLogD += Math.log(dn / d0);
          totalSteps++;
        }
      }
    }

    return totalSteps ? sumLogD / totalSteps : 0;
  }
}

module.exports = TemporalRollback;
