import { AppConfig } from '../../config/env';
import { CartItem, ProductCard } from '../../types';
import { CartService, getCartService } from '../../services/CartService';

export interface CartProvider {
  addToCart(productId: string, quantity?: number): Promise<void>;
  removeFromCart(productId: string): Promise<void>;
  updateQuantity(productId: string, quantity: number): Promise<void>;
  getCartItems(): Promise<CartItem[]>;
  getCartItemsWithDetails(): Promise<(CartItem & { product: ProductCard })[]>;
  clearCart(): Promise<void>;
  getCartCount(): Promise<number>;
  syncWithBackend(): Promise<void>;
}

export class MockCartProvider implements CartProvider {
  private readonly cartService: CartService;

  constructor() {
    this.cartService = getCartService();
  }

  async addToCart(productId: string, quantity?: number): Promise<void> {
    return this.cartService.addToCart(productId, quantity);
  }

  async removeFromCart(productId: string): Promise<void> {
    return this.cartService.removeFromCart(productId);
  }

  async updateQuantity(productId: string, quantity: number): Promise<void> {
    return this.cartService.updateQuantity(productId, quantity);
  }

  async getCartItems(): Promise<CartItem[]> {
    return this.cartService.getCartItems();
  }

  async getCartItemsWithDetails(): Promise<(CartItem & { product: ProductCard })[]> {
    return this.cartService.getCartItemsWithDetails();
  }

  async clearCart(): Promise<void> {
    return this.cartService.clearCart();
  }

  async getCartCount(): Promise<number> {
    return this.cartService.getCartCount();
  }

  async syncWithBackend(): Promise<void> {
    return this.cartService.syncWithBackend();
  }
}

export class ApiCartProvider implements CartProvider {
  private readonly baseUrl: string;

  constructor(baseUrl: string = AppConfig.api.baseUrl) {
    this.baseUrl = baseUrl;
  }

  private ensureConfigured(): void {
    if (!this.baseUrl) {
      throw new Error('API mode is enabled but EXPO_PUBLIC_API_BASE_URL is not configured.');
    }
  }

  async addToCart(productId: string, quantity: number = 1): Promise<void> {
    this.ensureConfigured();
    const response = await fetch(`${this.baseUrl}/cart/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, quantity }),
    });

    if (!response.ok) {
      throw new Error(`Failed to add to cart: ${response.status}`);
    }
  }

  async removeFromCart(productId: string): Promise<void> {
    this.ensureConfigured();
    const response = await fetch(`${this.baseUrl}/cart/items/${productId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to remove from cart: ${response.status}`);
    }
  }

  async updateQuantity(productId: string, quantity: number): Promise<void> {
    this.ensureConfigured();
    const response = await fetch(`${this.baseUrl}/cart/items/${productId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update cart quantity: ${response.status}`);
    }
  }

  async getCartItems(): Promise<CartItem[]> {
    this.ensureConfigured();
    const response = await fetch(`${this.baseUrl}/cart/items`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch cart items: ${response.status}`);
    }

    return response.json();
  }

  async getCartItemsWithDetails(): Promise<(CartItem & { product: ProductCard })[]> {
    this.ensureConfigured();
    const response = await fetch(`${this.baseUrl}/cart/items/details`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch cart items with details: ${response.status}`);
    }

    return response.json();
  }

  async clearCart(): Promise<void> {
    this.ensureConfigured();
    const response = await fetch(`${this.baseUrl}/cart/items`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to clear cart: ${response.status}`);
    }
  }

  async getCartCount(): Promise<number> {
    this.ensureConfigured();
    const response = await fetch(`${this.baseUrl}/cart/count`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch cart count: ${response.status}`);
    }

    const data = await response.json();
    return data.count ?? 0;
  }

  async syncWithBackend(): Promise<void> {
    this.ensureConfigured();
    const response = await fetch(`${this.baseUrl}/cart/sync`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`Failed to sync cart: ${response.status}`);
    }
  }
}
