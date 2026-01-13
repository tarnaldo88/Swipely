import React, { memo, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { FeedScreenStyles } from '../../screens/Styles/ProductStyles';

interface SkippedProductsModalProps {
  visible: boolean;
  skippedCategories: { category: string; count: number }[];
  onClose: () => void;
  onCategorySelect: (category: string) => void;
}

/**
 * Separated modal component to prevent re-renders of main feed
 * Only re-renders when its own props change
 */
export const SkippedProductsModal = memo<SkippedProductsModalProps>(({
  visible,
  skippedCategories,
  onClose,
  onCategorySelect,
}) => {
  const handleCategoryPress = useCallback((category: string) => {
    onClose();
    onCategorySelect(category);
  }, [onClose, onCategorySelect]);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={FeedScreenStyles.modalOverlay}>
        <View style={FeedScreenStyles.modalContent}>
          <View style={FeedScreenStyles.modalHeader}>
            <Text style={FeedScreenStyles.modalTitle}>Review Skipped Products</Text>
            <TouchableOpacity 
              style={FeedScreenStyles.modalCloseButton}
              onPress={onClose}
            >
              <Text style={FeedScreenStyles.modalCloseButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          {skippedCategories.length === 0 ? (
            <View style={FeedScreenStyles.modalEmptyContainer}>
              <Text style={FeedScreenStyles.modalEmptyText}>No skipped products yet</Text>
              <Text style={FeedScreenStyles.modalEmptySubtext}>
                Products you skip will appear here organized by category
              </Text>
            </View>
          ) : (
            <FlatList
              data={skippedCategories}
              keyExtractor={(item) => item.category}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={FeedScreenStyles.categoryItem}
                  onPress={() => handleCategoryPress(item.category)}
                >
                  <View style={FeedScreenStyles.categoryInfo}>
                    <Text style={FeedScreenStyles.categoryName}>
                      {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                    </Text>
                    <Text style={FeedScreenStyles.categoryCount}>
                      {item.count} skipped product{item.count !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  <Text style={FeedScreenStyles.categoryChevron}>›</Text>
                </TouchableOpacity>
              )}
              style={FeedScreenStyles.categoriesList}
            />
          )}
        </View>
      </View>
    </Modal>
  );
});

SkippedProductsModal.displayName = 'SkippedProductsModal';
