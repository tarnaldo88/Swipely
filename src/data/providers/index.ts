import { AppConfig } from '../../config/env';
import {
  ApiCartProvider,
  CartProvider,
  MockCartProvider,
} from './CartProvider';
import {
  ApiProductFeedProvider,
  MockProductFeedProvider,
  ProductFeedProvider,
} from './ProductFeedProvider';
import {
  ApiWishlistProvider,
  MockWishlistProvider,
  WishlistProvider,
} from './WishlistProvider';

let productFeedProviderInstance: ProductFeedProvider | null = null;
let cartProviderInstance: CartProvider | null = null;
let wishlistProviderInstance: WishlistProvider | null = null;

export const getProductFeedProvider = (): ProductFeedProvider => {
  if (!productFeedProviderInstance) {
    productFeedProviderInstance = AppConfig.features.useMockData
      ? new MockProductFeedProvider()
      : new ApiProductFeedProvider();
  }

  return productFeedProviderInstance;
};

export const resetProductFeedProvider = (): void => {
  productFeedProviderInstance = null;
};

export const getCartProvider = (): CartProvider => {
  if (!cartProviderInstance) {
    cartProviderInstance = AppConfig.features.useMockData
      ? new MockCartProvider()
      : new ApiCartProvider();
  }

  return cartProviderInstance;
};

export const resetCartProvider = (): void => {
  cartProviderInstance = null;
};

export const getWishlistProvider = (): WishlistProvider => {
  if (!wishlistProviderInstance) {
    wishlistProviderInstance = AppConfig.features.useMockData
      ? new MockWishlistProvider()
      : new ApiWishlistProvider();
  }

  return wishlistProviderInstance;
};

export const resetWishlistProvider = (): void => {
  wishlistProviderInstance = null;
};
