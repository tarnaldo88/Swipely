// Navigation types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  Feed: undefined;
  Wishlist: undefined;
  Cart: undefined;
  Profile: undefined;
};

export type MainStackParamList = {
  MainTabs: undefined;
  ProductDetails: { productId: string; product?: ProductCard; onActionComplete?: () => void };
  CategorySelection: { isInitialSetup?: boolean };
  SkippedProducts: { category: string };
  Faq: {},
};

// User types
export interface User {
  id: string;
  email: string;
  displayName: string;
  avatar?: string;
  preferences: UserPreferences;
  swipeHistory: SwipeAction[];
  createdAt: Date;
  lastActiveAt: Date;
}

export interface UserPreferences {
  categories: string[];
  priceRange: { min: number; max: number };
  brands: string[];
}

// Product types
export interface Product {
  id: string;
  title: string;
  description: string;
  price: {
    amount: number;
    currency: string;
    originalPrice?: number;
  };
  images: ProductImage[];
  category: ProductCategory;
  specifications: Record<string, any>;
  availability: {
    inStock: boolean;
    quantity?: number;
    estimatedDelivery?: Date;
  };
  vendor: {
    id: string;
    name: string;
    rating: number;
  };
  createdAt: Date;
  updatedAt: Date;
  reviewRating:number;
  reviewText:string;
}

export interface ProductImage {
  id: string;
  url: string;
  alt: string;
  isPrimary: boolean;
}

export interface ProductCategory {
  id: string;
  name: string;
  parentId?: string;
}

// ProductCard interface for swipeable cards
export interface ProductCard {
  id: string;
  title: string;
  price: number;
  currency: string;
  imageUrls: string[];
  category: ProductCategory;
  description: string;
  specifications: Record<string, any>;
  availability: boolean;
  reviewRating?: number;
}

// Interaction types
export interface SwipeAction {
  userId: string;
  productId: string;
  action: "like" | "skip";
  timestamp: Date;
  sessionId: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
  addedAt: Date;
  selectedVariants?: Record<string, string>;
}

// Authentication types
export interface LoginCredentials {
  email?: string;
  phone?: string;
  password: string;
  provider?: "email" | "phone" | "google" | "facebook" | "apple";
}

export interface SignUpData extends LoginCredentials {
  displayName: string;
  confirmPassword: string;
  acceptTerms?: boolean;
}

export interface AuthResult {
  user: User;
  token: string;
  refreshToken: string;
  expiresAt: Date;
}

export interface CategoryPreferences {
  selectedCategories: string[];
  lastUpdated: Date;
}

export interface SwipeHistory {
  actions: SwipeAction[];
  sessionId: string;
  startedAt: Date;
}

// API Response types
export interface ProductFeedResponse {
  products: ProductCard[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  filters: {
    categories: string[];
    priceRange?: { min: number; max: number };
  };
}

export interface CategoryListResponse {
  categories: ProductCategory[];
  total: number;
}

export interface ProductDetailsResponse {
  product: Product;
  relatedProducts?: ProductCard[];
}

export interface SwipeActionResponse {
  success: boolean;
  message?: string;
  updatedPreferences?: CategoryPreferences;
}

// Re-export authentication service types for convenience
export type {
  AuthenticationService,
  SessionStorage,
} from "../services/AuthenticationService";
export { AuthError, AuthErrorType } from "../services/AuthenticationService";

//Password Change TEMP
export interface PasswordChange {
  oldPassword?: string;
  newPassword?: string;
}