import { StyleSheet, Platform, Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");

export const AndroidStyles = StyleSheet.create({
  // Android Material Design container styles
  safeContainer: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? 24 : 0, // Status bar height
  },

  // Material Design navigation styles
  navigationHeader: {
    height: 56,
    backgroundColor: "#221e27",
    elevation: 4,
    shadowColor: "transparent", // Use elevation instead of shadow on Android
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },

  navigationTitle: {
    fontSize: 20,
    fontWeight: "500",
    color: "#212121",
  },

  navigationBackButton: {
    position: "absolute",
    left: 16,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    width: 40,
    height: 40,
    borderRadius: 20,
  },

  navigationBackIcon: {
    fontSize: 24,
    color: "#757575",
  },

  // Material Design button styles
  primaryButton: {
    backgroundColor: "#1976D2",
    borderRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    elevation: 2,
  },

  primaryButtonPressed: {
    elevation: 8,
    backgroundColor: "#1565C0",
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
    textTransform: "uppercase",
  },

  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#1976D2",
    borderRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },

  secondaryButtonText: {
    color: "#1976D2",
    fontSize: 16,
    fontWeight: "500",
    textTransform: "uppercase",
  },

  floatingActionButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#1976D2",
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    position: "absolute",
    bottom: 16,
    right: 16,
  },

  // Material Design card styles
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    elevation: 4,
    shadowColor: "transparent", // Use elevation instead
    marginVertical: 4,
    marginHorizontal: 8,
  },

  cardContent: {
    padding: 16,
  },

  cardActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 8,
    paddingVertical: 8,
  },

  // Material Design list styles
  listItem: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    minHeight: 48,
  },

  listItemText: {
    fontSize: 16,
    color: "#212121",
    lineHeight: 24,
  },

  listItemSubtext: {
    fontSize: 14,
    color: "#757575",
    marginTop: 4,
    lineHeight: 20,
  },

  // Material Design input styles
  textInput: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    paddingVertical: 12,
    paddingHorizontal: 0,
    fontSize: 16,
    color: "#212121",
    minHeight: 48,
  },

  textInputFocused: {
    borderBottomColor: "#1976D2",
    borderBottomWidth: 2,
  },

  textInputLabel: {
    fontSize: 12,
    color: "#757575",
    marginBottom: 4,
    textTransform: "uppercase",
  },

  // Material Design modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },

  modalHeader: {
    backgroundColor: "#FFFFFF",
    paddingTop: 24,
    paddingBottom: 16,
    paddingHorizontal: 16,
    elevation: 4,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "500",
    color: "#212121",
  },

  modalCloseButton: {
    position: "absolute",
    right: 16,
    top: 24,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },

  // Material Design bottom navigation
  bottomNavigation: {
    backgroundColor: "#221e27",
    borderTopWidth: 1,
    borderTopColor: "#221e27",
    elevation: 8,
    height: 56,
    flexDirection: "row",
  },

  bottomNavigationItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },

  bottomNavigationLabel: {
    fontSize: 12,
    marginTop: 4,
  },

  bottomNavigationLabelActive: {
    color: "#1976D2",
    fontWeight: "500",
  },

  bottomNavigationLabelInactive: {
    color: "#cecacaff",
  },

  // Material Design ripple effect simulation
  rippleContainer: {
    overflow: "hidden",
  },

  // Material Design snackbar
  snackbar: {
    backgroundColor: "#323232",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 4,
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    elevation: 6,
  },

  snackbarText: {
    color: "#FFFFFF",
    fontSize: 14,
  },

  snackbarAction: {
    color: "#FF4081",
    fontSize: 14,
    fontWeight: "500",
    textTransform: "uppercase",
  },
});

// Material Design color palette
export const MaterialColors = {
  primary: "#1976D2",
  primaryDark: "#1565C0",
  primaryLight: "#42A5F5",
  accent: "#FF4081",
  background: "#FAFAFA",
  surface: "#FFFFFF",
  error: "#F44336",
  onPrimary: "#FFFFFF",
  onSecondary: "#000000",
  onBackground: "#212121",
  onSurface: "#212121",
  onError: "#FFFFFF",
  textPrimary: "#212121",
  textSecondary: "#757575",
  textHint: "#9E9E9E",
  divider: "#E0E0E0",
};

// Material Design animation configurations
export const MaterialAnimations = {
  // Standard easing curves
  standard: {
    duration: 300,
    easing: "cubic-bezier(0.4, 0.0, 0.2, 1)",
  },

  decelerate: {
    duration: 300,
    easing: "cubic-bezier(0.0, 0.0, 0.2, 1)",
  },

  accelerate: {
    duration: 200,
    easing: "cubic-bezier(0.4, 0.0, 1, 1)",
  },

  sharp: {
    duration: 200,
    easing: "cubic-bezier(0.4, 0.0, 0.6, 1)",
  },

  // Specific animations
  fab: {
    duration: 200,
    scale: 1.1,
  },

  ripple: {
    duration: 600,
  },

  swipe: {
    duration: 250,
  },
};

// Material Design elevation levels
export const MaterialElevation = {
  level0: 0,
  level1: 1,
  level2: 2,
  level3: 3,
  level4: 4,
  level6: 6,
  level8: 8,
  level12: 12,
  level16: 16,
  level24: 24,
};

// Android-specific gesture configurations
export const AndroidGestures = {
  swipeThreshold: 60,
  velocityThreshold: 400,
  panThreshold: 8,
  longPressDelay: 500,
  doubleTapDelay: 300,
};
