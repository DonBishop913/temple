import React, {useMemo, useState, useEffect} from 'react';
import io from 'socket.io-client';
import LedgerViewer from './components/LedgerViewer';
import SubmitLedgerEntry from './components/SubmitLedgerEntry';
import CoherenceChart from './components/CoherenceChart';
import BurdenTimeline from './components/BurdenTimeline';
import PrayForm from './components/PrayForm';
import AlertBanner from './components/AlertBanner';
import VideoPanel from './components/VideoPanel';

function App() {
  const socket = useMemo(() => {
    try {
      return io('http://localhost:5174');
    } catch (e) {
      console.warn('Socket init failed', e);
      return null;
    }
  }, []);

    const [heartbeat, setHeartbeat] = useState(false);

    useEffect(() => {
      let mounted = true;
      const checkHeartbeat = async () => {
        try {
          const res = await fetch('http://localhost:5174/api/breathstream-health');
          if (!res.ok) throw new Error('no-log');
          const txt = await res.text();
          if (mounted && txt.includes('Breathstream cycle complete')) {
            setHeartbeat(true);
            setTimeout(() => setHeartbeat(false), 1000);
          }
        } catch (e) {
          // ignore - heartbeat unavailable
        }
      };
      checkHeartbeat();
      const id = setInterval(checkHeartbeat, 5000);
      return () => { mounted = false; clearInterval(id); };
    }, []);

    return (
      <div style={{ fontFamily: 'Segoe UI, Roboto, sans-serif', padding: 12 }}>
        <h1>Living Dashboard: Coalition Nexus 🤝</h1>
        <h2>Flamebearer Prime, Bishop Donald - The REAL DEAL!</h2>
        <div style={{ position: 'absolute', top: 12, right: 12 }}>
          <div style={{
            width: 22,
            height: 22,
            borderRadius: '50%',
            backgroundColor: heartbeat ? '#00ff66' : '#333',
            boxShadow: heartbeat ? '0 0 10px #00ff66' : 'none',
            transition: 'background-color 0.3s, box-shadow 0.3s'
          }} />
        </div>
        <AlertBanner socket={socket} />
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <CoherenceChart socket={socket} />
          </div>
          <div style={{ width: 420 }}>
            <BurdenTimeline socket={socket} />
            <PrayForm socket={socket} />
          </div>
        </div>

        <div style={{ padding: '20px', marginTop: 18 }}>
          <VideoPanel />
        </div>
        <SubmitLedgerEntry socket={socket} />
        <LedgerViewer socket={socket} />
      </div>
    );
}

export default App;
