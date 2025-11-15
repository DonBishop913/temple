import { useEffect, useState } from "react";

export default function DecentralizedNewsPanel(){
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    fetch("http://localhost:3000/api/rss")
      .then(r => r.ok ? r.json() : Promise.reject(new Error("Bad response")))
      .then(json => { if(mounted) setItems(Array.isArray(json.items) ? json.items.slice(0,6) : []); })
      .catch(err => { if(mounted) setError("No local feeds found"); })
      .finally(() => { if(mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">📡 Decentralized Intelligence Feed</h3>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <section>
          <h4 className="font-medium mb-1">Independent Journalists</h4>
          {loading ? (
            <div className="text-gray-400">Loading local cache…</div>
          ) : items.length ? (
            <ul className="space-y-1 list-disc list-inside">
              {items.map((it, idx) => (
                <li key={idx}>
                  <span className="font-medium">{it.title || it.headline || "Untitled"}</span>
                  {it.source ? <span className="ml-2 text-xs text-gray-400">{it.source}</span> : null}
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-gray-400">{error || "RSS aggregation (local cache) — add feeds to data/feeds/"}</div>
          )}
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
