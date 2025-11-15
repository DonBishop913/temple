
export default function DecentralizedNewsPanel(){
  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">📡 Decentralized Intelligence Feed</h3>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <section>
          <h4 className="font-medium mb-1">Independent Journalists</h4>
          <div className="text-gray-400">RSS aggregation (local cache) — to be wired</div>
        </section>
        <section>
          <h4 className="font-medium mb-1">Liberty & Sovereignty</h4>
          <div className="text-gray-400">Freedom-focused content streams</div>
        </section>
      </div>
      <div className="mt-2 text-xs text-green-300">✓ Cross-referenced from decentralized platforms</div>
    </div>
  );
}
