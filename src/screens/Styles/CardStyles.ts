import { StyleSheet, Dimensions } from "react-native";
const { width: screenWidth } = Dimensions.get('window');

export const SimpleSwipeableCardtyles = StyleSheet.create({
  cardContainer: {
    alignSelf: 'center',
  },
  card: {
    width: screenWidth * 0.9,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    height: 400,
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  productInfo: {
    padding: 16,
  },
  productTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
    lineHeight: 24,
  },
  productPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  outOfStock: {
    fontSize: 12,
    color: '#F44336',
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButton: {
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#F44336',
  },
  skipButtonText: {
    color: '#F44336',
    fontWeight: '600',
    fontSize: 14,
  },
  cartButton: {
    backgroundColor: '#1976D2',
  },
  cartButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  likeButton: {
    backgroundColor: '#E8F5E8',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  likeButtonText: {
    color: '#4CAF50',
    fontWeight: '600',
    fontSize: 14,
  },
  detailsButtonContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  detailsButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingVertical: 10,
  },
  detailsButtonText: {
    color: '#666666',
    fontSize: 13,
  },
});