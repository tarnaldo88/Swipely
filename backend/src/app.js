const express = require('express');
const cors = require('cors');

function createInMemoryPaymentStore() {
  const processedEventIds = new Set();
  const paymentsByOrderId = new Map();

  return {
    async hasProcessedEvent(eventId) {
      return processedEventIds.has(eventId);
    },
    async markProcessedEvent(eventId) {
      if (!eventId || processedEventIds.has(eventId)) {
        return false;
      }
      processedEventIds.add(eventId);
      return true;
    },
    async getPayment(orderId) {
      return paymentsByOrderId.get(orderId) || null;
    },
    async setPayment(orderId, record) {
      if (!orderId) {
        return;
      }

      const existing = paymentsByOrderId.get(orderId) || {};
      paymentsByOrderId.set(orderId, {
        ...existing,
        ...record,
        orderId,
        updatedAt: new Date().toISOString(),
      });
    },
  };
}

function toCategoryName(category) {
  return String(category || 'general')
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function mapDummyProductToCard(product) {
  const imageUrls = [product.thumbnail, ...(product.images || [])].filter(Boolean);
  const categoryId = String(product.category || 'general');

  return {
    id: String(product.id),
    title: product.title || 'Untitled Product',
    price: Number(product.price || 0),
    currency: 'USD',
    imageUrls: imageUrls.length > 0 ? imageUrls : ['https://dummyjson.com/image/400x400'],
    category: {
      id: categoryId,
      name: toCategoryName(categoryId),
    },
    description: product.description || '',
    specifications: {
      brand: product.brand || 'Unknown',
      stock: product.stock ?? 0,
      rating: product.rating ?? 0,
    },
    availability: Number(product.stock || 0) > 0,
    reviewRating: typeof product.rating === 'number' ? product.rating : undefined,
  };
}

function filterCards(cards, filters) {
  return cards.filter(card => {
    if (filters?.categories?.length && !filters.categories.includes(card.category.id)) {
      return false;
    }

    if (filters?.priceRange) {
      if (card.price < filters.priceRange.min || card.price > filters.priceRange.max) {
        return false;
      }
    }

    if (filters?.excludeProductIds?.length && filters.excludeProductIds.includes(card.id)) {
      return false;
    }

    return true;
  });
}

function createApp({
  stripe,
  allowedOrigin = '*',
  currency = 'usd',
  merchantDisplayName = 'Swipely',
  stripeApiVersion = '2024-06-20',
  stripeWebhookSecret = '',
  dummyJsonBaseUrl = 'https://dummyjson.com',
  fetchImpl = globalThis.fetch,
  paymentStore = createInMemoryPaymentStore(),
  requirePaymentApiKey = false,
  paymentApiKey = '',
}) {
  const app = express();

  const setOrderPaymentStatus = async (
    orderId,
    status,
    paymentIntentId = null,
    fulfillment = undefined
  ) => {
    if (!orderId) {
      return;
    }

    const existing = (await paymentStore.getPayment(orderId)) || {};
    const nextRecord = {
      ...existing,
      orderId,
      status,
      paymentIntentId: paymentIntentId || existing.paymentIntentId || null,
    };
    if (fulfillment !== undefined) {
      nextRecord.fulfillment = fulfillment;
    }
    await paymentStore.setPayment(orderId, nextRecord);
  };

  const requirePaymentAuth = (req, res, next) => {
    if (!requirePaymentApiKey) {
      return next();
    }

    const incoming = req.headers['x-api-key'];
    if (!incoming || incoming !== paymentApiKey) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    return next();
  };

  const requireInternalDebugAuth = (req, res, next) => {
    if (!paymentApiKey) {
      return res.status(403).json({ error: 'Internal debug endpoint is disabled' });
    }

    const incoming = req.headers['x-api-key'];
    if (!incoming || incoming !== paymentApiKey) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    return next();
  };

  const getDummyJsonFeed = async (
    pagination = { page: 1, limit: 10 },
    filters = undefined
  ) => {
    if (typeof fetchImpl !== 'function') {
      throw new Error('Fetch is not available in this runtime');
    }

    const page = Math.max(1, Number(pagination.page || 1));
    const limit = Math.max(1, Number(pagination.limit || 10));
    const skip = (page - 1) * limit;

    const response = await fetchImpl(`${dummyJsonBaseUrl}/products?limit=${limit}&skip=${skip}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch products from DummyJSON: ${response.status}`);
    }

    const data = await response.json();
    const cards = Array.isArray(data.products) ? data.products.map(mapDummyProductToCard) : [];
    const filteredCards = filterCards(cards, filters);
    const total = Number(data.total || filteredCards.length);

    return {
      products: filteredCards,
      pagination: {
        page,
        limit,
        total,
        hasMore: skip + limit < total,
      },
      filters: {
        categories: filters?.categories || [],
        priceRange: filters?.priceRange,
      },
    };
  };

  // Stripe webhook must read the raw request body.
  app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
    try {
      if (!stripeWebhookSecret) {
        return res.status(400).json({ error: 'STRIPE_WEBHOOK_SECRET is not configured' });
      }

      const signature = req.headers['stripe-signature'];
      const event = stripe.webhooks.constructEvent(req.body, signature, stripeWebhookSecret);
      const eventId = event?.id;

      if (eventId) {
        const inserted = await paymentStore.markProcessedEvent(eventId, event.type, event);
        if (!inserted) {
          return res.json({ received: true, duplicate: true });
        }
      }

      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        await setOrderPaymentStatus(
          paymentIntent?.metadata?.orderId,
          'succeeded',
          paymentIntent?.id || null,
          'fulfilled'
        );
        console.log('payment_intent.succeeded', {
          id: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          metadata: paymentIntent.metadata,
        });
      }

      if (event.type === 'payment_intent.payment_failed') {
        const paymentIntent = event.data.object;
        await setOrderPaymentStatus(
          paymentIntent?.metadata?.orderId,
          'failed',
          paymentIntent?.id || null,
          'not_fulfilled'
        );
        console.log('payment_intent.payment_failed', {
          id: paymentIntent.id,
          lastPaymentError: paymentIntent.last_payment_error,
        });
      }

      if (event.type === 'payment_intent.processing') {
        const paymentIntent = event.data.object;
        await setOrderPaymentStatus(
          paymentIntent?.metadata?.orderId,
          'processing',
          paymentIntent?.id || null,
          'pending'
        );
      }

      if (event.type === 'payment_intent.canceled') {
        const paymentIntent = event.data.object;
        await setOrderPaymentStatus(
          paymentIntent?.metadata?.orderId,
          'canceled',
          paymentIntent?.id || null,
          'not_fulfilled'
        );
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

  app.get('/internal/store-info', requireInternalDebugAuth, async (_, res) => {
    const info = (await paymentStore.getStoreInfo?.()) || { driver: 'unknown' };
    return res.json(info);
  });

  app.post('/products', async (req, res) => {
    try {
      const pagination = req.body?.pagination || { page: 1, limit: 10 };
      const filters = req.body?.filters;
      const response = await getDummyJsonFeed(pagination, filters);
      return res.json(response);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      return res.status(500).json({
        error: error?.message || 'Failed to fetch products',
      });
    }
  });

  app.post('/feed/personalized', async (req, res) => {
    try {
      const pagination = req.body?.pagination || { page: 1, limit: 10 };
      const response = await getDummyJsonFeed(pagination);
      return res.json(response);
    } catch (error) {
      console.error('Failed to fetch personalized feed:', error);
      return res.status(500).json({
        error: error?.message || 'Failed to fetch personalized feed',
      });
    }
  });

  app.post('/feed/refresh', async (_, res) => {
    try {
      const response = await getDummyJsonFeed({ page: 1, limit: 10 });
      return res.json(response);
    } catch (error) {
      console.error('Failed to refresh feed:', error);
      return res.status(500).json({
        error: error?.message || 'Failed to refresh feed',
      });
    }
  });

  app.post('/swipe-actions', (req, res) => {
    const { productId, action, userId } = req.body || {};
    if (!productId || !action || !userId) {
      return res.status(400).json({ error: 'productId, action, and userId are required' });
    }

    return res.json({
      success: true,
      message: `${action} action recorded successfully`,
    });
  });

  app.post('/payments/create-payment-sheet', requirePaymentAuth, async (req, res) => {
    try {
      const { orderId, amountInCents, currency: requestedCurrency, customerId } = req.body || {};
      const parsedAmount = Number(amountInCents);
      const idempotencyKeyFromHeader = req.headers['idempotency-key'];
      const idempotencyKey = String(idempotencyKeyFromHeader || `order:${orderId}`);

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
      }, {
        idempotencyKey,
      });

      await setOrderPaymentStatus(orderId, 'requires_payment_method', paymentIntent.id, 'pending');

      return res.json({
        clientSecret: paymentIntent.client_secret,
        customerId: customer.id,
        ephemeralKey: ephemeralKey.secret,
        merchantDisplayName,
        paymentIntentId: paymentIntent.id,
      });
    } catch (error) {
      console.error('Error creating payment sheet params:', error);
      return res.status(500).json({
        error: error?.message || 'Failed to create payment sheet params',
      });
    }
  });

  app.get('/payments/status/:orderId', async (req, res) => {
    try {
      const { orderId } = req.params;
      if (!orderId) {
        return res.status(400).json({ error: 'orderId is required' });
      }

      const statusRecord = await paymentStore.getPayment(orderId);
      if (!statusRecord) {
        return res.status(404).json({ error: 'Payment status not found' });
      }

      if (statusRecord.paymentIntentId) {
        const intent = await stripe.paymentIntents.retrieve(statusRecord.paymentIntentId);
        const mappedStatus = intent?.status === 'succeeded'
          ? 'succeeded'
          : intent?.status === 'processing'
            ? 'processing'
            : intent?.status === 'canceled'
              ? 'canceled'
              : intent?.status === 'requires_payment_method'
                ? 'requires_payment_method'
                : intent?.status === 'requires_action'
                  ? 'requires_action'
                  : intent?.status === 'requires_confirmation'
                    ? 'requires_confirmation'
                    : statusRecord.status;

        const fulfillment = mappedStatus === 'succeeded'
          ? 'fulfilled'
          : mappedStatus === 'processing'
            ? 'pending'
            : mappedStatus === 'canceled' || mappedStatus === 'failed'
              ? 'not_fulfilled'
              : statusRecord.fulfillment || 'pending';

        await setOrderPaymentStatus(orderId, mappedStatus, statusRecord.paymentIntentId, fulfillment);
      }

      return res.json(await paymentStore.getPayment(orderId));
    } catch (error) {
      console.error('Failed to retrieve payment status:', error);
      return res.status(500).json({
        error: error?.message || 'Failed to retrieve payment status',
      });
    }
  });

  app.get('/orders/status/:orderId', requirePaymentAuth, async (req, res) => {
    const { orderId } = req.params;
    const record = await paymentStore.getPayment(orderId);
    if (!record) {
      return res.status(404).json({ error: 'Order status not found' });
    }

    return res.json({
      orderId: record.orderId,
      paymentStatus: record.status,
      fulfillment: record.fulfillment || 'pending',
      updatedAt: record.updatedAt,
    });
  });

  return app;
}

module.exports = { createApp };
