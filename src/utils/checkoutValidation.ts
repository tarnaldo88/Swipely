/**
 * Checkout Validation Utilities
 * Provides validation functions for checkout data models
 */

import { CartItem, ShippingAddress, PaymentMethod, ValidationResult } from '../types/checkout';

/**
 * Validates a cart item
 */
export const validateCartItem = (item: CartItem): ValidationResult => {
  const errors: Record<string, string> = {};

  if (!item.productId || item.productId.trim() === '') {
    errors.productId = 'Product ID is required';
  }

  if (!item.title || item.title.trim() === '') {
    errors.title = 'Product title is required';
  }

  if (item.price <= 0) {
    errors.price = 'Price must be greater than 0';
  }

  if (item.quantity <= 0 || !Number.isInteger(item.quantity)) {
    errors.quantity = 'Quantity must be a positive integer';
  }

  if (!item.imageUrl || item.imageUrl.trim() === '') {
    errors.imageUrl = 'Image URL is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validates a shipping address
 */
export const validateShippingAddress = (address: ShippingAddress): ValidationResult => {
  const errors: Record<string, string> = {};

  if (!address.street || address.street.trim() === '') {
    errors.street = 'Street address is required';
  }

  if (!address.city || address.city.trim() === '') {
    errors.city = 'City is required';
  }

  if (!address.state || address.state.trim() === '') {
    errors.state = 'State is required';
  }

  if (!address.postalCode || address.postalCode.trim() === '') {
    errors.postalCode = 'Postal code is required';
  } else if (!isValidPostalCode(address.postalCode, address.country)) {
    errors.postalCode = 'Invalid postal code format';
  }

  if (!address.country || address.country.trim() === '') {
    errors.country = 'Country is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validates postal code format based on country
 */
export const isValidPostalCode = (postalCode: string, country: string): boolean => {
  const trimmed = postalCode.trim();

  // US ZIP code: 5 digits or 5+4 format
  if (country.toUpperCase() === 'US') {
    return /^\d{5}(-\d{4})?$/.test(trimmed);
  }

  // Canada postal code: A1A 1A1 format
  if (country.toUpperCase() === 'CA') {
    return /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i.test(trimmed);
  }

  // UK postcode: Various formats
  if (country.toUpperCase() === 'UK' || country.toUpperCase() === 'GB') {
    return /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i.test(trimmed);
  }

  // Generic: At least 3 characters, alphanumeric with spaces/hyphens
  return /^[A-Z0-9\s\-]{3,}$/i.test(trimmed);
};

/**
 * Validates a payment method (card)
 */
export const validatePaymentMethod = (method: PaymentMethod): ValidationResult => {
  const errors: Record<string, string> = {};

  if (!method.cardNumber || method.cardNumber.trim() === '') {
    errors.cardNumber = 'Card number is required';
  } else if (!isValidCardNumber(method.cardNumber)) {
    errors.cardNumber = 'Invalid card number';
  }

  if (!method.expirationDate || method.expirationDate.trim() === '') {
    errors.expirationDate = 'Expiration date is required';
  } else if (!isValidExpirationDate(method.expirationDate)) {
    errors.expirationDate = 'Invalid expiration date (use MM/YY format)';
  }

  if (!method.cvv || method.cvv.trim() === '') {
    errors.cvv = 'CVV is required';
  } else if (!isValidCVV(method.cvv)) {
    errors.cvv = 'Invalid CVV (3-4 digits)';
  }

  if (!method.cardholderName || method.cardholderName.trim() === '') {
    errors.cardholderName = 'Cardholder name is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validates card number using Luhn algorithm
 */
export const isValidCardNumber = (cardNumber: string): boolean => {
  const cleaned = cardNumber.replace(/\s/g, '');

  // Check if it's all digits and between 13-19 characters
  if (!/^\d{13,19}$/.test(cleaned)) {
    return false;
  }

  // Luhn algorithm
  let sum = 0;
  let isEven = false;

  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
};

/**
 * Validates expiration date format (MM/YY)
 */
export const isValidExpirationDate = (expirationDate: string): boolean => {
  const match = expirationDate.match(/^(\d{2})\/(\d{2})$/);

  if (!match) {
    return false;
  }

  const month = parseInt(match[1], 10);
  const year = parseInt(match[2], 10);

  // Month must be 01-12
  if (month < 1 || month > 12) {
    return false;
  }

  // Year must be current year or later
  const currentYear = new Date().getFullYear() % 100;
  const currentMonth = new Date().getMonth() + 1;

  if (year < currentYear) {
    return false;
  }

  if (year === currentYear && month < currentMonth) {
    return false;
  }

  return true;
};

/**
 * Validates CVV (3-4 digits)
 */
export const isValidCVV = (cvv: string): boolean => {
  return /^\d{3,4}$/.test(cvv.trim());
};

/**
 * Validates all cart items
 */
export const validateCartItems = (items: CartItem[]): ValidationResult => {
  const errors: Record<string, string> = {};

  if (!items || items.length === 0) {
    errors.cart = 'Cart is empty';
    return { isValid: false, errors };
  }

  for (let i = 0; i < items.length; i++) {
    const itemValidation = validateCartItem(items[i]);
    if (!itemValidation.isValid) {
      errors[`item_${i}`] = JSON.stringify(itemValidation.errors);
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
