import { useEffect, useState } from "react";

export default function FaithseedMap() {
  const [nodes, setNodes] = useState([]);

  useEffect(() => {
    const evtSource = new EventSource("/api/faithseed/map");
    evtSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setNodes(data.nodes);
    };
    return () => evtSource.close();
  }, []);

  return (
    <div className="faithseed-map">
      {nodes.map((node) => (
        <div
          key={node.id}
          className="node-glow"
          style={{
            left: `${node.x}%`,
            top: `${node.y}%`,
            backgroundColor: `rgba(255,215,0,${node.intensity})`,
          }}
        />
      ))}
    </div>
  );
}
