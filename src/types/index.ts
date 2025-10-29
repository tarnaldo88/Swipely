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

// User types
export interface User {
  id: string;
  email: string;
  displayName: string;
  avatar?: string;
  preferences: UserPreferences;
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

// Interaction types
export interface SwipeAction {
  userId: string;
  productId: string;
  action: 'like' | 'skip';
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
  provider?: 'email' | 'phone' | 'google' | 'facebook' | 'apple';
}

export interface SignUpData extends LoginCredentials {
  displayName: string;
  confirmPassword: string;
}

export interface AuthResult {
  user: User;
  token: string;
  refreshToken: string;
}