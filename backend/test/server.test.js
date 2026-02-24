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

function createFetchResponse(body, ok = true, status = 200) {
  return {
    ok,
    status,
    json: async () => body,
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

test('POST /feed/personalized proxies and maps DummyJSON products', async () => {
  const fetchMock = async () =>
    createFetchResponse({
      total: 100,
      products: [
        {
          id: 1,
          title: 'Test Product',
          description: 'Test Description',
          category: 'beauty',
          price: 9.99,
          rating: 4.5,
          stock: 8,
          brand: 'TestBrand',
          thumbnail: 'https://img.test/thumb.jpg',
          images: ['https://img.test/1.jpg'],
        },
      ],
    });
  const app = createApp({ stripe: createStripeMock(), fetchImpl: fetchMock });

  const response = await request(app).post('/feed/personalized').send({
    pagination: { page: 1, limit: 10 },
  });

  assert.equal(response.status, 200);
  assert.equal(response.body.products.length, 1);
  assert.equal(response.body.products[0].id, '1');
  assert.equal(response.body.products[0].category.id, 'beauty');
  assert.equal(response.body.products[0].category.name, 'Beauty');
});

test('POST /products applies category filtering to DummyJSON proxy results', async () => {
  const fetchMock = async () =>
    createFetchResponse({
      total: 2,
      products: [
        {
          id: 1,
          title: 'Beauty Product',
          description: 'Beauty',
          category: 'beauty',
          price: 10,
          stock: 5,
          thumbnail: 'https://img.test/beauty.jpg',
          images: [],
        },
        {
          id: 2,
          title: 'Furniture Product',
          description: 'Furniture',
          category: 'furniture',
          price: 20,
          stock: 5,
          thumbnail: 'https://img.test/furniture.jpg',
          images: [],
        },
      ],
    });
  const app = createApp({ stripe: createStripeMock(), fetchImpl: fetchMock });

  const response = await request(app).post('/products').send({
    pagination: { page: 1, limit: 10 },
    filters: { categories: ['beauty'] },
  });

  assert.equal(response.status, 200);
  assert.equal(response.body.products.length, 1);
  assert.equal(response.body.products[0].category.id, 'beauty');
});

test('POST /feed/refresh returns first page feed through proxy', async () => {
  const fetchMock = async url => {
    assert.match(url, /\/products\?limit=10&skip=0$/);
    return createFetchResponse({
      total: 1,
      products: [
        {
          id: 9,
          title: 'Refreshed Product',
          description: 'Desc',
          category: 'groceries',
          price: 3.5,
          stock: 3,
          thumbnail: 'https://img.test/groceries.jpg',
          images: [],
        },
      ],
    });
  };
  const app = createApp({ stripe: createStripeMock(), fetchImpl: fetchMock });

  const response = await request(app).post('/feed/refresh').send({});

  assert.equal(response.status, 200);
  assert.equal(response.body.pagination.page, 1);
  assert.equal(response.body.products[0].id, '9');
});

test('POST /swipe-actions validates required fields', async () => {
  const app = createApp({ stripe: createStripeMock() });
  const response = await request(app).post('/swipe-actions').send({
    productId: '1',
    action: 'like',
  });

  assert.equal(response.status, 400);
  assert.equal(response.body.error, 'productId, action, and userId are required');
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
