import React, { memo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { FeedScreenStyles } from '../../screens/Styles/ProductStyles';

interface FeedHeaderProps {
  remainingProducts: number;
  hasMoreCards: boolean;
  onShowSkippedProducts: () => void;
}

/**
 * Separated header component to prevent re-renders of entire feed
 * Only re-renders when remainingProducts or hasMoreCards changes
 */
export const FeedHeader = memo<FeedHeaderProps>(({
  remainingProducts,
  hasMoreCards,
  onShowSkippedProducts,
}) => {
  const handleSkippedPress = useCallback(() => {
    onShowSkippedProducts();
  }, [onShowSkippedProducts]);

  return (
    <View style={FeedScreenStyles.header}>
      <View style={FeedScreenStyles.headerContent}>
        <View style={FeedScreenStyles.headerLeft}>
          <Text style={FeedScreenStyles.headerTitle}>Discover</Text>
          <Text style={FeedScreenStyles.headerSubtitle}>
            {hasMoreCards 
              ? `${remainingProducts} products to explore`
              : 'All caught up!'
            }
          </Text>
        </View>
        <TouchableOpacity 
          style={FeedScreenStyles.skippedButton} 
          onPress={handleSkippedPress}
          activeOpacity={0.7}
        >
          <Text style={FeedScreenStyles.skippedButtonIcon}>↻</Text>
          <Text style={FeedScreenStyles.skippedButtonText}>View Skipped</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

FeedHeader.displayName = 'FeedHeader';
