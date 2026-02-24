import { PaymentService } from '../../src/services/PaymentService';

const originalEnv = process.env;

describe('PaymentService Stripe integration', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    (global as any).fetch = jest.fn();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  const loadPaymentService = (): typeof import('../../src/services/PaymentService').PaymentService => {
    const module = require('../../src/services/PaymentService') as typeof import('../../src/services/PaymentService');
    return module.PaymentService;
  };

  it('uses API base URL fallback endpoint when explicit payment sheet URL is not set', async () => {
    process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_123';
    process.env.EXPO_PUBLIC_API_BASE_URL = 'https://api.example.com';
    process.env.EXPO_PUBLIC_STRIPE_PAYMENT_SHEET_URL = '';

    ((global as any).fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        clientSecret: 'pi_test_secret',
        customerId: 'cus_123',
        ephemeralKey: 'ek_123',
      }),
    });

    const service = loadPaymentService();
    const result = await service.createPaymentSheetParams('ORD-1', 10.5);

    expect((global as any).fetch).toHaveBeenCalledWith(
      'https://api.example.com/payments/create-payment-sheet',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Idempotency-Key': 'order:ORD-1',
        }),
      })
    );

    const [, options] = ((global as any).fetch as jest.Mock).mock.calls[0];
    expect(JSON.parse(options.body)).toEqual({
      orderId: 'ORD-1',
      amount: 10.5,
      amountInCents: 1050,
      currency: 'usd',
    });

    expect(result).toEqual({
      clientSecret: 'pi_test_secret',
      customerId: 'cus_123',
      ephemeralKey: 'ek_123',
      merchantDisplayName: 'Swipely',
    });
  });

  it('uses explicit payment sheet URL when provided', async () => {
    process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_123';
    process.env.EXPO_PUBLIC_API_BASE_URL = 'https://api.example.com';
    process.env.EXPO_PUBLIC_STRIPE_PAYMENT_SHEET_URL = 'https://payments.example.com/sheet';

    ((global as any).fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ clientSecret: 'pi_test_secret' }),
    });

    const service = loadPaymentService();
    await service.createPaymentSheetParams('ORD-2', 42);

    expect((global as any).fetch).toHaveBeenCalledWith(
      'https://payments.example.com/sheet',
      expect.any(Object)
    );
  });

  it('supports alias fields from backend response', async () => {
    process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_123';
    process.env.EXPO_PUBLIC_API_BASE_URL = 'https://api.example.com';

    ((global as any).fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        paymentIntentClientSecret: 'pi_test_secret_alias',
        customer: 'cus_alias',
        ephemeralKeySecret: 'ek_alias',
        merchantDisplayName: 'Custom Merchant',
      }),
    });

    const service = loadPaymentService();
    const result = await service.createPaymentSheetParams('ORD-3', 5);

    expect(result).toEqual({
      clientSecret: 'pi_test_secret_alias',
      customerId: 'cus_alias',
      ephemeralKey: 'ek_alias',
      merchantDisplayName: 'Custom Merchant',
    });
  });

  it('throws detailed error when backend returns non-OK response', async () => {
    process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_123';
    process.env.EXPO_PUBLIC_API_BASE_URL = 'https://api.example.com';

    ((global as any).fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'Server exploded',
    });

    const service = loadPaymentService();

    await expect(service.createPaymentSheetParams('ORD-4', 15)).rejects.toThrow(
      'Failed to create Stripe payment session (500): Server exploded'
    );
  });

  it('throws when Stripe config is not enabled', async () => {
    process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY = '';
    process.env.EXPO_PUBLIC_API_BASE_URL = 'https://api.example.com';
    process.env.EXPO_PUBLIC_STRIPE_PAYMENT_SHEET_URL = '';

    const service = loadPaymentService();

    await expect(service.createPaymentSheetParams('ORD-5', 7)).rejects.toThrow(
      'Stripe is not configured'
    );
  });

  it('verifies payment status from backend', async () => {
    process.env.EXPO_PUBLIC_API_BASE_URL = 'https://api.example.com';

    ((global as any).fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        orderId: 'ORD-6',
        status: 'succeeded',
        paymentIntentId: 'pi_123',
      }),
    });

    const service = loadPaymentService();
    const status = await service.verifyPaymentStatus('ORD-6');

    expect((global as any).fetch).toHaveBeenCalledWith(
      'https://api.example.com/payments/status/ORD-6',
      { headers: {} }
    );
    expect(status.status).toBe('succeeded');
  });

  it('sends API key header when configured', async () => {
    process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_123';
    process.env.EXPO_PUBLIC_API_BASE_URL = 'https://api.example.com';
    process.env.EXPO_PUBLIC_PAYMENT_API_KEY = 'client-key';

    ((global as any).fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ clientSecret: 'pi_test_secret' }),
    });

    const service = loadPaymentService();
    await service.createPaymentSheetParams('ORD-APIKEY', 12);

    expect((global as any).fetch).toHaveBeenCalledWith(
      'https://api.example.com/payments/create-payment-sheet',
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-api-key': 'client-key',
          'Idempotency-Key': 'order:ORD-APIKEY',
        }),
      })
    );
  });

  it('throws when payment status verification fails', async () => {
    process.env.EXPO_PUBLIC_API_BASE_URL = 'https://api.example.com';

    ((global as any).fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404,
      text: async () => 'not found',
    });

    const service = loadPaymentService();
    await expect(service.verifyPaymentStatus('ORD-MISSING')).rejects.toThrow(
      'Failed to verify payment status (404): not found'
    );
  });
});
