import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { SwipeableCard } from '../../src/components/product/SwipeableCard';
import { ProductCard } from '../../src/types';
import * as SwipeActionService from '../../src/services/SwipeActionService';



// Mock SwipeActionService
const mockSwipeActionService = {
  onSwipeLeft: jest.fn(),
  onSwipeRight: jest.fn(),
  onAddToCart: jest.fn(),
  onViewDetails: jest.fn(),
};

jest.spyOn(SwipeActionService, 'getSwipeActionService').mockReturnValue(mockSwipeActionService as any);

describe('SwipeableCard', () => {
  const mockProduct: ProductCard = {
    id: 'test-product-1',
    title: 'Test Product',
    price: 29.99,
    currency: '$',
    imageUrls: ['https://example.com/image.jpg'],
    category: {
      id: 'cat-1',
      name: 'Electronics',
    },
    description: 'A test product',
    specifications: {},
    availability: true,
  };

  const defaultProps = {
    product: mockProduct,
    userId: 'test-user-1',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render product information correctly', () => {
      const { getByText } = render(<SwipeableCard {...defaultProps} />);
      
      expect(getByText('Test Product')).toBeTruthy();
      expect(getByText('$29.99')).toBeTruthy();
      expect(getByText('Electronics')).toBeTruthy();
    });

    it('should render action buttons', () => {
      const { getByText } = render(<SwipeableCard {...defaultProps} />);
      
      expect(getByText('Skip')).toBeTruthy();
      expect(getByText('Add to Cart')).toBeTruthy();
      expect(getByText('Like')).toBeTruthy();
      expect(getByText('View Details')).toBeTruthy();
    });

    it('should show out of stock message when product is unavailable', () => {
      const unavailableProduct = { ...mockProduct, availability: false };
      const { getByText } = render(
        <SwipeableCard {...defaultProps} product={unavailableProduct} />
      );
      
      expect(getByText('Out of Stock')).toBeTruthy();
      expect(getByText('Out of Stock')).toBeTruthy(); // Button text changes too
    });
  });

  describe('Button Interactions', () => {
    it('should handle skip button press', async () => {
      const onSwipeLeft = jest.fn();
      const { getByText } = render(
        <SwipeableCard {...defaultProps} onSwipeLeft={onSwipeLeft} />
      );
      
      fireEvent.press(getByText('Skip'));
      
      await waitFor(() => {
        expect(mockSwipeActionService.onSwipeLeft).toHaveBeenCalledWith('test-product-1');
        expect(onSwipeLeft).toHaveBeenCalledWith('test-product-1');
      });
    });

    it('should handle like button press', async () => {
      const onSwipeRight = jest.fn();
      const { getByText } = render(
        <SwipeableCard {...defaultProps} onSwipeRight={onSwipeRight} />
      );
      
      fireEvent.press(getByText('Like'));
      
      await waitFor(() => {
        expect(mockSwipeActionService.onSwipeRight).toHaveBeenCalledWith('test-product-1');
        expect(onSwipeRight).toHaveBeenCalledWith('test-product-1');
      });
    });

    it('should handle add to cart button press', async () => {
      const onAddToCart = jest.fn();
      const { getByText } = render(
        <SwipeableCard {...defaultProps} onAddToCart={onAddToCart} />
      );
      
      fireEvent.press(getByText('Add to Cart'));
      
      await waitFor(() => {
        expect(mockSwipeActionService.onAddToCart).toHaveBeenCalledWith('test-product-1');
        expect(onAddToCart).toHaveBeenCalledWith('test-product-1');
      });
    });

    it('should handle view details button press', async () => {
      const onViewDetails = jest.fn();
      const { getByText } = render(
        <SwipeableCard {...defaultProps} onViewDetails={onViewDetails} />
      );
      
      fireEvent.press(getByText('View Details'));
      
      await waitFor(() => {
        expect(mockSwipeActionService.onViewDetails).toHaveBeenCalledWith('test-product-1');
        expect(onViewDetails).toHaveBeenCalledWith('test-product-1');
      });
    });

    it('should handle card press for view details', async () => {
      const onViewDetails = jest.fn();
      const { getByText } = render(
        <SwipeableCard {...defaultProps} onViewDetails={onViewDetails} />
      );
      
      // Press on the product title (part of the card)
      fireEvent.press(getByText('Test Product'));
      
      await waitFor(() => {
        expect(mockSwipeActionService.onViewDetails).toHaveBeenCalledWith('test-product-1');
        expect(onViewDetails).toHaveBeenCalledWith('test-product-1');
      });
    });
  });

  describe('Disabled States', () => {
    it('should disable add to cart button when product is unavailable', () => {
      const unavailableProduct = { ...mockProduct, availability: false };
      const onAddToCart = jest.fn();
      const { getByText } = render(
        <SwipeableCard {...defaultProps} product={unavailableProduct} onAddToCart={onAddToCart} />
      );
      
      fireEvent.press(getByText('Out of Stock'));
      
      // Should not call the handler when disabled
      expect(onAddToCart).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle swipe action service errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockSwipeActionService.onSwipeLeft.mockRejectedValueOnce(new Error('Service error'));
      
      const { getByText } = render(<SwipeableCard {...defaultProps} />);
      
      fireEvent.press(getByText('Skip'));
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error handling swipe:', expect.any(Error));
      });
      
      consoleSpy.mockRestore();
    });

    it('should handle add to cart errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockSwipeActionService.onAddToCart.mockRejectedValueOnce(new Error('Cart error'));
      
      const { getByText } = render(<SwipeableCard {...defaultProps} />);
      
      fireEvent.press(getByText('Add to Cart'));
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error handling add to cart:', expect.any(Error));
      });
      
      consoleSpy.mockRestore();
    });
  });

  describe('SwipeActionService Integration', () => {
    it('should initialize SwipeActionService with correct userId', () => {
      render(<SwipeableCard {...defaultProps} />);
      
      expect(SwipeActionService.getSwipeActionService).toHaveBeenCalledWith('test-user-1');
    });

    it('should call SwipeActionService methods with correct parameters', async () => {
      const { getByText } = render(<SwipeableCard {...defaultProps} />);
      
      fireEvent.press(getByText('Skip'));
      fireEvent.press(getByText('Like'));
      
      await waitFor(() => {
        expect(mockSwipeActionService.onSwipeLeft).toHaveBeenCalledWith('test-product-1');
        expect(mockSwipeActionService.onSwipeRight).toHaveBeenCalledWith('test-product-1');
      });
    });
  });
});