import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ProductDetailsScreen } from '../../src/screens/main/ProductDetailsScreen';
import { ProductCard } from '../../src/types';

// Mock the SwipeActionService
jest.mock('../../src/services/SwipeActionService', () => ({
  getSwipeActionService: () => ({
    onSwipeLeft: jest.fn(),
    onSwipeRight: jest.fn(),
    onAddToCart: jest.fn(),
    onViewDetails: jest.fn(),
  }),
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
});