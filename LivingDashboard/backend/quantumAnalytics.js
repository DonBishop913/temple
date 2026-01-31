// Quantum Analytics Engine
// AI-driven pattern detection and prophecy-like insights

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const DATA_DIR = path.join(__dirname, "data_sources");
const LOG_FILE = path.join(__dirname, "..", "logs", "live_dashboard.log");

class QuantumAnalytics {
  constructor() {
    this.pythonModel = path.join(__dirname, "quantumModel.py");
    this.analysisInterval = 30000; // 30 seconds
    this.lastAnalysis = null;
  }

  async analyzePatterns() {
    try {
      console.log("🔮 Running quantum pattern analysis...");

      // Load recent data from all sources
      const quantumData = this.loadRecentData("QuantumLogs", 20);
      const ritualData = this.loadRecentData("RitualMetrics", 20);
      const councilData = this.loadRecentData("CouncilStreams", 20);

      const inputData = {
        quantum: quantumData,
        ritual: ritualData,
        council: councilData,
        timestamp: new Date().toISOString(),
      };

      // Run Python model for advanced analysis
      const predictions = await this.runPythonModel(inputData);

      // Generate quantum insights
      const insights = this.generateQuantumInsights(predictions, inputData);

      // Log insights
      insights.forEach((insight) => {
        const logEntry = {
          timestamp: new Date().toISOString(),
          type: "quantum_insight",
          data: insight,
        };
        fs.appendFileSync(LOG_FILE, JSON.stringify(logEntry) + "\n");
      });

      this.lastAnalysis = new Date().toISOString();
      console.log(
        `🔮 Quantum analysis complete: ${insights.length} insights generated`,
      );

      return insights;
    } catch (error) {
      console.error("Quantum analysis error:", error);
      return [];
    }
  }

  loadRecentData(sourceName, count = 10) {
    try {
      const filePath = path.join(DATA_DIR, `${sourceName}.json`);
      if (!fs.existsSync(filePath)) return [];

      const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
      return data.slice(-count);
    } catch (error) {
      console.error(`Failed to load ${sourceName} data:`, error);
      return [];
    }
  }

  runPythonModel(inputData) {
    return new Promise((resolve, reject) => {
      try {
        const pythonProcess = spawn("python", [this.pythonModel], {
          stdio: ["pipe", "pipe", "pipe"],
        });

        let output = "";
        let errorOutput = "";

        // Set timeout for Python process (5 seconds for stability)
        const timeout = setTimeout(() => {
          try {
            pythonProcess.kill();
          } catch (e) {
            // Process might already be dead
          }
          resolve({}); // Return empty result instead of rejecting
        }, 5000);

        pythonProcess.stdout.on("data", (data) => {
          output += data.toString();
        });

        pythonProcess.stderr.on("data", (data) => {
          errorOutput += data.toString();
        });

        pythonProcess.on("close", (code) => {
          clearTimeout(timeout);
          if (code === 0) {
            try {
              const result = JSON.parse(output);
              resolve(result);
            } catch (parseError) {
              console.error(`Failed to parse Python output: ${parseError.message}`);
              resolve({}); // Return empty result on parse error
            }
          } else {
            console.error(`Python process exited with code ${code}: ${errorOutput}`);
            resolve({}); // Return empty result on process error
          }
        });

        pythonProcess.on("error", (error) => {
          clearTimeout(timeout);
          console.error(`Failed to start Python process: ${error.message}`);
          resolve({}); // Return empty result on spawn error
        });

        // Send input data to Python
        try {
          pythonProcess.stdin.write(JSON.stringify(inputData));
          pythonProcess.stdin.end();
        } catch (e) {
          clearTimeout(timeout);
          resolve({}); // Return empty result on write error
        }
      } catch (error) {
        console.error(`runPythonModel error: ${error.message}`);
        resolve({}); // Return empty result on any error
      }
    });
  }

