import { CategoryPreferences, ProductFeedResponse, SwipeActionResponse } from '../../types';
import { AppConfig } from '../../config/env';
import { ProductFeedService } from '../../services/ProductFeedService';

export interface FeedFilters {
  categories?: string[];
  priceRange?: { min: number; max: number };
  excludeProductIds?: string[];
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface ProductFeedProvider {
  getProducts(pagination?: PaginationParams, filters?: FeedFilters): Promise<ProductFeedResponse>;
  getPersonalizedFeed(pagination?: PaginationParams): Promise<ProductFeedResponse>;
  refreshFeed(): Promise<ProductFeedResponse>;
  recordSwipeAction(
    productId: string,
    action: 'like' | 'skip',
    userId: string
  ): Promise<SwipeActionResponse>;
}

export class MockProductFeedProvider implements ProductFeedProvider {
  async getProducts(
    pagination: PaginationParams = { page: 1, limit: 10 },
    filters?: FeedFilters
  ): Promise<ProductFeedResponse> {
    return ProductFeedService.getProducts(pagination, filters);
  }

  async getPersonalizedFeed(
    pagination: PaginationParams = { page: 1, limit: 10 }
  ): Promise<ProductFeedResponse> {
    return ProductFeedService.getPersonalizedFeed(pagination);
  }

  async refreshFeed(): Promise<ProductFeedResponse> {
    return ProductFeedService.refreshFeed();
  }

  async recordSwipeAction(
    productId: string,
    action: 'like' | 'skip',
    userId: string
  ): Promise<SwipeActionResponse> {
    return ProductFeedService.recordSwipeAction(productId, action, userId);
  }
}

export class ApiProductFeedProvider implements ProductFeedProvider {
  private readonly baseUrl: string;

  constructor(baseUrl: string = AppConfig.api.baseUrl) {
    this.baseUrl = baseUrl;
  }

  private ensureConfigured(): void {
    if (!this.baseUrl) {
      throw new Error(
        'API mode is enabled but EXPO_PUBLIC_API_BASE_URL is not configured.'
      );
    }
  }

  async getProducts(
    pagination: PaginationParams = { page: 1, limit: 10 },
    filters?: FeedFilters
  ): Promise<ProductFeedResponse> {
    this.ensureConfigured();

    const response = await fetch(`${this.baseUrl}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pagination, filters }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.status}`);
    }

    return response.json();
  }

  async getPersonalizedFeed(
    pagination: PaginationParams = { page: 1, limit: 10 }
  ): Promise<ProductFeedResponse> {
    this.ensureConfigured();

    const response = await fetch(`${this.baseUrl}/feed/personalized`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pagination }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch personalized feed: ${response.status}`);
    }

    return response.json();
  }

  async refreshFeed(): Promise<ProductFeedResponse> {
    this.ensureConfigured();

    const response = await fetch(`${this.baseUrl}/feed/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Failed to refresh feed: ${response.status}`);
    }

    return response.json();
  }

  async recordSwipeAction(
    productId: string,
    action: 'like' | 'skip',
    userId: string
  ): Promise<SwipeActionResponse> {
    this.ensureConfigured();

    const response = await fetch(`${this.baseUrl}/swipe-actions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, action, userId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to record swipe action: ${response.status}`);
    }

    return response.json();
  }
}
