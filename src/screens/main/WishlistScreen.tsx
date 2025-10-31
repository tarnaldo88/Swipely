import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getWishlistService, WishlistService, WishlistItem } from '../../services/WishlistService';
import { getCartService, CartService } from '../../services/CartService';
import { ProductCard } from '../../types';

interface WishlistItemWithProduct extends WishlistItem {
  product: ProductCard;
}

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 48) / 2; // 2 columns with margins

export const WishlistScreen: React.FC = () => {
  const [wishlistItems, setWishlistItems] = useState<WishlistItemWithProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const wishlistService: WishlistService = getWishlistService();
  const cartService: CartService = getCartService();

  const loadWishlistItems = useCallback(async () => {
    try {
      console.log('Loading wishlist items...');
      const items = await wishlistService.getWishlistItemsWithDetails();
      console.log('Loaded wishlist items:', items.length);
      console.log('Wishlist items:', items.map(item => ({ id: item.productId, title: item.product.title })));
      setWishlistItems(items);
    } catch (error) {
      console.error('Failed to load wishlist items:', error);
      Alert.alert('Error', 'Failed to load wishlist items');
    } finally {
      setLoading(false);
    }
  }, [wishlistService]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadWishlistItems();
    setRefreshing(false);
  }, [loadWishlistItems]);

  useEffect(() => {
    loadWishlistItems();
  }, [loadWishlistItems]);

  // Reload wishlist when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('WishlistScreen focused, reloading items...');
      loadWishlistItems();
    }, [loadWishlistItems])
  );

  const handleRemoveFromWishlist = async (productId: string) => {
    Alert.alert(
      'Remove from Wishlist',
      'Are you sure you want to remove this item from your wishlist?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await wishlistService.removeFromWishlist(productId);
              await loadWishlistItems();
            } catch (error) {
              console.error('Failed to remove from wishlist:', error);
              Alert.alert('Error', 'Failed to remove from wishlist');
            }
          },
        },
      ]
    );
  };

  const handleAddToCart = async (productId: string) => {
    try {
      await cartService.addToCart(productId, 1);
      Alert.alert('Success', 'Item added to cart!');
    } catch (error) {
      console.error('Failed to add to cart:', error);
      Alert.alert('Error', 'Failed to add to cart');
    }
  };

  const renderGridItem = ({ item }: { item: WishlistItemWithProduct }) => (
    <View style={styles.gridItem}>
      <Image
        source={{ uri: item.product.imageUrls[0] }}
        style={styles.gridImage}
        resizeMode="cover"
      />
      <View style={styles.gridItemInfo}>
        <Text style={styles.gridItemTitle} numberOfLines={2}>
          {item.product.title}
        </Text>
        <Text style={styles.gridItemPrice}>
          {item.product.currency} {item.product.price.toFixed(2)}
        </Text>
        <View style={styles.gridItemActions}>
          <TouchableOpacity
            style={styles.addToCartButton}
            onPress={() => handleAddToCart(item.productId)}
          >
            <Text style={styles.addToCartButtonText}>Add to Cart</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveFromWishlist(item.productId)}
          >
            <Text style={styles.removeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderListItem = ({ item }: { item: WishlistItemWithProduct }) => (
    <View style={styles.listItem}>
      <Image
        source={{ uri: item.product.imageUrls[0] }}
        style={styles.listImage}
        resizeMode="cover"
      />
      <View style={styles.listItemInfo}>
        <Text style={styles.listItemTitle} numberOfLines={2}>
          {item.product.title}
        </Text>
        <Text style={styles.listItemPrice}>
          {item.product.currency} {item.product.price.toFixed(2)}
        </Text>
        <Text style={styles.addedDate}>
          Added {item.addedAt.toLocaleDateString()}
        </Text>
      </View>
      <View style={styles.listItemActions}>
        <TouchableOpacity
          style={styles.listAddToCartButton}
          onPress={() => handleAddToCart(item.productId)}
        >
          <Text style={styles.listAddToCartButtonText}>Add to Cart</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.listRemoveButton}
          onPress={() => handleRemoveFromWishlist(item.productId)}
        >
          <Text style={styles.removeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyWishlist = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>💖 Your wishlist is empty</Text>
      <Text style={styles.emptyDescription}>
        Swipe right on products in the feed to add them to your wishlist!
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading wishlist...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Wishlist</Text>
        <View style={styles.headerActions}>
          {wishlistItems.length > 0 && (
            <>
              <Text style={styles.itemCount}>{wishlistItems.length} items</Text>
              <TouchableOpacity
                style={styles.viewModeButton}
                onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              >
                <Text style={styles.viewModeButtonText}>
                  {viewMode === 'grid' ? '☰' : '⊞'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
      
      <FlatList
        data={wishlistItems}
        renderItem={viewMode === 'grid' ? renderGridItem : renderListItem}
        keyExtractor={(item) => item.productId}
        numColumns={viewMode === 'grid' ? 2 : 1}
        key={viewMode} // Force re-render when view mode changes
        contentContainerStyle={wishlistItems.length === 0 ? styles.emptyListContainer : styles.listContainer}
        ListEmptyComponent={renderEmptyWishlist}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#221e27',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6C757D',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#221e27',
    borderBottomWidth: 1,
    borderBottomColor: '#221e27',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f6f9fdff',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemCount: {
    fontSize: 14,
    color: '#eaf0f5ff',
    marginRight: 12,
  },
  viewModeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E9ECEF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewModeButtonText: {
    fontSize: 16,
    color: '#d3d9dfff',
  },
  listContainer: {
    paddingVertical: 8,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyContainer: {
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#f4faffff',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    color: '#d9e0e6ff',
    textAlign: 'center',
    lineHeight: 24,
  },
  // Grid view styles
  gridItem: {
    width: ITEM_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    margin: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  gridImage: {
    width: '100%',
    height: ITEM_WIDTH * 0.8,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    backgroundColor: '#F8F9FA',
  },
  gridItemInfo: {
    padding: 12,
  },
  gridItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
    height: 36,
  },
  gridItemPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007BFF',
    marginBottom: 8,
  },
  gridItemActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addToCartButton: {
    flex: 1,
    backgroundColor: '#08f88c',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  addToCartButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DC3545',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  // List view styles
  listItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  listImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
  },
  listItemInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  listItemPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#00ff15ff',
    marginBottom: 4,
  },
  addedDate: {
    fontSize: 12,
    color: '#6C757D',
  },
  listItemActions: {
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  listAddToCartButton: {
    backgroundColor: '#007BFF',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  listAddToCartButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  listRemoveButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DC3545',
    justifyContent: 'center',
    alignItems: 'center',
  },
});