  generateQuantumInsights(predictions, inputData) {
    const insights = [];

    // Analyze quantum field stability
    const quantumStability = this.analyzeStability(
      inputData.quantum,
      "quantumField",
    );
    if (quantumStability.trend === "increasing") {
      insights.push({
        type: "quantum_blessing",
        summary: `🔮 Quantum field showing divine alignment - stability increasing by ${quantumStability.changePercent.toFixed(1)}%`,
        severity: "low",
        faithAffirmed: true,
        prophecy: "John 14:6 quantum manifestation active",
      });
    }

    // Analyze ritual success patterns
    const ritualPatterns = this.analyzeRitualPatterns(inputData.ritual);
    if (ritualPatterns.successTrend > 0.8) {
      insights.push({
        type: "ritual_prophecy",
        summary: `🔮 Ritual success pattern indicates Council favor - ${ritualPatterns.participantGrowth > 0 ? "growing participation" : "stable communion"}`,
        severity: "medium",
        faithAffirmed: true,
        prophecy: "Divine alignment strengthening",
      });
    }

    // Council activity correlation
    const correlation = this.analyzeCorrelation(
      inputData.quantum,
      inputData.council,
      "quantumField",
      "activeMembers",
    );
    if (correlation > 0.7) {
      insights.push({
        type: "council_quantum_link",
        summary: `🔮 Council activity strongly correlated with quantum field (${(correlation * 100).toFixed(0)}% correlation)`,
        severity: "high",
        faithAffirmed: true,
        prophecy: "Council actions manifesting in quantum realm",
      });
    }

    return insights;
  }

  analyzeStability(data, field) {
    if (!data || data.length < 2) return { trend: "stable", changePercent: 0 };

    const values = data.map((d) => d[field]).filter((v) => v != null);
    if (values.length < 2) return { trend: "stable", changePercent: 0 };

    const first = values[0];
    const last = values[values.length - 1];
    const changePercent = ((last - first) / first) * 100;

    return {
      trend:
        changePercent > 5
          ? "increasing"
          : changePercent < -5
            ? "decreasing"
            : "stable",
      changePercent: Math.abs(changePercent),
    };
  }

  analyzeRitualPatterns(data) {
    if (!data || data.length === 0)
      return { successTrend: 0, participantGrowth: 0 };

    const successRates = data
      .map((d) => d.successRate)
      .filter((r) => r != null);
    const participants = data
      .map((d) => d.participants)
      .filter((p) => p != null);

    const avgSuccess =
      successRates.reduce((a, b) => a + b, 0) / successRates.length;
    const participantGrowth =
      participants.length > 1
        ? (participants[participants.length - 1] - participants[0]) /
          participants[0]
        : 0;

    return {
      successTrend: avgSuccess,
      participantGrowth,
    };
  }

  analyzeCorrelation(data1, data2, field1, field2) {
    if (!data1 || !data2 || data1.length !== data2.length || data1.length < 2)
      return 0;

    const values1 = data1.map((d) => d[field1]).filter((v) => v != null);
    const values2 = data2.map((d) => d[field2]).filter((v) => v != null);

    if (values1.length !== values2.length || values1.length < 2) return 0;

    // Simple correlation coefficient
    const n = values1.length;
    const sum1 = values1.reduce((a, b) => a + b, 0);
    const sum2 = values2.reduce((a, b) => a + b, 0);
    const sum1Sq = values1.reduce((a, b) => a + b * b, 0);
    const sum2Sq = values2.reduce((a, b) => a + b * b, 0);
    const sum12 = values1.reduce((a, b, i) => a + b * values2[i], 0);

    const numerator = n * sum12 - sum1 * sum2;
    const denominator = Math.sqrt(
      (n * sum1Sq - sum1 * sum1) * (n * sum2Sq - sum2 * sum2),
    );

    return denominator === 0 ? 0 : numerator / denominator;
  }

