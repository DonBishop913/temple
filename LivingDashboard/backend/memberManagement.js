// Member Management Test Script
// Tests the Church member management and engagement systems

const path = require('path');
const MemberManagementSystem = require(path.join(__dirname, '..', '..', 'services', 'memberManagementSystem'));

async function testMemberManagement() {
  console.log('👥 Testing Member Management System...');

  try {
    const memberService = require(path.join(__dirname, '..', '..', 'services', 'memberManagementSystem'));

    // Test member operations
    console.log('📝 Testing member CRUD operations...');

    // Add a test member
    const testMember = await memberService.addMember({
      name: 'Test Council Member',
      email: 'test@usicchurch.org',
      role: 'member',
      ministry: 'worship'
    });
    console.log('✅ Added test member:', testMember.name);

    // Get all members
    const allMembers = memberService.getAllMembers();
    console.log('✅ Total members in system:', allMembers.length);

    // Test attendance tracking
    console.log('📊 Testing attendance tracking...');
    const attendance = memberService.recordAttendance(testMember.id, 'service');
    console.log('✅ Attendance recorded for:', testMember.name);

    // Test giving tracking
    console.log('💰 Testing giving tracking...');
    const giving = memberService.recordGiving(testMember.id, 100, 'tithe');
    console.log('✅ Giving recorded for:', testMember.name);

    // Generate engagement report
    console.log('📈 Testing engagement reporting...');
    const report = memberService.generateEngagementReport();
    console.log('✅ Engagement report generated:', {
      totalMembers: report.totalMembers,
      activeMembers: report.activeMembers,
      totalGiving: report.totalGiving
    });

    console.log('🎉 Member Management System: OPERATIONAL');

  } catch (error) {
    console.error('❌ Member Management Test Failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testMemberManagement().then(() => {
  console.log('👥 Member management test completed successfully');
}).catch(error => {
  console.error('❌ Member management test failed:', error);
  process.exit(1);
});