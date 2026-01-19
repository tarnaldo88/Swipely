import React, { memo, useCallback } from 'react';
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
  const renderCard = useCallback((product: ProductCard, index: number) => {
    const isTopCard = index === currentCardIndex;
    // Only render current card + 2 ahead (not 3) to reduce rendering overhead
    const isVisible = index >= currentCardIndex && index < currentCardIndex + 2;
    
    if (!isVisible) return null;

    const zIndex = Math.min(products.length - index, 100);
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
  }, [currentCardIndex, products.length, userId, onSwipeLeft, onSwipeRight, onAddToCart, onViewDetails]);

  return (
    <View style={FeedScreenStyles.cardsContainer}>
      {products.map((product, index) => renderCard(product, index))}
    </View>
  );
});

CardsContainer.displayName = 'CardsContainer';