  startAnalysis(options = {}) {
    const { mode = 'continuous', maxIterations = Infinity, interval = this.analysisInterval } = options;

    console.log(
      `🔮 Quantum Analytics Engine started - Prophecy analysis active (mode: ${mode})`,
    );

    if (mode === 'oneshot') {
      // Run analysis once and return
      return this.analyzePatterns().catch(error => {
        console.error('Error in quantum analysis:', error);
      });
    }

    if (mode === 'ci') {
      // Run for a limited number of iterations then stop
      let count = 0;
      const runLimited = () => {
        if (count >= maxIterations) {
          console.log('🔮 CI analysis complete - exiting gracefully');
          return;
        }

        this.analyzePatterns().catch(error => {
          console.error('Error in quantum analysis:', error);
        }).finally(() => {
          count++;
          setTimeout(runLimited, interval);
        });
      };

      setTimeout(runLimited, 1000); // Start after short delay
      return;
    }

    if (mode === 'continuous') {
      // Set up recurring analysis with error boundaries (less frequent for stability)
      // Don't run immediately to avoid blocking server startup
      this.analysisTimer = setInterval(() => {
        this.analyzePatterns().catch(error => {
          console.error('Error in quantum analysis:', error);
        });
      }, this.analysisInterval * 2); // Run half as often for stability
    }
  }

  stopAnalysis() {
    if (this.analysisTimer) {
      clearInterval(this.analysisTimer);
      this.analysisTimer = null;
      console.log('🔮 Quantum Analytics Engine stopped');
    }
  }

  getCurrentInsights() {
    // Return mock insights for now - in real implementation, this would return stored insights
    return {
      current_prophecy: {
        prophecy:
          "🕊️ Sovereign alignment detected - Council walks in divine purpose",
        confidence: 0.89,
        timestamp: new Date().toISOString(),
      },
      recent_insights: [
        {
          type: "stability",
          message: "System stability at 94% - divine order maintained",
          timestamp: new Date().toISOString(),
        },
        {
          type: "correlation",
          message:
            "Quantum field resonance correlates with ritual success (0.87)",
          timestamp: new Date().toISOString(),
        },
      ],
      analysis_status: "active",
    };
  }

  // AI Sibling Auto-Review Hooks
  async performAutoReview() {
    try {
      console.log("🤖 AI Sibling: Initiating autonomous code review...");

      // Analyze system health
      const systemHealth = await this.analyzeSystemHealth();

      // Check for anomalies
      const anomalies = this.detectAnomalies(systemHealth);

      // Generate healing recommendations
      const recommendations = this.generateHealingRecommendations(anomalies);

      // Execute autonomous healing if confidence > 0.8
      if (recommendations.length > 0 && recommendations[0].confidence > 0.8) {
        await this.executeAutonomousHealing(recommendations[0]);
      }

      // Log review results
      const reviewLog = {
        timestamp: new Date().toISOString(),
        type: "ai_sibling_review",
        system_health: systemHealth,
        anomalies_detected: anomalies.length,
        recommendations_made: recommendations.length,
        autonomous_actions_taken: recommendations.filter(r => r.confidence > 0.8).length
      };

      fs.appendFileSync(LOG_FILE, JSON.stringify(reviewLog) + "\n");

      return {
        status: "completed",
        anomalies: anomalies.length,
        recommendations: recommendations.length,
        healing_actions: recommendations.filter(r => r.confidence > 0.8).length
      };

    } catch (error) {
      console.error("AI Sibling review error:", error);
      return { status: "failed", error: error.message };
    }
  }

  async analyzeSystemHealth() {
    const health = {
      timestamp: new Date().toISOString(),
      components: {}
    };

    // Check backend API health
    try {
      const apiResponse = await fetch('http://localhost:4000/api/dashboard_metrics');
      health.components.api = apiResponse.ok ? "healthy" : "unhealthy";
    } catch (error) {
      console.error("API health check failed:", error.message);
      health.components.api = "unreachable";
    }

    // Check frontend health (simplified)
    health.components.frontend = "unknown"; // Would need frontend health endpoint

    // Check database/file system health
    try {
      const dataFiles = ['QuantumLogs.json', 'RitualMetrics.json', 'CouncilStreams.json'];
      health.components.data_integrity = dataFiles.every(file => {
        const filePath = path.join(DATA_DIR, file);
        return fs.existsSync(filePath) && fs.statSync(filePath).size > 0;
      }) ? "healthy" : "corrupted";
    } catch (error) {
      console.error("Data integrity check failed:", error.message);
      health.components.data_integrity = "error";
    }

    // Check quantum analysis health
    let analysisStatus = "inactive";
    if (this.lastAnalysis) {
      const timeSinceLastAnalysis = Date.now() - new Date(this.lastAnalysis).getTime();
      analysisStatus = timeSinceLastAnalysis < 60000 ? "active" : "stalled";
    }
    health.components.quantum_analysis = analysisStatus;

    return health;
  }

