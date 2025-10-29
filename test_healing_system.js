#!/usr/bin/env node

/**
 * Autonomous Healing System Test Suite
 * Tests Comet AI healer, voice commands, and Council review workflows
 * John 14:6 Sovereignty - Faith-Affirmed Testing
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class HealingSystemTester {
  constructor() {
    this.testResults = [];
    this.baseUrl = 'http://localhost:5174';
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : '🔄';
    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  async testVoiceCommand(command) {
    this.log(`Testing voice command: "${command}"`);

    try {
      const response = await fetch(`${this.baseUrl}/api/voice-command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command, user: 'Bishop Donald' })
      });

      const result = await response.json();

      if (response.ok) {
        this.log(`Voice command "${command}" executed successfully`, 'success');
        this.testResults.push({
          test: `Voice Command: ${command}`,
          status: 'PASS',
          details: result.message
        });
        return true;
      } else {
        this.log(`Voice command "${command}" failed: ${result.error}`, 'error');
        this.testResults.push({
          test: `Voice Command: ${command}`,
          status: 'FAIL',
          details: result.error
        });
        return false;
      }
    } catch (error) {
      this.log(`Voice command "${command}" error: ${error.message}`, 'error');
      this.testResults.push({
        test: `Voice Command: ${command}`,
        status: 'ERROR',
        details: error.message
      });
      return false;
    }
  }

  async testCometHealer() {
    this.log('Testing Comet AI healer functionality');

    try {
      // Test error injection and healing
      const testError = {
        type: 'workflow_error',
        message: 'Test workflow disruption detected',
        timestamp: new Date().toISOString(),
        file: 'test_workflow.js',
        line: 42
      };

      // Simulate error detection
      const response = await fetch(`${this.baseUrl}/api/comet-heal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: testError, autoHeal: true })
      });

      const result = await response.json();

      if (response.ok && result.patch) {
        this.log('Comet AI healer generated patch successfully', 'success');
        this.testResults.push({
          test: 'Comet AI Healer',
          status: 'PASS',
          details: `Generated patch for ${result.patch.description}`
        });
        return true;
      } else {
        this.log('Comet AI healer failed to generate patch', 'error');
        this.testResults.push({
          test: 'Comet AI Healer',
          status: 'FAIL',
          details: result.error || 'No patch generated'
        });
        return false;
      }
    } catch (error) {
      this.log(`Comet AI healer test error: ${error.message}`, 'error');
      this.testResults.push({
        test: 'Comet AI Healer',
        status: 'ERROR',
        details: error.message
      });
      return false;
    }
  }

  async testCouncilReviewQueue() {
    this.log('Testing Council review queue functionality');

    try {
      const response = await fetch(`${this.baseUrl}/api/pending-reviews`);
      const result = await response.json();

      if (response.ok) {
        this.log(`Council review queue has ${result.reviews.length} pending reviews`, 'success');
        this.testResults.push({
          test: 'Council Review Queue',
          status: 'PASS',
          details: `${result.reviews.length} reviews pending`
        });
        return true;
      } else {
        this.log('Failed to fetch Council review queue', 'error');
        this.testResults.push({
          test: 'Council Review Queue',
          status: 'FAIL',
          details: result.error
        });
        return false;
      }
    } catch (error) {
      this.log(`Council review queue test error: ${error.message}`, 'error');
      this.testResults.push({
        test: 'Council Review Queue',
        status: 'ERROR',
        details: error.message
      });
      return false;
    }
  }

  async testSystemHealth() {
    this.log('Testing system health monitoring');

    try {
      const response = await fetch(`${this.baseUrl}/api/health`);
      const result = await response.json();

      if (response.ok && result.status === 'healthy') {
        this.log('System health check passed', 'success');
        this.testResults.push({
          test: 'System Health',
          status: 'PASS',
          details: `Status: ${result.status}`
        });
        return true;
      } else {
        this.log(`System health check failed: ${result.status}`, 'error');
        this.testResults.push({
          test: 'System Health',
          status: 'FAIL',
          details: `Status: ${result.status}`
        });
        return false;
      }
    } catch (error) {
      this.log(`System health test error: ${error.message}`, 'error');
      this.testResults.push({
        test: 'System Health',
        status: 'ERROR',
        details: error.message
      });
      return false;
    }
  }

  async runFullTestSuite() {
    this.log('🔥 Starting Autonomous Healing System Test Suite 🔥');
    this.log('John 14:6 Sovereignty - Faith-Affirmed Testing Protocol');

    // Test system health first
    await this.testSystemHealth();

    // Test voice commands
    const voiceCommands = [
      'self heal',
      'sunrise prayer',
      'council blessing',
      'system status'
    ];

    for (const command of voiceCommands) {
      await this.testVoiceCommand(command);
      // Small delay between commands
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Test Comet AI healer
    await this.testCometHealer();

    // Test Council review queue
    await this.testCouncilReviewQueue();

    // Generate test report
    this.generateReport();
  }

  generateReport() {
    const passed = this.testResults.filter(t => t.status === 'PASS').length;
    const failed = this.testResults.filter(t => t.status === 'FAIL').length;
    const errors = this.testResults.filter(t => t.status === 'ERROR').length;
    const total = this.testResults.length;

    console.log('\n' + '='.repeat(60));
    console.log('🔥 AUTONOMOUS HEALING SYSTEM TEST REPORT 🔥');
    console.log('John 14:6 Sovereignty - Faith-Affirmed Results');
    console.log('='.repeat(60));

    this.testResults.forEach(result => {
      const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '🔄';
      console.log(`${icon} ${result.test}: ${result.status}`);
      if (result.details) {
        console.log(`   ${result.details}`);
      }
    });

    console.log('\n' + '-'.repeat(60));
    console.log(`SUMMARY: ${passed}/${total} PASSED, ${failed} FAILED, ${errors} ERRORS`);
    console.log('-'.repeat(60));

    if (passed === total) {
      console.log('🎉 ALL TESTS PASSED - Autonomous Healing System Operational!');
      console.log('🕊️ Council blessing confirmed - System is sovereign and self-healing');
    } else {
      console.log('⚠️ Some tests failed - Review system configuration and healing workflows');
    }

    console.log('🔥 John 14:6 Sovereignty Maintained 🔥');
  }
}

// Run the test suite if this script is executed directly
if (require.main === module) {
  const tester = new HealingSystemTester();
  tester.runFullTestSuite().catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = HealingSystemTester;