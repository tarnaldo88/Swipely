import type {
  User,
  Product,
  ProductCard,
  SwipeAction,
  CartItem,
  LoginCredentials,
  SignUpData,
  AuthResult,
  UserPreferences,
  ProductImage,
  ProductCategory,
  CategoryPreferences,
  ProductFeedResponse,
  CategoryListResponse,
  ProductDetailsResponse,
  SwipeActionResponse,
} from "../index";

describe("Type Definitions", () => {
  describe("User types", () => {
    it("should define User interface correctly", () => {
      const mockUser: User = {
        id: "user123",
        email: "test@example.com",
        displayName: "Test User",
        preferences: {
          categories: ["electronics"],
          priceRange: { min: 0, max: 1000 },
          brands: ["Apple"],
        },
        swipeHistory: [],
        createdAt: new Date(),
        lastActiveAt: new Date(),
      };

      expect(mockUser.id).toBe("user123");
      expect(mockUser.email).toBe("test@example.com");
      expect(mockUser.preferences.categories).toContain("electronics");
    });

    it("should define UserPreferences interface correctly", () => {
      const mockPreferences: UserPreferences = {
        categories: ["electronics", "clothing"],
        priceRange: { min: 10, max: 500 },
        brands: ["Nike", "Apple"],
      };

      expect(Array.isArray(mockPreferences.categories)).toBe(true);
      expect(typeof mockPreferences.priceRange.min).toBe("number");
      expect(typeof mockPreferences.priceRange.max).toBe("number");
    });
  });

  describe("Product types", () => {
    it("should define Product interface correctly", () => {
      const mockProduct: Product = {
        id: "prod123",
        title: "Test Product",
        description: "A test product",
        price: {
          amount: 99.99,
          currency: "USD",
        },
        images: [],
        category: {
          id: "cat1",
          name: "Electronics",
        },
        specifications: {},
        availability: {
          inStock: true,
        },
        vendor: {
          id: "vendor1",
          name: "Test Vendor",
          rating: 4.5,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(mockProduct.id).toBe("prod123");
      expect(mockProduct.price.amount).toBe(99.99);
      expect(mockProduct.availability.inStock).toBe(true);
    });

    it("should define ProductImage interface correctly", () => {
      const mockImage: ProductImage = {
        id: "img1",
        url: "https://example.com/image.jpg",
        alt: "Product image",
        isPrimary: true,
      };

      expect(mockImage.id).toBe("img1");
      expect(typeof mockImage.isPrimary).toBe("boolean");
    });

    it("should define ProductCard interface correctly", () => {
      const mockProductCard: ProductCard = {
        id: "card123",
        title: "Test Product Card",
        price: 49.99,
        currency: "USD",
        imageUrls: ["https://example.com/image1.jpg", "https://example.com/image2.jpg"],
        category: {
          id: "cat1",
          name: "Electronics",
        },
        description: "A test product card",
        specifications: { color: "black", size: "medium" },
        availability: true,
      };

      expect(mockProductCard.id).toBe("card123");
      expect(mockProductCard.price).toBe(49.99);
      expect(mockProductCard.currency).toBe("USD");
      expect(Array.isArray(mockProductCard.imageUrls)).toBe(true);
      expect(mockProductCard.availability).toBe(true);
    });

    it("should define ProductCategory interface correctly", () => {
      const mockCategory: ProductCategory = {
        id: "electronics",
        name: "Electronics",
        parentId: "tech",
      };

      expect(mockCategory.id).toBe("electronics");
      expect(mockCategory.name).toBe("Electronics");
      expect(mockCategory.parentId).toBe("tech");
    });
  });

  describe("Authentication types", () => {
    it("should define LoginCredentials interface correctly", () => {
      const mockCredentials: LoginCredentials = {
        email: "test@example.com",
        password: "password123",
        provider: "email",
      };

      expect(mockCredentials.email).toBe("test@example.com");
      expect(mockCredentials.provider).toBe("email");
    });

    it("should define SignUpData interface correctly", () => {
      const mockSignUpData: SignUpData = {
        email: "test@example.com",
        password: "password123",
        confirmPassword: "password123",
        displayName: "Test User",
      };

      expect(mockSignUpData.displayName).toBe("Test User");
      expect(mockSignUpData.confirmPassword).toBe("password123");
    });
  });

  describe("Interaction types", () => {
    it("should define SwipeAction interface correctly", () => {
      const mockSwipeAction: SwipeAction = {
        userId: "user123",
        productId: "prod123",
        action: "like",
        timestamp: new Date(),
        sessionId: "session123",
      };

      expect(mockSwipeAction.action).toBe("like");
      expect(typeof mockSwipeAction.timestamp).toBe("object");
    });

    it("should define CartItem interface correctly", () => {
      const mockCartItem: CartItem = {
        productId: "prod123",
        quantity: 2,
        addedAt: new Date(),
      };

      expect(mockCartItem.quantity).toBe(2);
      expect(typeof mockCartItem.addedAt).toBe("object");
    });
  });

  describe("Category and Preference types", () => {
    it("should define CategoryPreferences interface correctly", () => {
      const mockPreferences: CategoryPreferences = {
        selectedCategories: ["electronics", "fashion"],
        lastUpdated: new Date(),
      };

      expect(Array.isArray(mockPreferences.selectedCategories)).toBe(true);
      expect(mockPreferences.selectedCategories).toContain("electronics");
      expect(typeof mockPreferences.lastUpdated).toBe("object");
    });
  });

  describe("API Response types", () => {
    it("should define ProductFeedResponse interface correctly", () => {
      const mockResponse: ProductFeedResponse = {
        products: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 100,
          hasMore: true,
        },
        filters: {
          categories: ["electronics"],
          priceRange: { min: 0, max: 1000 },
        },
      };

      expect(Array.isArray(mockResponse.products)).toBe(true);
      expect(mockResponse.pagination.page).toBe(1);
      expect(mockResponse.pagination.hasMore).toBe(true);
      expect(mockResponse.filters.categories).toContain("electronics");
    });

    it("should define CategoryListResponse interface correctly", () => {
      const mockResponse: CategoryListResponse = {
        categories: [
          { id: "electronics", name: "Electronics" },
          { id: "fashion", name: "Fashion" },
        ],
        total: 2,
      };

      expect(Array.isArray(mockResponse.categories)).toBe(true);
      expect(mockResponse.total).toBe(2);
      expect(mockResponse.categories[0].id).toBe("electronics");
    });

    it("should define SwipeActionResponse interface correctly", () => {
      const mockResponse: SwipeActionResponse = {
        success: true,
        message: "Action recorded successfully",
        updatedPreferences: {
          selectedCategories: ["electronics"],
          lastUpdated: new Date(),
        },
      };

      expect(mockResponse.success).toBe(true);
      expect(typeof mockResponse.message).toBe("string");
      expect(mockResponse.updatedPreferences?.selectedCategories).toContain("electronics");
    });
  });
});
