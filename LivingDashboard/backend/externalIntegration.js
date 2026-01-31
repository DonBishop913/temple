// External Service Integrations
// Connects to sovereign external systems and syncs data

const fs = require("fs");
const path = require("path");
const axios = require("axios");

const CONFIG_PATH = path.join(
  __dirname,
  "..",
  "config",
  "external_services.json",
);

class ExternalIntegration {
  constructor() {
    this.services = this.loadConfig();
    this.lastSync = {};
  }

  loadConfig() {
    try {
      const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
      return config.services || [];
    } catch (error) {
      console.error("Failed to load external services config:", error);
      return [];
    }
  }

  async syncService(serviceName) {
    const service = this.services.find((s) => s.name === serviceName);
    if (!service || !service.enabled) {
      console.log(`Service ${serviceName} not enabled or not found`);
      return null;
    }

    try {
      console.log(`🔗 Syncing with ${serviceName}...`);

      const response = await axios.get(service.endpoint, {
        headers: service.headers || {},
        timeout: service.timeout || 10000,
      });

      const data = {
        service: serviceName,
        timestamp: new Date().toISOString(),
        data: response.data,
        status: "success",
      };

      // Save to data sources
      this.saveToDataSource(serviceName, data);

      this.lastSync[serviceName] = new Date().toISOString();
      console.log(`✅ ${serviceName} synced successfully`);

      return data;
    } catch (error) {
      console.error(`❌ Failed to sync ${serviceName}:`, error.message);

      const errorData = {
        service: serviceName,
        timestamp: new Date().toISOString(),
        error: error.message,
        status: "error",
      };

      this.saveToDataSource(serviceName, errorData);
      return errorData;
    }
  }

  saveToDataSource(serviceName, data) {
    const dataDir = path.join(__dirname, "data_sources");
    const filePath = path.join(dataDir, `${serviceName}.json`);

    try {
      let existing = [];
      if (fs.existsSync(filePath)) {
        existing = JSON.parse(fs.readFileSync(filePath, "utf8"));
      }

      existing.push(data);

      // Keep last 50 entries
      if (existing.length > 50) {
        existing = existing.slice(-50);
      }

      fs.writeFileSync(filePath, JSON.stringify(existing, null, 2));
    } catch (error) {
      console.error(`Failed to save ${serviceName} data:`, error);
    }
  }

  async syncAllServices() {
    const enabledServices = this.services.filter((s) => s.enabled);

    for (const service of enabledServices) {
      await this.syncService(service.name);
      // Small delay between services
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  getServiceStatus() {
    return this.services.map((service) => ({
      name: service.name,
      enabled: service.enabled,
      lastSync: this.lastSync[service.name] || null,
      endpoint: service.endpoint,
    }));
  }
}

module.exports = ExternalIntegration;
