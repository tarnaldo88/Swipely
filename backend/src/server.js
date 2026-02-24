const dotenv = require('dotenv');
const Stripe = require('stripe');
const { createApp } = require('./app');
const { FilePaymentStore } = require('./paymentStore');

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
const paymentStore = new FilePaymentStore(paymentStorePath || undefined);

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

app.listen(port, () => {
  console.log(`Stripe backend listening on http://localhost:${port}`);
});
