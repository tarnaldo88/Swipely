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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { getCartService, CartService } from '../../services/CartService';
import { CheckoutService } from '../../services/CheckoutService';
import { CartItem, ProductCard, MainStackParamList } from '../../types';
import { CartScreenStyles } from '../Styles/ProductStyles';

interface CartItemWithProduct extends CartItem {
  product: ProductCard;
}

type CartScreenNavigationProp = StackNavigationProp<MainStackParamList>;

export const CartScreen: React.FC = () => {
  const navigation = useNavigation<CartScreenNavigationProp>();
  const [cartItems, setCartItems] = useState<CartItemWithProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const cartService: CartService = getCartService();

  const loadCartItems = useCallback(async () => {
    try {
      console.log('Loading cart items...');
      const items = await cartService.getCartItemsWithDetails();
      console.log('Loaded cart items:', items.length);
      console.log('Cart items:', items.map(item => ({ id: item.productId, title: item.product.title, qty: item.quantity })));
      setCartItems(items);
    } catch (error) {
      console.error('Failed to load cart items:', error);
      Alert.alert('Error', 'Failed to load cart items');
    } finally {
      setLoading(false);
    }
  }, [cartService]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadCartItems();
    setRefreshing(false);
  }, [loadCartItems]);

  useEffect(() => {
    loadCartItems();
  }, [loadCartItems]);

  // Reload cart when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('CartScreen focused, reloading items...');
      loadCartItems();
    }, [loadCartItems])
  );

  const handleUpdateQuantity = async (productId: string, newQuantity: number) => {
    try {
      await cartService.updateQuantity(productId, newQuantity);
      await loadCartItems();
    } catch (error) {
      console.error('Failed to update quantity:', error);
      Alert.alert('Error', 'Failed to update quantity');
    }
  };

  const handleRemoveItem = async (productId: string) => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this item from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await cartService.removeFromCart(productId);
              await loadCartItems();
            } catch (error) {
              console.error('Failed to remove item:', error);
              Alert.alert('Error', 'Failed to remove item');
            }
          },
        },
      ]
    );
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  const handleProceedToCheckout = () => {
    if (cartItems.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to your cart before checkout');
      return;
    }

    try {
      // Convert cart items to checkout format
      const checkoutItems = cartItems.map(item => ({
        productId: item.productId,
        title: item.product.title,
        price: item.product.price,
        quantity: item.quantity,
        imageUrl: item.product.imageUrls[0],
        category: item.product.category.name,
      }));

      // Initialize checkout with cart items
      CheckoutService.initializeCheckout(checkoutItems);

      // Navigate to cart review screen
      navigation.navigate('CartReview');
    } catch (error) {
      console.error('Error initiating checkout:', error);
      Alert.alert('Error', 'Failed to initiate checkout');
    }
  };

  const renderCartItem = ({ item }: { item: CartItemWithProduct }) => (
    <View style={CartScreenStyles.cartItem}>
      <Image
        source={{ uri: item.product.imageUrls[0] }}
        style={CartScreenStyles.productImage}
        resizeMode="cover"
      />
      <View style={CartScreenStyles.productInfo}>
        <Text style={CartScreenStyles.productTitle} numberOfLines={2}>
          {item.product.title}
        </Text>
        <Text style={CartScreenStyles.productPrice}>
          {item.product.currency} {item.product.price.toFixed(2)}
        </Text>
        <View style={CartScreenStyles.quantityContainer}>
          <TouchableOpacity
            style={CartScreenStyles.quantityButton}
            onPress={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
            disabled={item.quantity <= 1}
          >
            <Text style={[CartScreenStyles.quantityButtonText, item.quantity <= 1 && CartScreenStyles.disabledText]}>
              -
            </Text>
          </TouchableOpacity>
          <Text style={CartScreenStyles.quantityText}>{item.quantity}</Text>
          <TouchableOpacity
            style={CartScreenStyles.quantityButton}
            onPress={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
          >
            <Text style={CartScreenStyles.quantityButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
      <TouchableOpacity
        style={CartScreenStyles.removeButton}
        onPress={() => handleRemoveItem(item.productId)}
      >
        <Text style={CartScreenStyles.removeButtonText}>✕</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmptyCart = () => (
    <View style={CartScreenStyles.emptyContainer}>
      <Text style={CartScreenStyles.emptyTitle}>🛒 Your cart is empty</Text>
      <Text style={CartScreenStyles.emptyDescription}>
        Add products to your cart by tapping "Add to Cart" on product cards or in the product details!
      </Text>
    </View>
  );

  const renderCheckoutSection = () => {
    if (cartItems.length === 0) return null;

    return (
      <View style={CartScreenStyles.checkoutSection}>
        <View style={CartScreenStyles.totalContainer}>
          <Text style={CartScreenStyles.totalLabel}>Total:</Text>
          <Text style={CartScreenStyles.totalAmount}>
            USD {calculateTotal().toFixed(2)}
          </Text>
        </View>
        <TouchableOpacity 
          style={CartScreenStyles.checkoutButton}
          onPress={handleProceedToCheckout}
        >
          <Text style={CartScreenStyles.checkoutButtonText}>Proceed to Checkout</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={CartScreenStyles.backgroundContainer}>
        <SafeAreaView style={CartScreenStyles.container}>
          <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={CartScreenStyles.loadingContainer}>
          <Text style={CartScreenStyles.loadingText}>Loading cart...</Text>
        </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={CartScreenStyles.backgroundContainer}>
      <SafeAreaView style={CartScreenStyles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={CartScreenStyles.header}>
        <Text style={CartScreenStyles.headerTitle}>Shopping Cart</Text>
        {cartItems.length > 0 && (
          <Text style={CartScreenStyles.itemCount}>{cartItems.length} items</Text>
        )}
      </View>
      
      <FlatList
        data={cartItems}
        renderItem={renderCartItem}
        keyExtractor={(item) => item.productId}
        contentContainerStyle={cartItems.length === 0 ? CartScreenStyles.emptyListContainer : CartScreenStyles.listContainer}
        ListEmptyComponent={renderEmptyCart}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
      
      {renderCheckoutSection()}
      </SafeAreaView>
    </View>
  );
};

