# Swipely Stripe Backend

## Setup

1. Install dependencies:

```bash
npm --prefix backend install
```

2. Configure environment:

```bash
cp backend/.env.example backend/.env
```

3. Set at minimum:
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET` (required for webhook validation)
- `DUMMYJSON_BASE_URL` (defaults to `https://dummyjson.com`)

4. Start server:

```bash
npm --prefix backend start
```

Server runs on `http://localhost:3001` by default.

## Endpoints

- `GET /health`
- `POST /products`
- `POST /feed/personalized`
- `POST /feed/refresh`
- `POST /swipe-actions`
- `POST /payments/create-payment-sheet`
- `GET /payments/status/:orderId`
- `POST /webhooks/stripe`

## Request contract: `/payments/create-payment-sheet`

```json
{
  "orderId": "ORD-123",
  "amountInCents": 2599,
  "currency": "usd"
}
```

## Response

```json
{
  "clientSecret": "pi_xxx_secret_xxx",
  "customerId": "cus_xxx",
  "ephemeralKey": "ek_test_xxx",
  "merchantDisplayName": "Swipely"
}
```
