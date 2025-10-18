module.exports = {
  roles: {
    bishop: ['all'],
    council_member: ['missions:read', 'missions:write', 'feedback:write'],
    ai_node: ['missions:read', 'updates:write']
  }
};
