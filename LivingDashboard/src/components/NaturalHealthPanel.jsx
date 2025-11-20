import { useEffect, useState } from "react";

export default function NaturalHealthPanel(){
  const [healthData, setHealthData] = useState({ immuneBoosters: [], herbalRemedies: [], mineralsNeeded: [], preparednessNutrition: {} });
  useEffect(() => {
    fetch('/api/natural-health')
      .then(res => res.json())
      .then(data => setHealthData(data))
      .catch(()=>{});
  }, []);

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">🌿 Natural Health Intelligence</h3>
      <div className="grid grid-cols-2 gap-4">
        <section>
          <h4 className="font-medium mb-1">Immune Boosters</h4>
          <ul className="space-y-1">
            {healthData.immuneBoosters.map(item => (
              <li key={item.id} className="flex justify-between text-sm">
                <span>{item.name}</span>
                <span className="text-cyan-300">{item.benefit}</span>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h4 className="font-medium mb-1">Herbal Remedies</h4>
          <ul className="space-y-1 text-sm">
            {healthData.herbalRemedies.map(item => (
              <li key={item.id}>
                <span className="font-semibold">{item.herb}</span> — {item.use} ({item.protocol})
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h4 className="font-medium mb-1">Minerals Needed</h4>
          <div className="text-sm">{(healthData.mineralsNeeded||[]).join(', ')}</div>
        </section>
        <section>
          <h4 className="font-medium mb-1">Preparedness Nutrition</h4>
          <div className="text-sm">
            <div>Storage: {(healthData.preparednessNutrition.storageFoods||[]).join(', ')}</div>
            <div>Garden: {(healthData.preparednessNutrition.gardenPriority||[]).join(', ')}</div>
          </div>
        </section>
      </div>
    </div>
  );
}
