import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StatusBar,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { getWishlistService, WishlistService, WishlistItem } from '../../services/WishlistService';
import { getCartService, CartService } from '../../services/CartService';
import { ProductCard, MainStackParamList } from '../../types';
import { WishListStyles } from '../Styles/ProductStyles';

interface WishlistItemWithProduct extends WishlistItem {
  product: ProductCard;
}

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 48) / 2; // 2 columns with margins

type WishlistScreenNavigationProp = StackNavigationProp<MainStackParamList>;

export const WishlistScreen: React.FC = () => {
  const navigation = useNavigation<WishlistScreenNavigationProp>();
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

  const handleViewDetails = (item: WishlistItemWithProduct) => {
    navigation.navigate('ProductDetails', {
      productId: item.productId,
      product: item.product,
    });
  };

  const renderGridItem = ({ item }: { item: WishlistItemWithProduct }) => (
    <TouchableOpacity 
      style={WishListStyles.gridItem}
      onPress={() => handleViewDetails(item)}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: item.product.imageUrls[0] }}
        style={WishListStyles.gridImage}
        resizeMode="cover"
      />
      <View style={WishListStyles.gridItemInfo}>
        <Text style={WishListStyles.gridItemTitle} numberOfLines={2}>
          {item.product.title}
        </Text>
        <Text style={WishListStyles.gridItemPrice}>
          {item.product.currency} {item.product.price.toFixed(2)}
        </Text>
        <View style={WishListStyles.gridItemActions}>
          <TouchableOpacity
            style={WishListStyles.addToCartButton}
            onPress={(e) => {
              e.stopPropagation();
              handleAddToCart(item.productId);
            }}
          >
            <Text style={WishListStyles.addToCartButtonText}>Add to Cart</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={WishListStyles.removeButton}
            onPress={(e) => {
              e.stopPropagation();
              handleRemoveFromWishlist(item.productId);
            }}
          >
            <Text style={WishListStyles.removeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderListItem = ({ item }: { item: WishlistItemWithProduct }) => (
    <TouchableOpacity 
      style={WishListStyles.listItem}
      onPress={() => handleViewDetails(item)}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: item.product.imageUrls[0] }}
        style={WishListStyles.listImage}
        resizeMode="cover"
      />
      <View style={WishListStyles.listItemInfo}>
        <Text style={WishListStyles.listItemTitle} numberOfLines={2}>
          {item.product.title}
        </Text>
        <Text style={WishListStyles.listItemPrice}>
          {item.product.currency} {item.product.price.toFixed(2)}
        </Text>
        <Text style={WishListStyles.addedDate}>
          Added {item.addedAt.toLocaleDateString()}
        </Text>
      </View>
      <View style={WishListStyles.listItemActions}>
        <TouchableOpacity
          style={WishListStyles.listAddToCartButton}
          onPress={(e) => {
            e.stopPropagation();
            handleAddToCart(item.productId);
          }}
        >
          <Text style={WishListStyles.listAddToCartButtonText}>Add to Cart</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={WishListStyles.listRemoveButton}
          onPress={(e) => {
            e.stopPropagation();
            handleRemoveFromWishlist(item.productId);
          }}
        >
          <Text style={WishListStyles.removeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyWishlist = () => (
    <View style={WishListStyles.emptyContainer}>
      <Text style={WishListStyles.emptyTitle}>💖 Your wishlist is empty</Text>
      <Text style={WishListStyles.emptyDescription}>
        Swipe right on products in the feed to add them to your wishlist!
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={WishListStyles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={WishListStyles.loadingContainer}>
          <Text style={WishListStyles.loadingText}>Loading wishlist...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={WishListStyles.backgroundContainer}>
      <SafeAreaView style={WishListStyles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={WishListStyles.header}>
        <Text style={WishListStyles.headerTitle}>Wishlist</Text>
        <View style={WishListStyles.headerActions}>
          {wishlistItems.length > 0 && (
            <>
              <Text style={WishListStyles.itemCount}>{wishlistItems.length} items</Text>
              <TouchableOpacity
                style={WishListStyles.viewModeButton}
                onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              >
                <Text style={WishListStyles.viewModeButtonText}>
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
        contentContainerStyle={wishlistItems.length === 0 ? WishListStyles.emptyListContainer : WishListStyles.listContainer}
        ListEmptyComponent={renderEmptyWishlist}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
      </SafeAreaView>
    </View>
  );
};