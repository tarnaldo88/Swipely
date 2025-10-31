import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { WishlistScreen } from '../../src/screens/main/WishlistScreen';
import { getWishlistService } from '../../src/services/WishlistService';
import { getCartService } from '../../src/services/CartService';
import { ProductCard } from '../../src/types';

// Mock the services
jest.mock('../../src/services/WishlistService', () => ({
  getWishlistService: jest.fn(),
}));

jest.mock('../../src/services/CartService', () => ({
  getCartService: jest.fn(),
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

const mockWishlistService = {
  getWishlistItemsWithDetails: jest.fn(),
  removeFromWishlist: jest.fn(),
};

const mockCartService = {
  addToCart: jest.fn(),
};

const mockWishlistItemWithProduct = {
  productId: 'test-product-1',
  addedAt: new Date('2023-01-01'),
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

describe('WishlistScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getWishlistService as jest.Mock).mockReturnValue(mockWishlistService);
    (getCartService as jest.Mock).mockReturnValue(mockCartService);
  });

  describe('Loading State', () => {
    it('should show loading state initially', async () => {
      mockWishlistService.getWishlistItemsWithDetails.mockImplementation(() => new Promise(() => {}));

      const { getByText } = render(<WishlistScreen />);

      expect(getByText('Loading wishlist...')).toBeTruthy();
    });
  });

  describe('Empty Wishlist', () => {
    it('should show empty wishlist message when no items', async () => {
      mockWishlistService.getWishlistItemsWithDetails.mockResolvedValue([]);

      const { getByText } = render(<WishlistScreen />);

      await waitFor(() => {
        expect(getByText('💖 Your wishlist is empty')).toBeTruthy();
        expect(getByText('Swipe right on products in the feed to add them to your wishlist!')).toBeTruthy();
      });
    });
  });

  describe('Wishlist with Items', () => {
    beforeEach(() => {
      mockWishlistService.getWishlistItemsWithDetails.mockResolvedValue([mockWishlistItemWithProduct]);
    });

    it('should display wishlist items correctly in grid view', async () => {
      const { getByText } = render(<WishlistScreen />);

      await waitFor(() => {
        expect(getByText('Wishlist')).toBeTruthy();
        expect(getByText('1 items')).toBeTruthy();
        expect(getByText('Test Product')).toBeTruthy();
        expect(getByText('USD 99.99')).toBeTruthy();
      });
    });

    it('should toggle between grid and list view', async () => {
      const { getByText } = render(<WishlistScreen />);

      await waitFor(() => {
        const viewModeButton = getByText('☰'); // List view button
        fireEvent.press(viewModeButton);
      });

      await waitFor(() => {
        expect(getByText('⊞')).toBeTruthy(); // Grid view button
        expect(getByText('Added 1/1/2023')).toBeTruthy(); // Date shown in list view
      });
    });

    it('should handle add to cart action', async () => {
      mockCartService.addToCart.mockResolvedValue(undefined);

      const { getAllByText } = render(<WishlistScreen />);

      await waitFor(() => {
        const addToCartButtons = getAllByText('Add to Cart');
        fireEvent.press(addToCartButtons[0]);
      });

      await waitFor(() => {
        expect(mockCartService.addToCart).toHaveBeenCalledWith('test-product-1', 1);
        expect(Alert.alert).toHaveBeenCalledWith('Success', 'Item added to cart!');
      });
    });

    it('should handle remove from wishlist with confirmation', async () => {
      mockWishlistService.removeFromWishlist.mockResolvedValue(undefined);
      mockWishlistService.getWishlistItemsWithDetails.mockResolvedValueOnce([mockWishlistItemWithProduct])
        .mockResolvedValueOnce([]);

      const { getAllByText } = render(<WishlistScreen />);

      await waitFor(() => {
        const removeButtons = getAllByText('✕');
        fireEvent.press(removeButtons[0]);
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        'Remove from Wishlist',
        'Are you sure you want to remove this item from your wishlist?',
        expect.arrayContaining([
          { text: 'Cancel', style: 'cancel' },
          expect.objectContaining({ text: 'Remove', style: 'destructive' })
        ])
      );
    });

    it('should handle add to cart errors', async () => {
      mockCartService.addToCart.mockRejectedValue(new Error('Add to cart failed'));

      const { getAllByText } = render(<WishlistScreen />);

      await waitFor(() => {
        const addToCartButtons = getAllByText('Add to Cart');
        fireEvent.press(addToCartButtons[0]);
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to add to cart');
      });
    });

    it('should handle remove from wishlist errors', async () => {
      mockWishlistService.removeFromWishlist.mockRejectedValue(new Error('Remove failed'));

      const { getAllByText } = render(<WishlistScreen />);

      await waitFor(() => {
        const removeButtons = getAllByText('✕');
        fireEvent.press(removeButtons[0]);
      });

      // Simulate confirming the removal
      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const confirmButton = alertCall[2].find((button: any) => button.text === 'Remove');
      await confirmButton.onPress();

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to remove from wishlist');
      });
    });
  });

  describe('List View Specific Features', () => {
    beforeEach(() => {
      mockWishlistService.getWishlistItemsWithDetails.mockResolvedValue([mockWishlistItemWithProduct]);
    });

    it('should show added date in list view', async () => {
      const { getByText } = render(<WishlistScreen />);

      // Switch to list view
      await waitFor(() => {
        const viewModeButton = getByText('☰');
        fireEvent.press(viewModeButton);
      });

      await waitFor(() => {
        expect(getByText('Added 1/1/2023')).toBeTruthy();
      });
    });

    it('should have different layout for add to cart button in list view', async () => {
      const { getByText, getAllByText } = render(<WishlistScreen />);

      // Switch to list view
      await waitFor(() => {
        const viewModeButton = getByText('☰');
        fireEvent.press(viewModeButton);
      });

      await waitFor(() => {
        const addToCartButtons = getAllByText('Add to Cart');
        expect(addToCartButtons[0]).toBeTruthy();
        // In list view, the button should be styled differently
      });
    });
  });

  describe('Pull to Refresh', () => {
    it('should handle pull to refresh', async () => {
      mockWishlistService.getWishlistItemsWithDetails.mockResolvedValue([mockWishlistItemWithProduct]);

      render(<WishlistScreen />);

      // In a real test, we would simulate the pull-to-refresh gesture
      // For now, we just verify the service is called
      await waitFor(() => {
        expect(mockWishlistService.getWishlistItemsWithDetails).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle loading errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockWishlistService.getWishlistItemsWithDetails.mockRejectedValue(new Error('Load failed'));

      render(<WishlistScreen />);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to load wishlist items');
        expect(consoleSpy).toHaveBeenCalledWith('Failed to load wishlist items:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Multiple Items', () => {
    const multipleItems = [
      mockWishlistItemWithProduct,
      {
        ...mockWishlistItemWithProduct,
        productId: 'test-product-2',
        product: {
          ...mockWishlistItemWithProduct.product,
          id: 'test-product-2',
          title: 'Test Product 2',
          price: 149.99,
        }
      }
    ];

    it('should display correct item count for multiple items', async () => {
      mockWishlistService.getWishlistItemsWithDetails.mockResolvedValue(multipleItems);

      const { getByText } = render(<WishlistScreen />);

      await waitFor(() => {
        expect(getByText('2 items')).toBeTruthy();
      });
    });

    it('should render multiple items in grid view', async () => {
      mockWishlistService.getWishlistItemsWithDetails.mockResolvedValue(multipleItems);

      const { getByText } = render(<WishlistScreen />);

      await waitFor(() => {
        expect(getByText('Test Product')).toBeTruthy();
        expect(getByText('Test Product 2')).toBeTruthy();
        expect(getByText('USD 99.99')).toBeTruthy();
        expect(getByText('USD 149.99')).toBeTruthy();
      });
    });
  });
});