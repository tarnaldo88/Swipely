import { AppConfig } from '../../config/env';
import { ProductCard } from '../../types';
import {
  getWishlistService,
  WishlistItem,
  WishlistService,
} from '../../services/WishlistService';

export type { WishlistItem } from '../../services/WishlistService';

export interface WishlistProvider {
  addToWishlist(productId: string): Promise<void>;
  removeFromWishlist(productId: string): Promise<void>;
  getWishlistItems(): Promise<WishlistItem[]>;
  getWishlistItemsWithDetails(): Promise<(WishlistItem & { product: ProductCard })[]>;
  isInWishlist(productId: string): Promise<boolean>;
  clearWishlist(): Promise<void>;
  getWishlistCount(): Promise<number>;
  syncWithBackend(): Promise<void>;
}

export class MockWishlistProvider implements WishlistProvider {
  private readonly wishlistService: WishlistService;

  constructor() {
    this.wishlistService = getWishlistService();
  }

  async addToWishlist(productId: string): Promise<void> {
    return this.wishlistService.addToWishlist(productId);
  }

  async removeFromWishlist(productId: string): Promise<void> {
    return this.wishlistService.removeFromWishlist(productId);
  }

  async getWishlistItems(): Promise<WishlistItem[]> {
    return this.wishlistService.getWishlistItems();
  }

  async getWishlistItemsWithDetails(): Promise<(WishlistItem & { product: ProductCard })[]> {
    return this.wishlistService.getWishlistItemsWithDetails();
  }

  async isInWishlist(productId: string): Promise<boolean> {
    return this.wishlistService.isInWishlist(productId);
  }

  async clearWishlist(): Promise<void> {
    return this.wishlistService.clearWishlist();
  }

  async getWishlistCount(): Promise<number> {
    return this.wishlistService.getWishlistCount();
  }

  async syncWithBackend(): Promise<void> {
    return this.wishlistService.syncWithBackend();
  }
}

export class ApiWishlistProvider implements WishlistProvider {
  private readonly baseUrl: string;

  constructor(baseUrl: string = AppConfig.api.baseUrl) {
    this.baseUrl = baseUrl;
  }

  private ensureConfigured(): void {
    if (!this.baseUrl) {
      throw new Error('API mode is enabled but EXPO_PUBLIC_API_BASE_URL is not configured.');
    }
  }

  async addToWishlist(productId: string): Promise<void> {
    this.ensureConfigured();
    const response = await fetch(`${this.baseUrl}/wishlist/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to add to wishlist: ${response.status}`);
    }
  }

  async removeFromWishlist(productId: string): Promise<void> {
    this.ensureConfigured();
    const response = await fetch(`${this.baseUrl}/wishlist/items/${productId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to remove from wishlist: ${response.status}`);
    }
  }

  async getWishlistItems(): Promise<WishlistItem[]> {
    this.ensureConfigured();
    const response = await fetch(`${this.baseUrl}/wishlist/items`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch wishlist items: ${response.status}`);
    }

    return response.json();
  }

  async getWishlistItemsWithDetails(): Promise<(WishlistItem & { product: ProductCard })[]> {
    this.ensureConfigured();
    const response = await fetch(`${this.baseUrl}/wishlist/items/details`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch wishlist items with details: ${response.status}`);
    }

    return response.json();
  }

  async isInWishlist(productId: string): Promise<boolean> {
    this.ensureConfigured();
    const response = await fetch(`${this.baseUrl}/wishlist/items/${productId}/exists`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Failed to check wishlist item: ${response.status}`);
    }

    const data = await response.json();
    return Boolean(data.exists);
  }

  async clearWishlist(): Promise<void> {
    this.ensureConfigured();
    const response = await fetch(`${this.baseUrl}/wishlist/items`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to clear wishlist: ${response.status}`);
    }
  }

  async getWishlistCount(): Promise<number> {
    this.ensureConfigured();
    const response = await fetch(`${this.baseUrl}/wishlist/count`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch wishlist count: ${response.status}`);
    }

    const data = await response.json();
    return data.count ?? 0;
  }

  async syncWithBackend(): Promise<void> {
    this.ensureConfigured();
    const response = await fetch(`${this.baseUrl}/wishlist/sync`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`Failed to sync wishlist: ${response.status}`);
    }
  }
}
