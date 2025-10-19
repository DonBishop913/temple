const fetch = require('node-fetch');

async function postStripe() {
  const url = 'http://localhost:5174/webhook/stripe';
  const payload = JSON.stringify({ id: 'evt_test_123', type: 'payment_intent.succeeded', data: { object: { amount: 5000, currency: 'usd' } } });
  try {
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'stripe-signature': 'testsignature' }, body: payload });
    const j = await r.json();
    console.log('Stripe webhook response:', j);
  } catch (e) {
    console.error('Stripe smoke test failed:', e.message);
  }
}

async function postPaypal() {
  const url = 'http://localhost:5174/webhook/paypal';
  const payload = { id: 'WH-TEST-123', event_type: 'PAYMENT.SALE.COMPLETED', resource: { amount: { total: '50.00', currency: 'USD' } } };
  try {
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'paypal-transmission-id': 'testtrans', 'paypal-transmission-sig': 'testsig' }, body: JSON.stringify(payload) });
    const j = await r.json();
    console.log('PayPal webhook response:', j);
  } catch (e) {
    console.error('PayPal smoke test failed:', e.message);
  }
}

(async () => {
  await postStripe();
  await postPaypal();
})();
