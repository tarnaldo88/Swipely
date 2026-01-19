import React, { memo, useCallback, useMemo } from 'react';
import {
  View,
} from 'react-native';
import { MouseSwipeableCard } from '../product/MouseSwipeableCard';
import { ProductCard } from '../../types';
import { FeedScreenStyles } from '../../screens/Styles/ProductStyles';

interface CardsContainerProps {
  products: ProductCard[];
  currentCardIndex: number;
  userId: string;
  onSwipeLeft: (productId: string) => void;
  onSwipeRight: (productId: string) => void;
  onAddToCart: (productId: string) => void;
  onViewDetails: (productId: string) => void;
}

/**
 * Individual card wrapper with memo to prevent re-renders
 */
const CardWrapper = memo<{
  product: ProductCard;
  index: number;
  currentCardIndex: number;
  productsLength: number;
  userId: string;
  onSwipeLeft: (productId: string) => void;
  onSwipeRight: (productId: string) => void;
  onAddToCart: (productId: string) => void;
  onViewDetails: (productId: string) => void;
}>(({ product, index, currentCardIndex, productsLength, userId, onSwipeLeft, onSwipeRight, onAddToCart, onViewDetails }) => {
  const isTopCard = index === currentCardIndex;
  const isVisible = index >= currentCardIndex && index < currentCardIndex + 2;
  
  if (!isVisible) return null;

  const zIndex = Math.min(productsLength - index, 100);
  const scale = isTopCard ? 1 : 0.95 - (index - currentCardIndex) * 0.02;
  const translateY = (index - currentCardIndex) * 8;

  return (
    <View
      key={product.id}
      style={[
        FeedScreenStyles.cardWrapper,
        {
          zIndex,
          transform: [
            { scale },
            { translateY },
          ],
        },
      ]}
    >
      <MouseSwipeableCard
        product={product}
        userId={userId}
        onSwipeLeft={onSwipeLeft}
        onSwipeRight={onSwipeRight}
        onAddToCart={onAddToCart}
        onViewDetails={onViewDetails}
        isTopCard={isTopCard}
      />
    </View>
  );
}, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  return (
    prevProps.product.id === nextProps.product.id &&
    prevProps.index === nextProps.index &&
    prevProps.currentCardIndex === nextProps.currentCardIndex &&
    prevProps.productsLength === nextProps.productsLength
  );
});

CardWrapper.displayName = 'CardWrapper';

/**
 * Separated cards container to prevent re-renders of entire feed
 * Only re-renders when products or currentCardIndex changes
 * Optimized to render only visible cards + 1 ahead for smooth transitions
 */
export const CardsContainer = memo<CardsContainerProps>(({
  products,
  currentCardIndex,
  userId,
  onSwipeLeft,
  onSwipeRight,
  onAddToCart,
  onViewDetails,
}) => {
  // Memoize visible products to prevent unnecessary calculations
  const visibleProducts = useMemo(() => {
    return products.slice(currentCardIndex, currentCardIndex + 2);
  }, [products, currentCardIndex]);

  return (
    <View style={FeedScreenStyles.cardsContainer}>
      {visibleProducts.map((product, relativeIndex) => {
        const absoluteIndex = currentCardIndex + relativeIndex;
        return (
          <CardWrapper
            key={product.id}
            product={product}
            index={absoluteIndex}
            currentCardIndex={currentCardIndex}
            productsLength={products.length}
            userId={userId}
            onSwipeLeft={onSwipeLeft}
            onSwipeRight={onSwipeRight}
            onAddToCart={onAddToCart}
            onViewDetails={onViewDetails}
          />
        );
      })}
    </View>
  );
});

CardsContainer.displayName = 'CardsContainer';
