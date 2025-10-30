import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { AddToCartButton } from '../../src/components/product/AddToCartButton';

describe('AddToCartButton', () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render with default title', () => {
      const { getByText } = render(<AddToCartButton onPress={mockOnPress} />);
      
      expect(getByText('Add to Cart')).toBeTruthy();
    });

    it('should render with custom title', () => {
      const { getByText } = render(
        <AddToCartButton onPress={mockOnPress} title="Custom Title" />
      );
      
      expect(getByText('Custom Title')).toBeTruthy();
    });

    it('should show loading state when loading prop is true', () => {
      const { getByText } = render(
        <AddToCartButton onPress={mockOnPress} loading={true} />
      );
      
      expect(getByText('Adding...')).toBeTruthy();
    });
  });

  describe('Interactions', () => {
    it('should call onPress when button is pressed', () => {
      const { getByText } = render(<AddToCartButton onPress={mockOnPress} />);
      
      fireEvent.press(getByText('Add to Cart'));
      
      expect(mockOnPress).toHaveBeenCalledTimes(1);
    });

    it('should not call onPress when button is disabled', () => {
      const { getByText } = render(
        <AddToCartButton onPress={mockOnPress} disabled={true} />
      );
      
      fireEvent.press(getByText('Add to Cart'));
      
      expect(mockOnPress).not.toHaveBeenCalled();
    });

    it('should not call onPress when button is loading', () => {
      const { getByText } = render(
        <AddToCartButton onPress={mockOnPress} loading={true} />
      );
      
      fireEvent.press(getByText('Adding...'));
      
      expect(mockOnPress).not.toHaveBeenCalled();
    });
  });

  describe('Async Operations', () => {
    it('should handle async onPress function', async () => {
      const asyncOnPress = jest.fn().mockResolvedValue(undefined);
      const { getByText } = render(<AddToCartButton onPress={asyncOnPress} />);
      
      fireEvent.press(getByText('Add to Cart'));
      
      await waitFor(() => {
        expect(asyncOnPress).toHaveBeenCalledTimes(1);
      });
    });

    it('should show internal loading state during async operation', async () => {
      let resolvePromise: () => void;
      const asyncOnPress = jest.fn().mockImplementation(() => {
        return new Promise<void>((resolve) => {
          resolvePromise = resolve;
        });
      });

      const { getByText, queryByText } = render(<AddToCartButton onPress={asyncOnPress} />);
      
      fireEvent.press(getByText('Add to Cart'));
      
      // Should show loading state
      expect(queryByText('Adding...')).toBeTruthy();
      
      // Resolve the promise
      resolvePromise!();
      
      await waitFor(() => {
        expect(queryByText('Add to Cart')).toBeTruthy();
        expect(queryByText('Adding...')).toBeFalsy();
      });
    });

    it('should handle async errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const asyncOnPress = jest.fn().mockRejectedValue(new Error('Async error'));
      
      const { getByText } = render(<AddToCartButton onPress={asyncOnPress} />);
      
      fireEvent.press(getByText('Add to Cart'));
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error in AddToCartButton:', expect.any(Error));
      });
      
      consoleSpy.mockRestore();
    });
  });

  describe('Styling', () => {
    it('should apply custom styles', () => {
      const customStyle = { backgroundColor: 'red' };
      const customTextStyle = { color: 'white' };
      
      const { getByText } = render(
        <AddToCartButton 
          onPress={mockOnPress} 
          style={customStyle}
          textStyle={customTextStyle}
        />
      );
      
      const button = getByText('Add to Cart').parent;
      expect(button).toBeTruthy();
    });

    it('should use custom loading color', () => {
      const { getByText } = render(
        <AddToCartButton 
          onPress={mockOnPress} 
          loading={true}
          loadingColor="#FF0000"
        />
      );
      
      expect(getByText('Adding...')).toBeTruthy();
    });
  });
});