/**
 * Checkout and Payment Types
 * Defines all data models for the checkout and payment flow
 */

export interface CartItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  imageUrl: string;
  category?: string;
}

export interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}

export interface PaymentMethod {
  cardNumber: string;
  expirationDate: string;
  cvv: string;
  cardholderName: string;
  isDefault?: boolean;
}

export interface Order {
  orderId: string;
  confirmationNumber: string;
  userId: string;
  items: CartItem[];
  shippingAddress: ShippingAddress;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  status: 'completed' | 'shipped' | 'delivered';
  createdAt: Date;
  estimatedDelivery: Date;
}

export type CheckoutStep = 'cart' | 'shipping' | 'payment' | 'confirmation';

export interface CheckoutState {
  currentStep: CheckoutStep;
  cartItems: CartItem[];
  shippingAddress?: ShippingAddress;
  paymentMethod?: PaymentMethod;
  order?: Order;
  error?: string;
  isProcessing?: boolean;
}

export interface CheckoutContextType {
  state: CheckoutState;
  updateCartItem: (productId: string, quantity: number) => void;
  removeCartItem: (productId: string) => void;
  setShippingAddress: (address: ShippingAddress) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  proceedToNextStep: () => void;
  goToPreviousStep: () => void;
  setError: (error: string | undefined) => void;
  resetCheckout: () => void;
}

/**
 * Validation result type for form validation
 */
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Payment processing result
 */
export interface PaymentResult {
  success: boolean;
  orderId?: string;
  confirmationNumber?: string;
  error?: string;
}

/**
 * Cart calculation result
 */
export interface CartCalculation {
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
}
