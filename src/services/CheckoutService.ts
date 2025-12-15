/**
 * Checkout Service
 * Manages checkout state, cart operations, and step progression
 */

import {
  CartItem,
  ShippingAddress,
  PaymentMethod,
  CheckoutState,
  CheckoutStep,
  CartCalculation,
} from '../types/checkout';
import {
  validateCartItems,
  validateShippingAddress,
  validatePaymentMethod,
} from '../utils/checkoutValidation';

const CHECKOUT_STEPS: CheckoutStep[] = ['cart', 'shipping', 'payment', 'confirmation'];
const TAX_RATE = 0.08; // 8% tax
const SHIPPING_COST = 9.99; // Flat rate shipping

export class CheckoutService {
  private static state: CheckoutState = {
    currentStep: 'cart',
    cartItems: [],
  };

  /**
   * Initialize checkout with cart items
   */
  static initializeCheckout(cartItems: CartItem[]): CheckoutState {
    this.state = {
      currentStep: 'cart',
      cartItems: [...cartItems],
    };
    return this.getState();
  }

  /**
   * Get current checkout state
   */
  static getState(): CheckoutState {
    return { ...this.state };
  }

  /**
   * Add or update a cart item
   */
  static updateCartItem(productId: string, quantity: number): CheckoutState {
    const existingItem = this.state.cartItems.find(item => item.productId === productId);

    if (existingItem) {
      if (quantity <= 0) {
        this.state.cartItems = this.state.cartItems.filter(item => item.productId !== productId);
      } else {
        existingItem.quantity = quantity;
      }
    }

    return this.getState();
  }

  /**
   * Remove a cart item
   */
  static removeCartItem(productId: string): CheckoutState {
    this.state.cartItems = this.state.cartItems.filter(item => item.productId !== productId);
    return this.getState();
  }

  /**
   * Clear all cart items
   */
  static clearCart(): CheckoutState {
    this.state.cartItems = [];
    return this.getState();
  }

  /**
   * Set shipping address
   */
  static setShippingAddress(address: ShippingAddress): CheckoutState {
    this.state.shippingAddress = { ...address };
    return this.getState();
  }

  /**
   * Set payment method
   */
  static setPaymentMethod(method: PaymentMethod): CheckoutState {
    this.state.paymentMethod = { ...method };
    return this.getState();
  }

  /**
   * Proceed to next checkout step
   */
  static proceedToNextStep(): CheckoutState {
    const currentIndex = CHECKOUT_STEPS.indexOf(this.state.currentStep);

    if (currentIndex < CHECKOUT_STEPS.length - 1) {
      // Validate current step before proceeding
      const validation = this.validateCurrentStep();
      if (!validation.isValid) {
        this.state.error = Object.values(validation.errors)[0];
        return this.getState();
      }

      this.state.currentStep = CHECKOUT_STEPS[currentIndex + 1];
      this.state.error = undefined;
    }

    return this.getState();
  }

  /**
   * Go to previous checkout step
   */
  static goToPreviousStep(): CheckoutState {
    const currentIndex = CHECKOUT_STEPS.indexOf(this.state.currentStep);

    if (currentIndex > 0) {
      this.state.currentStep = CHECKOUT_STEPS[currentIndex - 1];
      this.state.error = undefined;
    }

    return this.getState();
  }

  /**
   * Validate current step
   */
  static validateCurrentStep(): { isValid: boolean; errors: Record<string, string> } {
    switch (this.state.currentStep) {
      case 'cart':
        return validateCartItems(this.state.cartItems);

      case 'shipping':
        if (!this.state.shippingAddress) {
          return {
            isValid: false,
            errors: { shipping: 'Shipping address is required' },
          };
        }
        return validateShippingAddress(this.state.shippingAddress);

      case 'payment':
        if (!this.state.paymentMethod) {
          return {
            isValid: false,
            errors: { payment: 'Payment method is required' },
          };
        }
        return validatePaymentMethod(this.state.paymentMethod);

      case 'confirmation':
        return { isValid: true, errors: {} };

      default:
        return { isValid: false, errors: { step: 'Invalid checkout step' } };
    }
  }

  /**
   * Calculate cart totals
   */
  static calculateTotals(): CartCalculation {
    const subtotal = this.state.cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const tax = parseFloat((subtotal * TAX_RATE).toFixed(2));
    const shipping = this.state.cartItems.length > 0 ? SHIPPING_COST : 0;
    const total = parseFloat((subtotal + tax + shipping).toFixed(2));

    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      tax,
      shipping,
      total,
    };
  }

  /**
   * Get cart subtotal
   */
  static getSubtotal(): number {
    return this.calculateTotals().subtotal;
  }

  /**
   * Get cart total with tax and shipping
   */
  static getTotal(): number {
    return this.calculateTotals().total;
  }

  /**
   * Set error message
   */
  static setError(error: string | undefined): CheckoutState {
    this.state.error = error;
    return this.getState();
  }

  /**
   * Reset checkout to initial state
   */
  static resetCheckout(): CheckoutState {
    this.state = {
      currentStep: 'cart',
      cartItems: [],
    };
    return this.getState();
  }

  /**
   * Get cart item count
   */
  static getCartItemCount(): number {
    return this.state.cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }

  /**
   * Check if cart is empty
   */
  static isCartEmpty(): boolean {
    return this.state.cartItems.length === 0;
  }

  /**
   * Get cart items
   */
  static getCartItems(): CartItem[] {
    return [...this.state.cartItems];
  }

  /**
   * Set processing state
   */
  static setProcessing(isProcessing: boolean): CheckoutState {
    this.state.isProcessing = isProcessing;
    return this.getState();
  }
}
