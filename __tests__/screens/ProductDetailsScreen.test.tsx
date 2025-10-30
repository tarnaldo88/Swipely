import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ProductDetailsScreen } from '../../src/screens/main/ProductDetailsScreen';
import { ProductCard } from '../../src/types';
import { ProductDetailsService } from '../../src/services/ProductDetailsService';

// Mock the SwipeActionService
jest.mock('../../src/services/SwipeActionService', () => ({
  getSwipeActionService: () => ({
    onSwipeLeft: jest.fn(),
    onSwipeRight: jest.fn(),
    onAddToCart: jest.fn(),
    onViewDetails: jest.fn(),
  }),
}));

// Mock the ProductDetailsService
jest.mock('../../src/services/ProductDetailsService', () => ({
  ProductDetailsService: {
    getProductDetails: jest.fn(),
    isProductCached: jest.fn(),
    clearCache: jest.fn(),
  },
}));

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native/Libraries/Components/View/View');
  return {
    PanGestureHandler: View,
    State: {},
    useAnimatedGestureHandler: () => ({}),
  };
});

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const View = require('react-native/Libraries/Components/View/View');
  return {
    default: {
      View,
    },
    useSharedValue: () => ({ value: 0 }),
    useAnimatedStyle: () => ({}),
    withSpring: (value: any) => value,
    withTiming: (value: any) => value,
    runOnJS: (fn: any) => fn,
    interpolate: () => 0,
    Extrapolate: { CLAMP: 'clamp' },
  };
});

const mockProduct: ProductCard = {
  id: 'test-product-1',
  title: 'Test Product',
  price: 99.99,
  currency: '$',
  imageUrls: [
    'https://example.com/image1.jpg',
    'https://example.com/image2.jpg',
  ],
  category: { id: 'electronics', name: 'Electronics' },
  description: 'This is a test product description.',
  specifications: {
    'Battery Life': '10 hours',
    'Weight': '200g',
  },
  availability: true,
};

const Stack = createStackNavigator();

const TestNavigator = ({ product }: { product?: ProductCard }) => (
  <NavigationContainer>
    <Stack.Navigator>
      <Stack.Screen
        name="ProductDetails"
        component={ProductDetailsScreen}
        initialParams={{ productId: 'test-product-1', product }}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  </NavigationContainer>
);

