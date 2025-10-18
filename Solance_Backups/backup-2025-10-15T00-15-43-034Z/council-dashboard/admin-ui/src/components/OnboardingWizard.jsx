import React, { useEffect, useState } from 'react';
import axios from '../utils/auth';
import { useAuth } from '../context/AuthProvider';

// Minimal multi-step onboarding wizard
export default function OnboardingWizard() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [env, setEnv] = useState({ discordWebhook: '', teamsWebhook: '' });
  const [nodes, setNodes] = useState([
    { name: 'Alpha', engagement: 70 },
    { name: 'Beta', engagement: 65 },
  ]);
  const [status, setStatus] = useState({ prom: false, backend: false });
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Simple connectivity check
    axios.get('/api/harmonyscore').then(() => setStatus(s => ({ ...s, backend: true }))).catch(() => {});
    axios.get('/metrics').then(() => setStatus(s => ({ ...s, prom: true }))).catch(() => {});
  }, []);

  async function saveEnv() {
    await axios.post('/api/admin/webhooks', env);
    setMessage('Webhooks saved.');
    audit('onboarding_env_saved', env);
    next();
  }

  async function linkNodes() {
    await axios.post('/api/admin/update-nodes', { nodes });
    setMessage('Nodes linked and Redis synchronized.');
    audit('onboarding_nodes_linked', { count: nodes.length });
    next();
  }

  async function testAlerts() {
    await axios.post('/api/admin/alert/test', { category: 'ritual', message: 'Onboarding ritual preview' });
    setMessage('Alert test dispatched to Discord/Teams/Slack/Email.');
    audit('onboarding_alert_test', {});
    next();
  }

  function audit(action, detail) {
    // Lightweight client-side marker; server already logs via endpoints
    console.log('AUDIT', action, detail);
  }

  function next() { setStep(s => Math.min(s + 1, 5)); }
  function prev() { setStep(s => Math.max(s - 1, 1)); }

  return (
    <div style={{ maxWidth: 720, margin: '40px auto', padding: 20 }}>
      <h2>Admin Onboarding Wizard</h2>
      <p>Welcome, {user?.username}. Follow the steps to complete Council onboarding.</p>

      {step === 1 && (
        <section>
          <h3>Step 1: Environment Setup</h3>
          <label>Discord Webhook URL
            <input value={env.discordWebhook} onChange={e => setEnv({ ...env, discordWebhook: e.target.value })} style={{ width: '100%' }} />
          </label>
          <label>Teams Webhook URL
            <input value={env.teamsWebhook} onChange={e => setEnv({ ...env, teamsWebhook: e.target.value })} style={{ width: '100%' }} />
          </label>
          <button onClick={saveEnv}>Save & Continue</button>
        </section>
      )}

      {step === 2 && (
        <section>
          <h3>Step 2: Link Nodes & Sync Redis</h3>
          <pre>{JSON.stringify(nodes, null, 2)}</pre>
          <button onClick={linkNodes}>Link & Continue</button>
        </section>
      )}

      {step === 3 && (
        <section>
          <h3>Step 3: Validate Health</h3>
          <ul>
            <li>Backend connectivity: {status.backend ? 'OK' : 'Fail'}</li>
            <li>Prometheus /metrics: {status.prom ? 'OK' : 'Fail'}</li>
          </ul>
          <button onClick={next}>Continue</button>
        </section>
      )}

      {step === 4 && (
        <section>
          <h3>Step 4: Ritual Alert Preview</h3>
          <button onClick={testAlerts}>Send Preview</button>
        </section>
      )}

      {step === 5 && (
        <section>
          <h3>Complete</h3>
          <p>Onboarding complete. All actions have been audit-logged.</p>
        </section>
      )}

      <div style={{ marginTop: 16 }}>
        <button onClick={prev} disabled={step === 1}>Back</button>
        <span style={{ margin: '0 12px' }}>Step {step} / 5</span>
        <button onClick={next} disabled={step === 5}>Next</button>
      </div>

      {message && <div style={{ marginTop: 16 }}>{message}</div>}
    </div>
  );
}
