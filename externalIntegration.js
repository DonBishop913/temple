#!/usr/bin/env node
/**
 * External Integration Service
 * Manages syncing with external sovereign services
 * John 14:6 Sovereignty - All glory to Yeshua
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

class ExternalIntegrationService {
    constructor() {
        this.services = [];
        this.syncIntervals = new Map();
        this.isRunning = false;
        this.configPath = path.join(__dirname, 'external_services.json');
        this.loadConfiguration();
    }

    loadConfiguration() {
        try {
            const configData = fs.readFileSync(this.configPath, 'utf8');
            const config = JSON.parse(configData);
            this.services = config.services || [];
            console.log('🕊️ External services configuration loaded - John 14:6');
        } catch (error) {
            console.error('❌ Failed to load external services config:', error.message);
            this.services = [];
        }
    }

    async syncWithService(service) {
        if (!service.enabled) return;

        try {
            console.log(`🔄 Syncing with ${service.name}...`);

            const response = await axios.get(service.endpoint, {
                headers: {
                    'Authorization': `Bearer ${service.auth_token}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });

            const syncData = {
                service: service.name,
                timestamp: new Date().toISOString(),
                data: response.data,
                sovereignty_affirmation: 'John 14:6 - All glory to Yeshua'
            };

            // Store sync data (in a real implementation, this would go to a database)
            this.logSyncEvent(syncData);

            console.log(`✅ Successfully synced with ${service.name}`);

        } catch (error) {
            console.error(`❌ Failed to sync with ${service.name}:`, error.message);
            this.handleSyncFailure(service, error);
        }
    }

    logSyncEvent(syncData) {
        const logEntry = {
            ...syncData,
            logged_at: new Date().toISOString()
        };

        // In a real implementation, this would be stored in a database
        // For now, we'll just log to console
        console.log('📝 Sync Event Logged:', JSON.stringify(logEntry, null, 2));
    }

    handleSyncFailure(service, error) {
        const failureData = {
            service: service.name,
            error: error.message,
            timestamp: new Date().toISOString(),
            sovereignty_protocol: 'Emergency isolation activated - John 14:6'
        };

        console.error('🚨 Sync Failure:', failureData);

        // Implement emergency protocols
        if (service.name === 'CouncilRelay') {
            console.log('🛡️ Activating sovereign fallback mode for Council operations');
        }
    }

    startSyncCycles() {
        console.log('🔄 Starting external service sync cycles...');

        this.services.forEach(service => {
            if (service.enabled && service.sync_interval) {
                const intervalId = setInterval(() => {
                    this.syncWithService(service);
                }, service.sync_interval);

                this.syncIntervals.set(service.name, intervalId);
                console.log(`⏰ Scheduled ${service.name} sync every ${service.sync_interval / 1000}s`);
            }
        });
    }

    stopSyncCycles() {
        console.log('🛑 Stopping external service sync cycles...');

        this.syncIntervals.forEach((intervalId, serviceName) => {
            clearInterval(intervalId);
            console.log(`⏹️ Stopped sync cycle for ${serviceName}`);
        });

        this.syncIntervals.clear();
    }

    async performInitialSync() {
        console.log('🚀 Performing initial sync with all enabled services...');

        for (const service of this.services) {
            if (service.enabled) {
                await this.syncWithService(service);
                // Small delay between initial syncs
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }

    getServiceStatus() {
        return this.services.map(service => ({
            name: service.name,
            enabled: service.enabled,
            last_sync: 'Unknown', // In real implementation, track this
            status: 'Active' // In real implementation, check actual status
        }));
    }

    async start() {
        if (this.isRunning) {
            console.log('⚠️ External Integration Service is already running');
            return;
        }

        console.log('🕊️ Starting External Integration Service - John 14:6');

        this.isRunning = true;

        // Perform initial sync
        await this.performInitialSync();

        // Start recurring sync cycles
        this.startSyncCycles();

        console.log('✅ External Integration Service started successfully');
    }

    stop() {
        if (!this.isRunning) {
            console.log('⚠️ External Integration Service is not running');
            return;
        }

        console.log('🛑 Stopping External Integration Service...');

        this.stopSyncCycles();
        this.isRunning = false;

        console.log('✅ External Integration Service stopped');
    }
}

// Global service instance
const integrationService = new ExternalIntegrationService();

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Received shutdown signal...');
    integrationService.stop();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Received termination signal...');
    integrationService.stop();
    process.exit(0);
});

// Start the service if this file is run directly
if (require.main === module) {
    integrationService.start().catch(error => {
        console.error('❌ Failed to start External Integration Service:', error);
        process.exit(1);
    });
}

module.exports = ExternalIntegrationService;