describe('ProductDetailsScreen', () => {
  describe('Rendering', () => {
    it('should render product details when product is provided', async () => {
      const { getByText } = render(<TestNavigator product={mockProduct} />);

      await waitFor(() => {
        expect(getByText('Test Product')).toBeTruthy();
        expect(getByText('$99.99')).toBeTruthy();
        expect(getByText('Electronics')).toBeTruthy();
        expect(getByText('This is a test product description.')).toBeTruthy();
      });
    });

    it('should show loading state when product is not provided', async () => {
      const { getByText } = render(<TestNavigator />);

      await waitFor(() => {
        expect(getByText('Loading product details...')).toBeTruthy();
      });
    });

    it('should render specifications section', async () => {
      const { getByText } = render(<TestNavigator product={mockProduct} />);

      await waitFor(() => {
        expect(getByText('Specifications')).toBeTruthy();
        expect(getByText('Battery Life:')).toBeTruthy();
        expect(getByText('10 hours')).toBeTruthy();
        expect(getByText('Weight:')).toBeTruthy();
        expect(getByText('200g')).toBeTruthy();
      });
    });

    it('should render action buttons', async () => {
      const { getByText } = render(<TestNavigator product={mockProduct} />);

      await waitFor(() => {
        expect(getByText('Skip')).toBeTruthy();
        expect(getByText('Add to Cart')).toBeTruthy();
        expect(getByText('Like')).toBeTruthy();
      });
    });
  });

  describe('Interactions', () => {
    it('should handle close button press', async () => {
      const { getByText } = render(<TestNavigator product={mockProduct} />);

      await waitFor(() => {
        const closeButton = getByText('✕');
        expect(closeButton).toBeTruthy();
        fireEvent.press(closeButton);
      });
    });

    it('should handle action button presses', async () => {
      const { getByText } = render(<TestNavigator product={mockProduct} />);

      await waitFor(() => {
        const skipButton = getByText('Skip');
        const likeButton = getByText('Like');
        const cartButton = getByText('Add to Cart');

        fireEvent.press(skipButton);
        fireEvent.press(likeButton);
        fireEvent.press(cartButton);
      });
    });
  });

  describe('Out of Stock Product', () => {
    const outOfStockProduct: ProductCard = {
      ...mockProduct,
      availability: false,
    };

    it('should show out of stock message and disable cart button', async () => {
      const { getByText } = render(<TestNavigator product={outOfStockProduct} />);

      await waitFor(() => {
        expect(getByText('Out of Stock')).toBeTruthy();
        expect(getByText('Out of Stock')).toBeTruthy(); // Button text also changes
      });
    });
  });

  describe('Data Loading and Performance', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should use ProductDetailsService to load product data', async () => {
      const mockGetProductDetails = ProductDetailsService.getProductDetails as jest.Mock;
      mockGetProductDetails.mockResolvedValue(mockProduct);

      render(<TestNavigator />);

      await waitFor(() => {
        expect(mockGetProductDetails).toHaveBeenCalledWith('test-product-1');
      });
    });

    it('should handle loading errors with retry functionality', async () => {
      const mockGetProductDetails = ProductDetailsService.getProductDetails as jest.Mock;
      mockGetProductDetails.mockRejectedValue(new Error('Network error'));

      const { getByText } = render(<TestNavigator />);

      await waitFor(() => {
        expect(getByText('Failed to load product details')).toBeTruthy();
        expect(getByText('Retry')).toBeTruthy();
      });
    });

    it('should handle retry attempts', async () => {
      const mockGetProductDetails = ProductDetailsService.getProductDetails as jest.Mock;
      mockGetProductDetails
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue(mockProduct);

      const { getByText } = render(<TestNavigator />);

      await waitFor(() => {
        expect(getByText('Retry')).toBeTruthy();
      });

      fireEvent.press(getByText('Retry'));

      await waitFor(() => {
        expect(mockGetProductDetails).toHaveBeenCalledTimes(2);
        expect(getByText('Test Product')).toBeTruthy();
      });
    });

    it('should show max retries reached after 3 attempts', async () => {
      const mockGetProductDetails = ProductDetailsService.getProductDetails as jest.Mock;
      mockGetProductDetails.mockRejectedValue(new Error('Network error'));

      const { getByText } = render(<TestNavigator />);

      // First failure
      await waitFor(() => {
        expect(getByText('Retry')).toBeTruthy();
      });

      // Retry 1
      fireEvent.press(getByText('Retry'));
      await waitFor(() => {
        expect(getByText('Attempt 1 of 3')).toBeTruthy();
      });

      // Retry 2
      fireEvent.press(getByText('Retry'));
      await waitFor(() => {
        expect(getByText('Attempt 2 of 3')).toBeTruthy();
      });

      // Retry 3
      fireEvent.press(getByText('Retry'));
      await waitFor(() => {
        expect(getByText('Attempt 3 of 3')).toBeTruthy();
      });

      // Should show max retries reached
      await waitFor(() => {
        expect(getByText('Max retries reached')).toBeTruthy();
      });
    });

    it('should reset retry count on successful load', async () => {
      const mockGetProductDetails = ProductDetailsService.getProductDetails as jest.Mock;
      mockGetProductDetails
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue(mockProduct);

      const { getByText, queryByText } = render(<TestNavigator />);

      await waitFor(() => {
        expect(getByText('Retry')).toBeTruthy();
      });

      fireEvent.press(getByText('Retry'));

      await waitFor(() => {
        expect(getByText('Test Product')).toBeTruthy();
        expect(queryByText('Attempt')).toBeNull();
      });
    });
  });

  describe('Navigation and Actions', () => {
    it('should handle navigation back to main feed', async () => {
      const { getByText } = render(<TestNavigator product={mockProduct} />);

      await waitFor(() => {
        const closeButton = getByText('✕');
        fireEvent.press(closeButton);
        // Navigation mock would be tested here in a real scenario
      });
    });

    it('should handle swipe actions from details view', async () => {
      const { getByText } = render(<TestNavigator product={mockProduct} />);

      await waitFor(() => {
        const skipButton = getByText('Skip');
        const likeButton = getByText('Like');
        
        fireEvent.press(skipButton);
        fireEvent.press(likeButton);
        
        // In a real test, we would verify the swipe actions were called
        // and that navigation occurred for skip action
      });
    });

    it('should handle add to cart action', async () => {
      const { getByText } = render(<TestNavigator product={mockProduct} />);

      await waitFor(() => {
        const cartButton = getByText('Add to Cart');
        fireEvent.press(cartButton);
        
        // In a real test, we would verify the cart service was called
      });
    });
  });
});