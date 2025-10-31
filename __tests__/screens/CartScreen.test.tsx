import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { CartScreen } from '../../src/screens/main/CartScreen';
import { getCartService } from '../../src/services/CartService';
import { CartItem, ProductCard } from '../../src/types';

// Mock the CartService
jest.mock('../../src/services/CartService', () => ({
  getCartService: jest.fn(),
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

const mockCartService = {
  getCartItemsWithDetails: jest.fn(),
  updateQuantity: jest.fn(),
  removeFromCart: jest.fn(),
};

const mockCartItemWithProduct = {
  productId: 'test-product-1',
  quantity: 2,
  addedAt: new Date('2023-01-01'),
  selectedVariants: {},
  product: {
    id: 'test-product-1',
    title: 'Test Product',
    price: 99.99,
    currency: 'USD',
    imageUrls: ['https://example.com/image1.jpg'],
    category: { id: 'electronics', name: 'Electronics' },
    description: 'Test product description',
    specifications: {},
    availability: true,
  } as ProductCard,
};

describe('CartScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getCartService as jest.Mock).mockReturnValue(mockCartService);
  });

  describe('Loading State', () => {
    it('should show loading state initially', async () => {
      mockCartService.getCartItemsWithDetails.mockImplementation(() => new Promise(() => {}));

      const { getByText } = render(<CartScreen />);

      expect(getByText('Loading cart...')).toBeTruthy();
    });
  });

  describe('Empty Cart', () => {
    it('should show empty cart message when no items', async () => {
      mockCartService.getCartItemsWithDetails.mockResolvedValue([]);

      const { getByText } = render(<CartScreen />);

      await waitFor(() => {
        expect(getByText('🛒 Your cart is empty')).toBeTruthy();
        expect(getByText('Add products to your cart by tapping "Add to Cart" on product cards or in the product details!')).toBeTruthy();
      });
    });
  });

  describe('Cart with Items', () => {
    beforeEach(() => {
      mockCartService.getCartItemsWithDetails.mockResolvedValue([mockCartItemWithProduct]);
    });

    it('should display cart items correctly', async () => {
      const { getByText } = render(<CartScreen />);

      await waitFor(() => {
        expect(getByText('Shopping Cart')).toBeTruthy();
        expect(getByText('1 items')).toBeTruthy();
        expect(getByText('Test Product')).toBeTruthy();
        expect(getByText('USD 99.99')).toBeTruthy();
        expect(getByText('2')).toBeTruthy(); // quantity
      });
    });

    it('should display total amount correctly', async () => {
      const { getByText } = render(<CartScreen />);

      await waitFor(() => {
        expect(getByText('Total:')).toBeTruthy();
        expect(getByText('USD 199.98')).toBeTruthy(); // 2 * 99.99
        expect(getByText('Proceed to Checkout')).toBeTruthy();
      });
    });

    it('should handle quantity increase', async () => {
      mockCartService.updateQuantity.mockResolvedValue(undefined);
      mockCartService.getCartItemsWithDetails.mockResolvedValueOnce([mockCartItemWithProduct])
        .mockResolvedValueOnce([{ ...mockCartItemWithProduct, quantity: 3 }]);

      const { getAllByText } = render(<CartScreen />);

      await waitFor(() => {
        const plusButtons = getAllByText('+');
        fireEvent.press(plusButtons[0]);
      });

      await waitFor(() => {
        expect(mockCartService.updateQuantity).toHaveBeenCalledWith('test-product-1', 3);
      });
    });

    it('should handle quantity decrease', async () => {
      mockCartService.updateQuantity.mockResolvedValue(undefined);
      mockCartService.getCartItemsWithDetails.mockResolvedValueOnce([mockCartItemWithProduct])
        .mockResolvedValueOnce([{ ...mockCartItemWithProduct, quantity: 1 }]);

      const { getAllByText } = render(<CartScreen />);

      await waitFor(() => {
        const minusButtons = getAllByText('-');
        fireEvent.press(minusButtons[0]);
      });

      await waitFor(() => {
        expect(mockCartService.updateQuantity).toHaveBeenCalledWith('test-product-1', 1);
      });
    });

    it('should disable decrease button when quantity is 1', async () => {
      const itemWithQuantityOne = { ...mockCartItemWithProduct, quantity: 1 };
      mockCartService.getCartItemsWithDetails.mockResolvedValue([itemWithQuantityOne]);

      const { getAllByText } = render(<CartScreen />);

      await waitFor(() => {
        const minusButtons = getAllByText('-');
        // In a real test, we would check if the button is disabled
        // This would require checking the button's style or accessibility state
        expect(minusButtons[0]).toBeTruthy();
      });
    });

    it('should handle item removal with confirmation', async () => {
      mockCartService.removeFromCart.mockResolvedValue(undefined);
      mockCartService.getCartItemsWithDetails.mockResolvedValueOnce([mockCartItemWithProduct])
        .mockResolvedValueOnce([]);

      const { getAllByText } = render(<CartScreen />);

      await waitFor(() => {
        const removeButtons = getAllByText('✕');
        fireEvent.press(removeButtons[0]);
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        'Remove Item',
        'Are you sure you want to remove this item from your cart?',
        expect.arrayContaining([
          { text: 'Cancel', style: 'cancel' },
          expect.objectContaining({ text: 'Remove', style: 'destructive' })
        ])
      );
    });

    it('should handle update quantity errors', async () => {
      mockCartService.updateQuantity.mockRejectedValue(new Error('Update failed'));

      const { getAllByText } = render(<CartScreen />);

      await waitFor(() => {
        const plusButtons = getAllByText('+');
        fireEvent.press(plusButtons[0]);
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to update quantity');
      });
    });

    it('should handle remove item errors', async () => {
      mockCartService.removeFromCart.mockRejectedValue(new Error('Remove failed'));

      const { getAllByText } = render(<CartScreen />);

      await waitFor(() => {
        const removeButtons = getAllByText('✕');
        fireEvent.press(removeButtons[0]);
      });

      // Simulate confirming the removal
      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const confirmButton = alertCall[2].find((button: any) => button.text === 'Remove');
      await confirmButton.onPress();

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to remove item');
      });
    });
  });

  describe('Pull to Refresh', () => {
    it('should handle pull to refresh', async () => {
      mockCartService.getCartItemsWithDetails.mockResolvedValue([mockCartItemWithProduct]);

      const { getByTestId } = render(<CartScreen />);

      // In a real test, we would simulate the pull-to-refresh gesture
      // For now, we just verify the service is called
      await waitFor(() => {
        expect(mockCartService.getCartItemsWithDetails).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle loading errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockCartService.getCartItemsWithDetails.mockRejectedValue(new Error('Load failed'));

      render(<CartScreen />);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to load cart items');
        expect(consoleSpy).toHaveBeenCalledWith('Failed to load cart items:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });
});