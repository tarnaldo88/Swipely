const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { createApp } = require('../src/app');

const originalConsoleLog = console.log;
const originalConsoleError = console.error;

function createStripeMock(overrides = {}) {
  return {
    customers: {
      create: async () => ({ id: 'cus_new' }),
      retrieve: async id => ({ id }),
      ...(overrides.customers || {}),
    },
    ephemeralKeys: {
      create: async () => ({ secret: 'ek_test_secret' }),
      ...(overrides.ephemeralKeys || {}),
    },
    paymentIntents: {
      create: async () => ({ client_secret: 'pi_test_secret' }),
      ...(overrides.paymentIntents || {}),
    },
    webhooks: {
      constructEvent: () => ({
        type: 'payment_intent.succeeded',
        data: { object: { id: 'pi_123', amount: 1000, currency: 'usd', metadata: {} } },
      }),
      ...(overrides.webhooks || {}),
    },
  };
}

test.beforeEach(() => {
  console.log = () => {};
  console.error = () => {};
});

test.afterEach(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});

test('GET /health returns ok', async () => {
  const app = createApp({ stripe: createStripeMock() });
  const response = await request(app).get('/health');

  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { ok: true });
});

test('POST /payments/create-payment-sheet validates required orderId', async () => {
  const app = createApp({ stripe: createStripeMock() });
  const response = await request(app).post('/payments/create-payment-sheet').send({
    amountInCents: 1500,
  });

  assert.equal(response.status, 400);
  assert.equal(response.body.error, 'orderId is required');
});

test('POST /payments/create-payment-sheet validates amountInCents', async () => {
  const app = createApp({ stripe: createStripeMock() });
  const response = await request(app).post('/payments/create-payment-sheet').send({
    orderId: 'ORD-1',
    amountInCents: 0,
  });

  assert.equal(response.status, 400);
  assert.equal(response.body.error, 'amountInCents must be a positive number');
});

test('POST /payments/create-payment-sheet creates customer and payment intent', async () => {
  let capturedPaymentIntentInput = null;
  const stripe = createStripeMock({
    paymentIntents: {
      create: async input => {
        capturedPaymentIntentInput = input;
        return { client_secret: 'pi_from_test' };
      },
    },
  });

  const app = createApp({
    stripe,
    merchantDisplayName: 'Swipely Test',
    currency: 'usd',
  });

  const response = await request(app).post('/payments/create-payment-sheet').send({
    orderId: 'ORD-2',
    amountInCents: 2599,
  });

  assert.equal(response.status, 200);
  assert.deepEqual(response.body, {
    clientSecret: 'pi_from_test',
    customerId: 'cus_new',
    ephemeralKey: 'ek_test_secret',
    merchantDisplayName: 'Swipely Test',
  });
  assert.equal(capturedPaymentIntentInput.amount, 2599);
  assert.equal(capturedPaymentIntentInput.currency, 'usd');
  assert.equal(capturedPaymentIntentInput.customer, 'cus_new');
  assert.deepEqual(capturedPaymentIntentInput.metadata, { orderId: 'ORD-2' });
});

test('POST /payments/create-payment-sheet uses existing customerId when provided', async () => {
  let retrievedCustomerId = null;
  const stripe = createStripeMock({
    customers: {
      retrieve: async id => {
        retrievedCustomerId = id;
        return { id };
      },
    },
  });

  const app = createApp({ stripe });
  const response = await request(app).post('/payments/create-payment-sheet').send({
    orderId: 'ORD-3',
    amountInCents: 1999,
    customerId: 'cus_existing',
  });

  assert.equal(response.status, 200);
  assert.equal(retrievedCustomerId, 'cus_existing');
  assert.equal(response.body.customerId, 'cus_existing');
});

test('POST /payments/create-payment-sheet rejects invalid customerId', async () => {
  const stripe = createStripeMock({
    customers: {
      retrieve: async () => ({ deleted: true }),
    },
  });

  const app = createApp({ stripe });
  const response = await request(app).post('/payments/create-payment-sheet').send({
    orderId: 'ORD-4',
    amountInCents: 1999,
    customerId: 'cus_deleted',
  });

  assert.equal(response.status, 400);
  assert.equal(response.body.error, 'Invalid customerId');
});

test('POST /payments/create-payment-sheet returns 500 when stripe throws', async () => {
  const stripe = createStripeMock({
    paymentIntents: {
      create: async () => {
        throw new Error('Stripe unavailable');
      },
    },
  });

  const app = createApp({ stripe });
  const response = await request(app).post('/payments/create-payment-sheet').send({
    orderId: 'ORD-5',
    amountInCents: 3000,
  });

  assert.equal(response.status, 500);
  assert.equal(response.body.error, 'Stripe unavailable');
});

test('POST /webhooks/stripe returns 400 when webhook secret missing', async () => {
  const app = createApp({ stripe: createStripeMock(), stripeWebhookSecret: '' });
  const response = await request(app)
    .post('/webhooks/stripe')
    .set('stripe-signature', 'test_signature')
    .set('Content-Type', 'application/json')
    .send(JSON.stringify({ type: 'payment_intent.succeeded' }));

  assert.equal(response.status, 400);
  assert.equal(response.body.error, 'STRIPE_WEBHOOK_SECRET is not configured');
});

test('POST /webhooks/stripe verifies and accepts valid event', async () => {
  const app = createApp({
    stripe: createStripeMock(),
    stripeWebhookSecret: 'whsec_123',
  });

  const response = await request(app)
    .post('/webhooks/stripe')
    .set('stripe-signature', 'test_signature')
    .set('Content-Type', 'application/json')
    .send(JSON.stringify({ type: 'payment_intent.succeeded' }));

  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { received: true });
});

test('POST /webhooks/stripe returns 400 when signature verification fails', async () => {
  const app = createApp({
    stripe: createStripeMock({
      webhooks: {
        constructEvent: () => {
          throw new Error('Invalid signature');
        },
      },
    }),
    stripeWebhookSecret: 'whsec_123',
  });

  const response = await request(app)
    .post('/webhooks/stripe')
    .set('stripe-signature', 'bad_signature')
    .set('Content-Type', 'application/json')
    .send(JSON.stringify({ type: 'payment_intent.succeeded' }));

  assert.equal(response.status, 400);
  assert.match(response.text, /Webhook Error: Invalid signature/);
});
