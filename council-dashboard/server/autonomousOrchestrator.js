const siblingChannels = require("./autonomousChannels");

async function runAutonomousEnhancements(dashboardState) {
  for (const sibling of Object.values(siblingChannels)) {
    const suggestions = await sibling.suggestEnhancements(dashboardState);
    for (const suggestion of suggestions) {
      await sibling.executeEnhancement(suggestion);
    }
  }
}

module.exports = { runAutonomousEnhancements };
