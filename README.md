# Swipely Commerce App

<div align="center">
  <img src="assets/SwipelyBag.png" alt="Swipely Logo" width="200" height="100">
  
  **A modern React Native e-commerce application featuring Tinder-style product discovery**
  
  [![React Native](https://img.shields.io/badge/React%20Native-0.72+-blue.svg)](https://reactnative.dev/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
  [![Expo](https://img.shields.io/badge/Expo-49+-black.svg)](https://expo.dev/)
  [![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
</div>

## 🚀 Overview

Swipely revolutionizes mobile commerce with an intuitive swipe-based product discovery experience. Built with React Native and TypeScript, it delivers a seamless shopping experience across iOS, Android, and web platforms.

## ✨ Key Features

### 🛍️ **Smart Product Discovery**
- **Tinder-style Interface**: Swipe left to skip, right to like products
- **Intelligent Recommendations**: AI-powered product suggestions based on user preferences
- **Category Filtering**: Browse products by specific categories
- **Real-time Feed**: Dynamic product loading with infinite scroll

### 🎨 **Platform-Optimized Experience**
- **Material Design (Android)**: Native Android UI patterns with ripple effects
- **Human Interface Guidelines (iOS)**: iOS-native design with haptic feedback
- **Responsive Web**: Mouse and keyboard optimized for desktop browsers
- **Cohesive Styling**: Unified visual experience across all platforms

### 🔐 **Secure Authentication**
- **Firebase Integration**: Enterprise-grade authentication system
- **Multi-provider Support**: Email, Google, Facebook, and Apple Sign-In
- **Secure Session Management**: Persistent login with automatic token refresh
- **Password Recovery**: Secure password reset functionality

### 🛒 **Advanced Shopping Features**
- **Smart Cart Management**: Add, remove, and modify cart items
- **Wishlist System**: Save products for later with organized collections
- **Offline Support**: Continue browsing and shopping without internet
- **Data Synchronization**: Seamless sync across devices

### 📱 **Performance & Optimization**
- **Image Optimization**: Lazy loading, caching, and responsive sizing
- **Memory Management**: Efficient resource usage and cleanup
- **Gesture Performance**: Smooth 60fps animations and interactions
- **Error Handling**: Comprehensive error recovery and user feedback

### 📊 **Analytics & Insights**
- **User Behavior Tracking**: Swipe patterns and engagement metrics
- **A/B Testing Framework**: Optimize UI/UX with data-driven decisions
- **Crash Reporting**: Real-time error monitoring and diagnostics
- **Performance Monitoring**: Track app performance and user experience

## 🏗️ Architecture

### **Project Structure**
```
src/
├── components/              # Reusable UI components
│   ├── common/             # Shared components (buttons, inputs, etc.)
│   │   ├── ErrorBoundary.tsx
│   │   ├── OptimizedImage.tsx
│   │   └── OptimizedFlatList.tsx
│   └── product/            # Product-specific components
│       ├── SwipeableCard.tsx
│       ├── AndroidSwipeableCard.tsx
│       ├── IOSSwipeableCard.tsx
│       └── MouseSwipeableCard.tsx
├── screens/                # Screen components
│   ├── auth/              # Authentication screens
│   └── main/              # Main application screens
├── services/              # Business logic and API services
│   ├── AuthService.ts
│   ├── ProductFeedService.ts
│   ├── AnalyticsService.ts
│   ├── ErrorHandlingService.ts
│   └── CrashReportingService.ts
├── hooks/                 # Custom React hooks
│   ├── useErrorHandler.ts
│   ├── useAnalytics.ts
│   └── useABTesting.ts
├── utils/                 # Utility functions and helpers
│   ├── PerformanceUtils.ts
│   ├── ErrorFactory.ts
│   └── PlatformUtils.ts
├── styles/                # Platform-specific styling
│   ├── AndroidStyles.ts
│   └── IOSStyles.ts
├── navigation/            # Navigation configuration
├── types/                 # TypeScript type definitions
└── store/                 # State management
```

### **Technology Stack**
- **Framework**: React Native 0.72+ with Expo 49+
- **Language**: TypeScript 5.0+ for type safety
- **State Management**: Redux Toolkit with RTK Query
- **Navigation**: React Navigation 6 with native stack
- **Gestures**: React Native Gesture Handler 2.0+
- **Animations**: React Native Reanimated 3.0+
- **Storage**: AsyncStorage with encryption
- **Authentication**: Firebase Auth with multi-provider support
- **Analytics**: Custom analytics with A/B testing framework
- **Testing**: Jest with React Native Testing Library

## 🚀 Getting Started

### **Prerequisites**
- Node.js 18+ and npm/yarn
- React Native development environment
- iOS: Xcode 14+ (macOS required)
- Android: Android Studio with SDK 33+

### **Installation**

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/swipely-commerce-app.git
   cd swipely-commerce-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your Firebase and API configurations
   ```

4. **Start development server**
   ```bash
   npm start
   # or
   yarn start
   ```

5. **Run on specific platforms**
   ```bash
   npm run android    # Android emulator/device
   npm run ios        # iOS simulator/device (macOS only)
   npm run web        # Web browser
   ```

## 🎯 Feature Showcase

## Testing the App

### **Authentication Flow**

- Start the app and you'll see the login screen
- Create a new account or use existing credentials
- After login, you'll be taken to the main app

### **Product Discovery (Swipe Testing)**

#### **🖱️ Mouse/Trackpad Gestures (Emulator)**

- **Drag Left**: Click and drag the card to the left to skip
- **Drag Right**: Click and drag the card to the right to like
- **Visual Feedback**: See "SKIP" or "LIKE" overlays while dragging
- **Threshold**: Drag at least 100px or release with velocity to trigger action

#### **📱 Touch Gestures (Device)**

- **Swipe Left**: Touch and swipe left to skip products
- **Swipe Right**: Touch and swipe right to add to wishlist
- **Visual Feedback**: Cards rotate and show colored overlays during swipe

#### **🔘 Button Actions (Alternative)**

- **Skip Button** (red): Same as swipe left
- **Like Button** (green): Same as swipe right
- **Add to Cart Button** (blue): Add products to cart
- **View Details Button**: See full product information

### **Product Details**

- **Image Gallery**: Click and drag or swipe through multiple product images
- **Specifications**: View detailed product information
- **Actions**: Use Like, Skip, or Add to Cart buttons
- **Close**: Tap X button or swipe down to close modal

### **Navigation**

- **Bottom Tabs**: Navigate between Discover, Wishlist, Cart, Profile
- **Pull to Refresh**: Pull down on Discover tab to load new products

### **Emulator-Specific Tips**

- **Mouse Drag**: Works like touch gestures - click, hold, and drag
- **Scroll Wheel**: Use on image galleries for quick navigation
- **Right Click**: May show context menu (ignore for app testing)
- **Keyboard**: Use arrow keys in some input fields

## Development

- Use `npm run type-check` to check TypeScript types
- Use `npm run lint` to check code style
- Use `npm test` to run tests

## Troubleshooting

### Android Reanimated Issues

If you encounter Reanimated crashes on Android, the app automatically falls back to simplified components:

- `SimpleProductDetailsScreen` instead of `ProductDetailsScreen`
- `SimpleSwipeableCard` instead of `SwipeableCard`
- `SimpleImageGallery` instead of `ImageGallery`

To fix Reanimated issues:

1. **Clean and rebuild**:

   ```bash
   npx expo run:android --clear
   ```

2. **Reset Metro cache**:

   ```bash
   npx expo start --clear
   ```

3. **For development builds**, ensure Reanimated is properly configured in `babel.config.js`:
   ```javascript
   plugins: ["react-native-reanimated/plugin"];
   ```

The simplified components provide the same functionality without advanced animations.

## Requirements Addressed

- ✅ 4.1: Android 8.0+ and iOS 12.0+ support
- ✅ 4.2: Cross-platform compatibility
- ✅ 4.3: Platform-specific optimizations
- ✅ 6.1: Product details screen with comprehensive information
- ✅ 6.2: Modal presentation with smooth transitions
- ✅ 6.3: Navigation and action buttons
- ✅ 6.4: Image gallery with swipe navigation
- ✅ 6.5: Performance optimizations and caching
