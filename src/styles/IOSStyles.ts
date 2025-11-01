import { StyleSheet, Platform } from 'react-native';
import { getPlatformFeatures } from '../utils/PlatformUtils';

const platformFeatures = getPlatformFeatures();

export const IOSStyles = StyleSheet.create({
  // iOS-specific container styles
  safeContainer: {
    flex: 1,
    paddingTop: platformFeatures.statusBarHeight,
    paddingBottom: platformFeatures.bottomSafeArea,
  },
  
  // iOS-specific navigation styles
  navigationHeader: {
    height: 44,
    backgroundColor: '#F2F2F7',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  navigationTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  
  navigationBackButton: {
    position: 'absolute',
    left: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  
  navigationBackText: {
    fontSize: 17,
    color: '#007AFF',
  },
  
  // iOS-specific button styles
  primaryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 17,
    fontWeight: '400',
  },
  
  // iOS-specific card styles
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 0, // Disable Android elevation
  },
  
  // iOS-specific list styles
  listItem: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
    minHeight: 44,
  },
  
  listItemText: {
    fontSize: 17,
    color: '#000000',
  },
  
  listItemSubtext: {
    fontSize: 15,
    color: '#8E8E93',
    marginTop: 2,
  },
  
  // iOS-specific input styles
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#C6C6C8',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 17,
    color: '#000000',
    minHeight: 44,
  },
  
  textInputFocused: {
    borderColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  
  // iOS-specific modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  
  modalHeader: {
    backgroundColor: '#FFFFFF',
    paddingTop: platformFeatures.statusBarHeight,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
  },
  
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
  },
  
  modalCloseButton: {
    position: 'absolute',
    right: 16,
    top: platformFeatures.statusBarHeight + 8,
  },
  
  modalCloseText: {
    fontSize: 17,
    color: '#007AFF',
  },
  
  // iOS-specific tab bar styles
  tabBar: {
    backgroundColor: '#F2F2F7',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#C6C6C8',
    paddingBottom: platformFeatures.bottomSafeArea,
    height: 49 + platformFeatures.bottomSafeArea,
  },
  
  tabBarItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 6,
    paddingBottom: 2,
  },
  
  tabBarLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  
  tabBarLabelActive: {
    color: '#007AFF',
  },
  
  tabBarLabelInactive: {
    color: '#8E8E93',
  },
});

// iOS-specific animation configurations
export const IOSAnimations = {
  spring: {
    damping: 20,
    mass: 1,
    stiffness: 100,
  },
  
  timing: {
    duration: 300,
  },
  
  modal: {
    duration: 400,
  },
  
  swipe: {
    duration: 250,
  },
};

// iOS-specific gesture configurations
export const IOSGestures = {
  swipeThreshold: 50,
  velocityThreshold: 500,
  panThreshold: 10,
  longPressDelay: 500,
};