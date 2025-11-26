import { StyleSheet, Dimensions } from "react-native";
const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = screenWidth * 0.9;

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

export const AndroidSwipeCardStyles = StyleSheet.create({
  logo: {
    width: 408,
    height: 204,
    marginBottom: 20,
    resizeMode: 'contain',
  },
  cardContainer: {
    position: 'absolute',
    alignSelf: 'center',
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#221e27',
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
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },

  likeOverlay: {
    backgroundColor: 'rgba(76, 175, 80, 0.85)',
  },
  skipOverlay: {
    backgroundColor: 'rgba(244, 67, 54, 0.85)',
  },
  overlayText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  productInfo: {
    padding: 16,
  },
  productTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#e7e7e7ff',
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
    color: '#cececeff',
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
    backgroundColor: '#fff',
    borderColor: '#c725f8ff',
    borderWidth: 1,
  },
  skipButtonText: {
    color: '#b91decff',
    fontWeight: '600',
    fontSize: 14,
  },
  cartButton: {
    backgroundColor: '#08f88c',
  },
  cartButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  likeButton: {
    backgroundColor: '#c725f8ff',
    borderWidth: 1,
    borderColor: '#2bee31ff',
  },
  likeButtonText: {
    color: '#f1fcf1ff',
    fontWeight: '600',
    fontSize: 14,
  },
  disabledButton: {
    backgroundColor: '#E0E0E0',
    elevation: 0,
  },
  disabledButtonText: {
    color: '#999',
  },
  detailsButtonContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  detailsButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#21fa501c',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsButtonText: {
    color: '#bbb8b8ff',
    fontSize: 13,
  },
});

export const IOSCardStyles = StyleSheet.create({
  logo: {
    width: 408,
    height: 204,
    marginBottom: 20,
    resizeMode: 'contain',
  },
  cardContainer: {
    position: 'absolute',
    alignSelf: 'center',
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#221e27',
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
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },

  likeOverlay: {
    backgroundColor: 'rgba(52, 199, 89, 0.85)',
  },
  skipOverlay: {
    backgroundColor: 'rgba(255, 59, 48, 0.85)',
  },
  overlayText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  productInfo: {
    padding: 16,
  },
  productTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#e7e7e7ff',
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
    color: '#cececeff',
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
    backgroundColor: '#fff',
    borderColor: '#c725f8ff',
    borderWidth: 1,
  },
  skipButtonText: {
    color: '#b91decff',
    fontWeight: '600',
    fontSize: 14,
  },
  cartButton: {
    backgroundColor: '#08f88c',
  },
  cartButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  likeButton: {
    backgroundColor: '#c725f8ff',
    borderWidth: 1,
    borderColor: '#2bee31ff',
  },
  likeButtonText: {
    color: '#f1fcf1ff',
    fontWeight: '600',
    fontSize: 14,
  },
  disabledButton: {
    backgroundColor: '#E0E0E0',
  },
  disabledButtonText: {
    color: '#999',
  },
  detailsButtonContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  detailsButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#21fa501c',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsButtonText: {
    color: '#bbb8b8ff',
    fontSize: 13,
  },
});



export const MouseSwipeStyles = StyleSheet.create({
  logo: {
    width: 408,
    height: 204,
    marginBottom: 20,
    resizeMode: "contain",
  },
  cardContainer: {
    paddingTop: 30,
    alignSelf: "center",
    borderColor: "#221e27",
  },
  card: {
    width: CARD_WIDTH,
    maxWidth: 700,
    backgroundColor: "#221e27",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    borderColor: "#221e27",
    alignSelf: "center",
  },
  cardContent: {
    borderRadius: 16,
    overflow: "hidden",
  },
  imageContainer: {
    position: "relative",
    height: 400,
    width: "100%",
    backgroundColor: "#f0f0f0",
  },
  productImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    backgroundColor: "#f0f0f0",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
  },
  likeOverlay: {
    backgroundColor: "rgba(76, 175, 80, 0.8)",
  },
  skipOverlay: {
    backgroundColor: "rgba(244, 67, 54, 0.8)",
  },
  overlayText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  productInfo: {
    padding: 16,
  },
  productTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#e7e7e7ff",
    marginBottom: 8,
    lineHeight: 24,
  },
  productPrice: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2E7D32",
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 14,
    color: "#cececeff",
    marginBottom: 8,
  },
  outOfStock: {
    fontSize: 12,
    color: "#F44336",
    fontWeight: "500",
    textTransform: "uppercase",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  skipButton: {
    backgroundColor: "#fff",
    borderColor: "#c725f8ff",
    borderWidth: 1,
  },
  skipButtonText: {
    color: "#b91decff",
    fontWeight: "600",
    fontSize: 14,
  },
  cartButton: {
    backgroundColor: "#08f88c",
  },
  cartButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  likeButton: {
    backgroundColor: "#c725f8ff",
    borderWidth: 1,
    borderColor: "#2bee31ff",
  },
  likeButtonText: {
    color: "#f1fcf1ff",
    fontWeight: "600",
    fontSize: 14,
  },
  detailsButtonContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  detailsButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#21fa501c",
    paddingVertical: 10,
  },
  detailsButtonText: {
    color: "#bbb8b8ff",
    fontSize: 13,
  },
  instructionsContainer: {
    position: "absolute",
    bottom: -40,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  instructionsText: {
    fontSize: 12,
    color: "#666666",
    textAlign: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
});