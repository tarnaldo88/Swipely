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

  constructor(baseUrl: string = AppConfig.productFeed.baseUrl || AppConfig.api.baseUrl) {
    this.baseUrl = baseUrl;
  }

  private ensureConfigured(): void {
    if (!this.baseUrl) {
      throw new Error(
        'API mode is enabled but EXPO_PUBLIC_API_BASE_URL is not configured.'
      );
    }
  }

  private isDummyJsonSource(): boolean {
    return /dummyjson\.com/i.test(this.baseUrl);
  }

  private toCategoryName(category: string): string {
    return category
      .split('-')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  private mapDummyProductToCard(product: any) {
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
        name: this.toCategoryName(categoryId),
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

  private async getDummyJsonFeed(
    pagination: PaginationParams = { page: 1, limit: 10 },
    filters?: FeedFilters
  ): Promise<ProductFeedResponse> {
    const limit = Math.max(1, pagination.limit);
    const skip = Math.max(0, (pagination.page - 1) * limit);
    const response = await fetch(
      `${this.baseUrl}/products?limit=${limit}&skip=${skip}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch products from DummyJSON: ${response.status}`);
    }

    const data = await response.json();
    const allCards = Array.isArray(data.products)
      ? data.products.map((product: any) => this.mapDummyProductToCard(product))
      : [];

    const filteredCards = allCards.filter(card => {
      if (filters?.categories?.length) {
        if (!filters.categories.includes(card.category.id)) {
          return false;
        }
      }

      if (filters?.priceRange) {
        if (card.price < filters.priceRange.min || card.price > filters.priceRange.max) {
          return false;
        }
      }

      if (filters?.excludeProductIds?.length) {
        if (filters.excludeProductIds.includes(card.id)) {
          return false;
        }
      }

      return true;
    });

    return {
      products: filteredCards,
      pagination: {
        page: pagination.page,
        limit,
        total: Number(data.total || filteredCards.length),
        hasMore: skip + limit < Number(data.total || filteredCards.length),
      },
      filters: {
        categories: filters?.categories || [],
        priceRange: filters?.priceRange,
      },
    };
  }

  async getProducts(
    pagination: PaginationParams = { page: 1, limit: 10 },
    filters?: FeedFilters
  ): Promise<ProductFeedResponse> {
    this.ensureConfigured();

    if (this.isDummyJsonSource()) {
      return this.getDummyJsonFeed(pagination, filters);
    }

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

    if (this.isDummyJsonSource()) {
      return this.getDummyJsonFeed(pagination);
    }

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

    if (this.isDummyJsonSource()) {
      return this.getDummyJsonFeed({ page: 1, limit: 10 });
    }

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

    if (this.isDummyJsonSource()) {
      return {
        success: true,
        message: `${action} action recorded locally`,
      };
    }

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
