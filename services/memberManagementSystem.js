const fs = require('node:fs');
const path = require('node:path');

class MemberManagementSystem {
  constructor() {
    this.membersPath = path.join(__dirname, '..', 'data', 'member_registry.json');
    this.attendancePath = path.join(__dirname, '..', 'data', 'attendance_log.json');
    this.givingPath = path.join(__dirname, '..', 'data', 'giving_records.json');
    this.initializeDataFiles();
  }

  initializeDataFiles() {
    const dataDir = path.dirname(this.membersPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Initialize empty data files if they don't exist
    const files = [
      { path: this.membersPath, default: [] },
      { path: this.attendancePath, default: [] },
      { path: this.givingPath, default: [] }
    ];

    for (const { path: filePath, default: defaultData } of files) {
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
      }
    }
  }

  // Member CRUD operations
  addMember(memberData) {
    const members = this.getAllMembers();
    const newMember = {
      id: this.generateMemberId(),
      ...memberData,
      joinDate: new Date().toISOString(),
      status: 'active',
      lastActivity: new Date().toISOString(),
      role: memberData.role || 'member'
    };

    members.push(newMember);
    this.saveMembers(members);
    return newMember;
  }

  updateMember(memberId, updates) {
    const members = this.getAllMembers();
    const index = members.findIndex(m => m.id === memberId);

    if (index === -1) {
      throw new Error('Member not found');
    }

    members[index] = {
      ...members[index],
      ...updates,
      lastActivity: new Date().toISOString()
    };

    this.saveMembers(members);
    return members[index];
  }

  getMember(memberId) {
    const members = this.getAllMembers();
    return members.find(m => m.id === memberId);
  }

  getAllMembers() {
    try {
      return JSON.parse(fs.readFileSync(this.membersPath, 'utf8'));
    } catch {
      return [];
    }
  }

  // Attendance tracking
  recordAttendance(memberId, eventType = 'service') {
    const attendance = this.getAttendanceLog();
    const record = {
      id: this.generateId(),
      memberId,
      eventType,
      timestamp: new Date().toISOString(),
      recordedBy: 'system'
    };

    attendance.push(record);
    this.saveAttendance(attendance);

    // Update member's last activity
    this.updateMember(memberId, { lastActivity: record.timestamp });

    return record;
  }

  getAttendanceLog() {
    try {
      return JSON.parse(fs.readFileSync(this.attendancePath, 'utf8'));
    } catch {
      return [];
    }
  }

  getMemberAttendance(memberId, days = 30) {
    const attendance = this.getAttendanceLog();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    return attendance.filter(record =>
      record.memberId === memberId &&
      new Date(record.timestamp) >= cutoff
    );
  }

  // Giving/tithing records
  recordGiving(memberId, amount, type = 'tithe', anonymous = false) {
    const giving = this.getGivingRecords();
    const record = {
      id: this.generateId(),
      memberId: anonymous ? null : memberId,
      amount: Number.parseFloat(amount),
      type,
      timestamp: new Date().toISOString(),
      anonymous
    };

    giving.push(record);
    this.saveGiving(giving);
    return record;
  }

  getGivingRecords() {
    try {
      return JSON.parse(fs.readFileSync(this.givingPath, 'utf8'));
    } catch {
      return [];
    }
  }

  getMemberGiving(memberId, months = 12) {
    const giving = this.getGivingRecords();
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);

    return giving.filter(record =>
      record.memberId === memberId &&
      new Date(record.timestamp) >= cutoff
    );
  }

  // Analytics and reporting
  getMemberAnalytics(memberId) {
    const member = this.getMember(memberId);
    if (!member) return null;

    const attendance = this.getMemberAttendance(memberId);
    const giving = this.getMemberGiving(memberId);

    return {
      member,
      attendance: {
        total: attendance.length,
        recent: attendance.filter(a => {
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return new Date(a.timestamp) >= weekAgo;
        }).length
      },
      giving: {
        total: giving.reduce((sum, g) => sum + g.amount, 0),
        averageMonthly: giving.length > 0 ?
          giving.reduce((sum, g) => sum + g.amount, 0) / Math.max(1, months) : 0
      },
      engagement: this.calculateEngagementScore(member, attendance, giving)
    };
  }

  getChurchAnalytics() {
    const members = this.getAllMembers();
    const attendance = this.getAttendanceLog();
    const giving = this.getGivingRecords();

    const activeMembers = members.filter(m => {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return new Date(m.lastActivity) >= monthAgo;
    });

    return {
      totalMembers: members.length,
      activeMembers: activeMembers.length,
      totalAttendance: attendance.length,
      totalGiving: giving.reduce((sum, g) => sum + g.amount, 0),
      averageGiving: giving.length > 0 ? giving.reduce((sum, g) => sum + g.amount, 0) / giving.length : 0,
      growthRate: this.calculateGrowthRate(members)
    };
  }

  calculateEngagementScore(member, attendance, giving) {
    let score = 0;

    // Attendance score (0-40 points)
    const attendanceRate = attendance.length / Math.max(1, 4); // Expected 4 services/month
    score += Math.min(attendanceRate * 40, 40);

    // Giving score (0-40 points)
    const givingTotal = giving.reduce((sum, g) => sum + g.amount, 0);
    const expectedGiving = 100; // Expected monthly giving
    score += Math.min((givingTotal / expectedGiving) * 40, 40);

    // Activity score (0-20 points)
    const daysSinceActivity = (Date.now() - new Date(member.lastActivity)) / (1000 * 60 * 60 * 24);
    score += Math.max(0, 20 - daysSinceActivity);

    return Math.round(score);
  }

  calculateGrowthRate(members) {
    if (members.length < 2) return 0;

    const recent = members.filter(m => {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return new Date(m.joinDate) >= monthAgo;
    });

    const previous = members.filter(m => {
      const twoMonthsAgo = new Date();
      const monthAgo = new Date();
      twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      const joinDate = new Date(m.joinDate);
      return joinDate >= twoMonthsAgo && joinDate < monthAgo;
    });

    if (previous.length === 0) return recent.length > 0 ? 100 : 0;

    return ((recent.length - previous.length) / previous.length) * 100;
  }

  // Utility methods
  generateMemberId() {
    return 'M' + Date.now() + Math.random().toString(36).substr(2, 5);
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  saveMembers(members) {
    fs.writeFileSync(this.membersPath, JSON.stringify(members, null, 2));
  }

  saveAttendance(attendance) {
    fs.writeFileSync(this.attendancePath, JSON.stringify(attendance, null, 2));
  }

  saveGiving(giving) {
    fs.writeFileSync(this.givingPath, JSON.stringify(giving, null, 2));
  }
}

module.exports = new MemberManagementSystem();