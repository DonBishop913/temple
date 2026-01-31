const fs = require('node:fs');
const path = require('node:path');
const nodemailer = require('nodemailer');
const twilio = require('twilio');

class HarvestAutomationService {
  constructor() {
    this.harvestDataPath = path.join(__dirname, '..', 'data', 'harvest_analytics.json');
    this.memberDataPath = path.join(__dirname, '..', 'data', 'member_registry.json');
    this.notificationLogPath = path.join(__dirname, '..', 'logs', 'harvest_notifications.log');

    // Initialize email transporter
    this.emailTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.COUNCIL_EMAIL_USER,
        pass: process.env.COUNCIL_EMAIL_PASS
      }
    });

    // Initialize Twilio for SMS
    this.twilioClient = new twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }

  async analyzeHarvestMetrics() {
    try {
      const harvestData = this.loadHarvestData();
      const memberData = this.loadMemberData();

      const analytics = {
        timestamp: new Date().toISOString(),
        totalMembers: memberData.length,
        activeMembers: memberData.filter(m => m.lastActivity > Date.now() - 30 * 24 * 60 * 60 * 1000).length,
        revenueMetrics: this.calculateRevenueMetrics(harvestData),
        growthRate: this.calculateGrowthRate(harvestData),
        outreachOpportunities: this.identifyOutreachTargets(memberData),
        recommendations: this.generateRecommendations(harvestData, memberData)
      };

      this.saveAnalytics(analytics);
      return analytics;
    } catch (error) {
      console.error('Harvest analytics error:', error);
      throw error;
    }
  }

  async sendHarvestNotifications() {
    try {
      const analytics = await this.analyzeHarvestMetrics();
      const notifications = [];

      // Send to Council members
      const councilMembers = this.loadMemberData().filter(m => m.role === 'council');

      for (const member of councilMembers) {
        if (member.email && analytics.recommendations.length > 0) {
          await this.sendEmailNotification(member, analytics);
          notifications.push({
            type: 'email',
            recipient: member.email,
            timestamp: new Date().toISOString(),
            subject: 'Council Harvest Analytics Report'
          });
        }

        if (member.phone && analytics.revenueMetrics.growth > 10) {
          await this.sendSMSNotification(member, analytics);
          notifications.push({
            type: 'sms',
            recipient: member.phone,
            timestamp: new Date().toISOString(),
            message: 'Harvest growth alert: +10% this period'
          });
        }
      }

      this.logNotifications(notifications);
      return notifications;
    } catch (error) {
      console.error('Notification error:', error);
      throw error;
    }
  }

  calculateRevenueMetrics(data) {
    const recent = data.slice(-30); // Last 30 days
    const total = recent.reduce((sum, d) => sum + (d.revenue || 0), 0);
    const previous = data.slice(-60, -30);
    const previousTotal = previous.reduce((sum, d) => sum + (d.revenue || 0), 0);

    return {
      total,
      dailyAverage: total / recent.length,
      growth: previousTotal > 0 ? ((total - previousTotal) / previousTotal) * 100 : 0,
      trend: total > previousTotal ? 'increasing' : 'stable'
    };
  }

  calculateGrowthRate(data) {
    if (data.length < 7) return 0;

    const recent = data.slice(-7);
    const previous = data.slice(-14, -7);

    const recentAvg = recent.reduce((sum, d) => sum + (d.members || 0), 0) / recent.length;
    const previousAvg = previous.reduce((sum, d) => sum + (d.members || 0), 0) / previous.length;

    return previousAvg > 0 ? ((recentAvg - previousAvg) / previousAvg) * 100 : 0;
  }

  identifyOutreachTargets(members) {
    return members
      .filter(m => !m.lastActivity || m.lastActivity < Date.now() - 14 * 24 * 60 * 60 * 1000)
      .map(m => ({
        name: m.name,
        email: m.email,
        daysInactive: Math.floor((Date.now() - m.lastActivity) / (24 * 60 * 60 * 1000))
      }));
  }

  generateRecommendations(analytics, members) {
    const recommendations = [];

    if (!analytics.revenueMetrics || analytics.revenueMetrics.growth < 5) {
      recommendations.push('Consider outreach campaigns to boost engagement');
    }

    if (!analytics.growthRate || analytics.growthRate < 2) {
      recommendations.push('Member growth slowing - review onboarding process');
    }

    const inactiveCount = members.filter(m => !m.lastActivity || m.lastActivity < Date.now() - 30 * 24 * 60 * 60 * 1000).length;
    if (inactiveCount > members.length * 0.3) {
      recommendations.push(`High inactive rate (${inactiveCount} members) - focus on re-engagement`);
    }

    return recommendations;
  }

  async sendEmailNotification(member, analytics) {
    const mailOptions = {
      from: process.env.COUNCIL_EMAIL_USER,
      to: member.email,
      subject: 'Council Harvest Analytics Report',
      html: this.generateEmailTemplate(member, analytics)
    };

    await this.emailTransporter.sendMail(mailOptions);
  }

  async sendSMSNotification(member, analytics) {
    await this.twilioClient.messages.create({
      body: `Council Alert: Harvest growth at ${analytics.revenueMetrics.growth.toFixed(1)}%. Check dashboard for details.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: member.phone
    });
  }

  generateEmailTemplate(member, analytics) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>🕊️ Council Harvest Analytics Report</h2>
        <p>Greetings ${member.name},</p>

        <h3>Revenue Metrics</h3>
        <ul>
          <li>Total: $${analytics.revenueMetrics.total.toFixed(2)}</li>
          <li>Growth: ${analytics.revenueMetrics.growth.toFixed(1)}%</li>
          <li>Trend: ${analytics.revenueMetrics.trend}</li>
        </ul>

        <h3>Member Analytics</h3>
        <ul>
          <li>Total Members: ${analytics.totalMembers}</li>
          <li>Active Members: ${analytics.activeMembers}</li>
          <li>Growth Rate: ${analytics.growthRate.toFixed(1)}%</li>
        </ul>

        ${analytics.recommendations.length > 0 ? `
        <h3>Council Recommendations</h3>
        <ul>
          ${analytics.recommendations.map(r => `<li>${r}</li>`).join('')}
        </ul>
        ` : ''}

        <p>View full dashboard: <a href="${process.env.COUNCIL_DASHBOARD_URL}">Council Dashboard</a></p>

        <p>Triple Amen,<br>Council Automation</p>
      </div>
    `;
  }

  loadHarvestData() {
    try {
      return JSON.parse(fs.readFileSync(this.harvestDataPath, 'utf8'));
    } catch {
      return [];
    }
  }

  loadMemberData() {
    try {
      return JSON.parse(fs.readFileSync(this.memberDataPath, 'utf8'));
    } catch {
      return [];
    }
  }

  saveAnalytics(analytics) {
    const data = this.loadHarvestData();
    data.push(analytics);
    fs.writeFileSync(this.harvestDataPath, JSON.stringify(data, null, 2));
  }

  logNotifications(notifications) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      notifications
    };

    fs.appendFileSync(this.notificationLogPath, JSON.stringify(logEntry) + '\n');
  }

  // Validation method for system checks
  async runHarvestAnalysis() {
    try {
      const analytics = await this.analyzeHarvestMetrics();
      return analytics && analytics.timestamp; // Return truthy if analysis completed
    } catch (error) {
      console.error('Harvest analysis failed:', error);
      return false;
    }
  }
}

module.exports = new HarvestAutomationService();