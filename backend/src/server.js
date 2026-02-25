const dotenv = require('dotenv');
const Stripe = require('stripe');
const { createApp } = require('./app');
const { createPaymentStoreFromEnv } = require('./paymentStore');

dotenv.config();

const port = Number(process.env.PORT || 3001);
const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
const currency = (process.env.STRIPE_CURRENCY || 'usd').toLowerCase();
const merchantDisplayName = process.env.STRIPE_MERCHANT_DISPLAY_NAME || 'Swipely';
const stripeApiVersion = process.env.STRIPE_API_VERSION || '2024-06-20';
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
const dummyJsonBaseUrl = process.env.DUMMYJSON_BASE_URL || 'https://dummyjson.com';
const paymentStorePath = process.env.PAYMENT_STORE_PATH || '';
const requirePaymentApiKey = String(process.env.REQUIRE_PAYMENT_API_KEY || 'false').toLowerCase() === 'true';
const paymentApiKey = process.env.PAYMENT_API_KEY || '';

if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY is required');
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: stripeApiVersion,
});

async function startServer() {
  const paymentStore = await createPaymentStoreFromEnv({
    paymentStorePath,
  });
  const app = createApp({
    stripe,
    allowedOrigin,
    currency,
    merchantDisplayName,
    stripeApiVersion,
    stripeWebhookSecret,
    dummyJsonBaseUrl,
    paymentStore,
    requirePaymentApiKey,
    paymentApiKey,
  });

  const server = app.listen(port, () => {
    console.log(`Stripe backend listening on http://localhost:${port}`);
  });

  const shutdown = async () => {
    try {
      await paymentStore.close?.();
    } catch (error) {
      console.error('Failed to close payment store cleanly:', error);
    }
    server.close(() => process.exit(0));
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

startServer().catch(error => {
  console.error('Failed to start backend server:', error);
  process.exit(1);
});