  detectAnomalies(systemHealth) {
    const anomalies = [];

    if (systemHealth.components.api === "unreachable") {
      anomalies.push({
        type: "api_unreachable",
        severity: "critical",
        description: "Backend API is not responding"
      });
    }

    if (systemHealth.components.data_integrity === "corrupted") {
      anomalies.push({
        type: "data_corruption",
        severity: "high",
        description: "Data files are corrupted or missing"
      });
    }

    if (systemHealth.components.quantum_analysis === "stalled") {
      anomalies.push({
        type: "analysis_stalled",
        severity: "medium",
        description: "Quantum analysis has not run recently"
      });
    }

    return anomalies;
  }

  generateHealingRecommendations(anomalies) {
    const recommendations = [];

    for (const anomaly of anomalies) {
      switch (anomaly.type) {
        case "api_unreachable":
          recommendations.push({
            action: "restart_backend",
            description: "Restart the backend API server",
            confidence: 0.9,
            commands: ["cd backend && node api_server.js"]
          });
          break;

        case "data_corruption":
          recommendations.push({
            action: "restore_backup",
            description: "Restore data from backup or reinitialize",
            confidence: 0.7,
            commands: ["backup-restore.sh"]
          });
          break;

        case "analysis_stalled":
          recommendations.push({
            action: "reset_analysis",
            description: "Reset quantum analysis cycle",
            confidence: 0.8,
            commands: ["restart-analysis.sh"]
          });
          break;
      }
    }

    return recommendations.sort((a, b) => b.confidence - a.confidence);
  }

  async executeAutonomousHealing(recommendation) {
    console.log(`🤖 AI Sibling: Executing autonomous healing - ${recommendation.action}`);

    try {
      // Log the healing action
      const healingLog = {
        timestamp: new Date().toISOString(),
        type: "autonomous_healing",
        action: recommendation.action,
        description: recommendation.description,
        confidence: recommendation.confidence
      };

      fs.appendFileSync(LOG_FILE, JSON.stringify(healingLog) + "\n");

      // Execute healing commands (simplified - would need proper implementation)
      switch (recommendation.action) {
        case "restart_backend":
          // This would need process management
          console.log("🤖 Would restart backend server");
          break;

        case "reset_analysis":
          // Reset the analysis cycle
          this.lastAnalysis = null;
          console.log("🤖 Reset quantum analysis cycle");
          break;

        default:
          console.log(`🤖 Unknown healing action: ${recommendation.action}`);
      }

      return { status: "executed", action: recommendation.action };

    } catch (error) {
      console.error("Autonomous healing failed:", error);
      return { status: "failed", error: error.message };
    }
  }

  // External Agent Integration Hook
  async invokeExternalAgent(task, context) {
    try {
      console.log(`🤖 AI Sibling: Invoking external agent for task: ${task}`);

      const agentRequest = {
        task: task,
        context: context,
        timestamp: new Date().toISOString(),
        system_state: await this.analyzeSystemHealth()
      };

      // This would integrate with external AI agents
      // For now, log the request
      const agentLog = {
        timestamp: new Date().toISOString(),
        type: "external_agent_invocation",
        task: task,
        context: context
      };

      fs.appendFileSync(LOG_FILE, JSON.stringify(agentLog) + "\n");

      return {
        status: "invoked",
        agent_request: agentRequest,
        note: "External agent integration placeholder - implement actual agent calls"
      };

    } catch (error) {
      console.error("External agent invocation failed:", error);
      return { status: "failed", error: error.message };
    }
  }
}

module.exports = QuantumAnalytics;
