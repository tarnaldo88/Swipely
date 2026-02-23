/**
 * Payment Service
 * Handles payment processing with Stripe integration
 * Note: In production, card tokenization would be done via Stripe SDK
 * For now, this provides the service structure and mock implementation
 */

import { PaymentMethod, PaymentResult, Order } from '../types/checkout';
import { isValidCardNumber, isValidExpirationDate, isValidCVV } from '../utils/checkoutValidation';
import { AppConfig } from '../config/env';

interface StripePaymentIntent {
  clientSecret: string;
  amount: number;
  currency: string;
}

export interface StripePaymentSheetParams {
  clientSecret: string;
  customerId?: string;
  ephemeralKey?: string;
  merchantDisplayName?: string;
}

export class PaymentService {
  private static readonly STRIPE_PUBLISHABLE_KEY = 'pk_test_demo'; // Demo key
  private static readonly MAX_RETRIES = 3;
  private static retryCount = 0;

  static isStripeConfigured(): boolean {
    return AppConfig.features.stripeEnabled;
  }

  static async createPaymentSheetParams(
    orderId: string,
    amount: number
  ): Promise<StripePaymentSheetParams> {
    if (!AppConfig.features.stripeEnabled || !AppConfig.stripe.paymentSheetUrl) {
      throw new Error('Stripe is not configured');
    }

    const response = await fetch(AppConfig.stripe.paymentSheetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId,
        amount,
        amountInCents: Math.round(amount * 100),
        currency: 'usd',
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create Stripe payment session (${response.status})`);
    }

    const data = await response.json();

    if (!data?.clientSecret) {
      throw new Error('Stripe payment session is missing client secret');
    }

    return {
      clientSecret: data.clientSecret,
      customerId: data.customerId,
      ephemeralKey: data.ephemeralKey,
      merchantDisplayName: data.merchantDisplayName || 'Swipely',
    };
  }

  /**
   * Initialize Stripe (would be called once at app startup)
   */
  static initializeStripe(publishableKey: string): void {
    // In production, this would initialize the Stripe SDK
    // StripeSDK.setPublishableKey(publishableKey);
    console.log('Stripe initialized with key:', publishableKey);
  }

  /**
   * Validate payment method before processing
   */
  static validatePaymentMethod(method: PaymentMethod): { isValid: boolean; error?: string } {
    if (!isValidCardNumber(method.cardNumber)) {
      return { isValid: false, error: 'Invalid card number' };
    }

    if (!isValidExpirationDate(method.expirationDate)) {
      return { isValid: false, error: 'Invalid expiration date' };
    }

    if (!isValidCVV(method.cvv)) {
      return { isValid: false, error: 'Invalid CVV' };
    }

    if (!method.cardholderName || method.cardholderName.trim() === '') {
      return { isValid: false, error: 'Cardholder name is required' };
    }

    return { isValid: true };
  }

  /**
   * Create a payment intent (would call backend in production)
   */
  static async createPaymentIntent(amount: number): Promise<StripePaymentIntent> {
    try {
      // Simulate network delay
      await this.simulateNetworkDelay();

      // In production, this would call your backend API
      // const response = await fetch('https://your-backend.com/create-payment-intent', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ amount })
      // });
      // const data = await response.json();
      // return data;

      // Mock response for development
      return {
        clientSecret: `pi_test_${Date.now()}`,
        amount,
        currency: 'USD',
      };
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw new Error('Failed to create payment intent');
    }
  }

  /**
   * Tokenize card with Stripe
   * In production, this would use Stripe SDK to create a token
   */
  static async tokenizeCard(method: PaymentMethod): Promise<string> {
    try {
      // Validate payment method first
      const validation = this.validatePaymentMethod(method);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Simulate network delay
      await this.simulateNetworkDelay();

      // In production, this would use Stripe SDK:
      // const token = await StripeSDK.createToken({
      //   number: method.cardNumber,
      //   exp_month: parseInt(method.expirationDate.split('/')[0]),
      //   exp_year: parseInt(method.expirationDate.split('/')[1]),
      //   cvc: method.cvv,
      //   name: method.cardholderName,
      // });
      // return token.id;

      // Mock token for development
      return `tok_visa_${Date.now()}`;
    } catch (error) {
      console.error('Error tokenizing card:', error);
      throw error;
    }
  }

  /**
   * Process payment with Stripe
   * In production, this would call your backend to charge the card
   */
  static async processPayment(
    paymentMethod: PaymentMethod,
    amount: number,
    orderId: string
  ): Promise<PaymentResult> {
    this.retryCount = 0;
    return this.processPaymentWithRetry(paymentMethod, amount, orderId);
  }

  /**
   * Process payment with retry logic
   */
  private static async processPaymentWithRetry(
    paymentMethod: PaymentMethod,
    amount: number,
    orderId: string
  ): Promise<PaymentResult> {
    try {
      // Validate payment method
      const validation = this.validatePaymentMethod(paymentMethod);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error,
        };
      }

      // Tokenize card
      const token = await this.tokenizeCard(paymentMethod);

      // Create payment intent
      const intent = await this.createPaymentIntent(amount);

      // Simulate network delay
      await this.simulateNetworkDelay();

      // In production, this would call your backend:
      // const response = await fetch('https://your-backend.com/charge', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     token,
      //     amount,
      //     orderId,
      //     clientSecret: intent.clientSecret,
      //   })
      // });
      // const result = await response.json();

      // Simulate occasional payment failures for testing
      if (Math.random() < 0.05) {
        // 5% failure rate
        throw new Error('Card declined');
      }

      // Mock successful payment
      const confirmationNumber = `CONF-${Date.now()}`;

      return {
        success: true,
        orderId,
        confirmationNumber,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment processing failed';

      // Retry on transient errors
      if (this.isTransientError(errorMessage) && this.retryCount < this.MAX_RETRIES) {
        this.retryCount++;
        console.log(`Retrying payment (attempt ${this.retryCount}/${this.MAX_RETRIES})`);

        // Exponential backoff
        await this.delay(Math.pow(2, this.retryCount) * 1000);
        return this.processPaymentWithRetry(paymentMethod, amount, orderId);
      }

      console.error('Payment processing error:', error);

      return {
        success: false,
        error: this.getErrorMessage(errorMessage),
      };
    }
  }

  /**
   * Check if error is transient (should retry)
   */
  private static isTransientError(error: string): boolean {
    const transientErrors = ['timeout', 'network', 'temporarily', 'try again'];
    return transientErrors.some(err => error.toLowerCase().includes(err));
  }

  /**
   * Get user-friendly error message
   */
  private static getErrorMessage(error: string): string {
    const errorMap: Record<string, string> = {
      'card declined': 'Your card was declined. Please check your card details and try again.',
      'invalid card': 'Invalid card number. Please check and try again.',
      'expired card': 'Your card has expired. Please use a different card.',
      'insufficient funds': 'Insufficient funds. Please use a different card.',
      'network': 'Network error. Please check your connection and try again.',
      'timeout': 'Request timed out. Please try again.',
    };

    for (const [key, message] of Object.entries(errorMap)) {
      if (error.toLowerCase().includes(key)) {
        return message;
      }
    }

    return 'Payment processing failed. Please try again or contact support.';
  }

  /**
   * Simulate network delay
   */
  private static async simulateNetworkDelay(): Promise<void> {
    const delay = Math.random() * 1000 + 500; // 500-1500ms
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Delay utility
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Refund a payment (for order cancellations)
   */
  static async refundPayment(orderId: string, amount: number): Promise<PaymentResult> {
    try {
      // Simulate network delay
      await this.simulateNetworkDelay();

      // In production, this would call your backend:
      // const response = await fetch('https://your-backend.com/refund', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ orderId, amount })
      // });
      // const result = await response.json();

      return {
        success: true,
        orderId,
      };
    } catch (error) {
      console.error('Refund error:', error);
      return {
        success: false,
        error: 'Refund processing failed',
      };
    }
  }
}
