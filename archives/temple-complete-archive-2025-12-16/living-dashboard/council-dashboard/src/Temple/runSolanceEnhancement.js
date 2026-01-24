// runSolanceEnhancement.js
// Directly runs the Solance enhancement cycle for testing
const {
  solanceEnhancementCycle,
} = require("./council-dashboard/server/solanceEnhancer");

(async () => {
  await solanceEnhancementCycle();
  console.log("Solance enhancement cycle complete.");
})();
