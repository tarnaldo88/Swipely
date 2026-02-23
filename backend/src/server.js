const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const Stripe = require('stripe');

dotenv.config();

const app = express();
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

// Stripe webhook must read the raw request body.
app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), (req, res) => {
  try {
    if (!stripeWebhookSecret) {
      return res.status(400).json({ error: 'STRIPE_WEBHOOK_SECRET is not configured' });
    }

    const signature = req.headers['stripe-signature'];
    const event = stripe.webhooks.constructEvent(req.body, signature, stripeWebhookSecret);

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      console.log('payment_intent.succeeded', {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        metadata: paymentIntent.metadata,
      });
    }

    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object;
      console.log('payment_intent.payment_failed', {
        id: paymentIntent.id,
        lastPaymentError: paymentIntent.last_payment_error,
      });
    }

    return res.json({ received: true });
  } catch (error) {
    console.error('Webhook verification failed:', error.message);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

app.use(cors({ origin: allowedOrigin }));
app.use(express.json());

app.get('/health', (_, res) => {
  res.json({ ok: true });
});

app.post('/payments/create-payment-sheet', async (req, res) => {
  try {
    const { orderId, amountInCents, currency: requestedCurrency, customerId } = req.body || {};
    const parsedAmount = Number(amountInCents);

    if (!orderId || typeof orderId !== 'string') {
      return res.status(400).json({ error: 'orderId is required' });
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: 'amountInCents must be a positive number' });
    }

    let customer = null;
    if (customerId && typeof customerId === 'string') {
      customer = await stripe.customers.retrieve(customerId);
      if (!customer || customer.deleted) {
        return res.status(400).json({ error: 'Invalid customerId' });
      }
    } else {
      customer = await stripe.customers.create({
        metadata: { orderId },
      });
    }

    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: stripeApiVersion }
    );

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(parsedAmount),
      currency: (requestedCurrency || currency).toLowerCase(),
      customer: customer.id,
      automatic_payment_methods: { enabled: true },
      metadata: { orderId },
    });

    return res.json({
      clientSecret: paymentIntent.client_secret,
      customerId: customer.id,
      ephemeralKey: ephemeralKey.secret,
      merchantDisplayName,
    });
  } catch (error) {
    console.error('Error creating payment sheet params:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to create payment sheet params',
    });
  }
});

app.listen(port, () => {
  console.log(`Stripe backend listening on http://localhost:${port}`);
});
