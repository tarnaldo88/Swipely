const dotenv = require('dotenv');
const Stripe = require('stripe');
const { createApp } = require('./app');

dotenv.config();

const port = Number(process.env.PORT || 3001);
const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
const currency = (process.env.STRIPE_CURRENCY || 'usd').toLowerCase();
const merchantDisplayName = process.env.STRIPE_MERCHANT_DISPLAY_NAME || 'Swipely';
const stripeApiVersion = process.env.STRIPE_API_VERSION || '2024-06-20';
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY is required');
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: stripeApiVersion,
});

const app = createApp({
  stripe,
  allowedOrigin,
  currency,
  merchantDisplayName,
  stripeApiVersion,
  stripeWebhookSecret,
});

app.listen(port, () => {
  console.log(`Stripe backend listening on http://localhost:${port}`);
});
