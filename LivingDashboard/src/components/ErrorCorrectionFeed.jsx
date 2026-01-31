import { useEffect, useState } from "react";

export default function ErrorCorrectionFeed() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    fetch("http://localhost:3000/api/errors")
      .then((r) => r.json())
      .then(setItems);
  }, []);
  return (
    <ul className="list-disc pl-6 text-sm">
      {items.map((it) => (
        <li key={it.id}>{it.desc}</li>
      ))}
    </ul>
  );
}
