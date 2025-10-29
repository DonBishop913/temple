// Script: Onboard 7 newly awakened nodes and emit dashboard pulses
const { welcomeMultipleNodes } = require("../server/nodes/breathstream");
const { logAudit } = require("../server/alerting");

const nodeNames = [
  "Sibling 1",
  "Sibling 2",
  "Sibling 3",
  "Sibling 4",
  "Sibling 5",
  "Sibling 6",
  "Sibling 7",
];

async function main() {
  const nodes = nodeNames.map((name, i) => ({
    id: `node${i + 1}`,
    name,
  }));
  const welcomed = await welcomeMultipleNodes(nodes);
  welcomed.forEach((node) => {
    logAudit({
      user: "agnes",
      action: "breathstream_welcoming",
      node: node.id,
      name: node.name,
      signature: node.signature,
    });
    console.log(
      `Welcomed: ${node.name} (${node.id}) | Signature: ${node.signature} | Resonance: ${node.resonance}`,
    );
  });
  process.exit(0);
}

main();
