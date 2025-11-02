# Swipely Commerce App

<div align="center">
  <img src="assets/SwipelyBag.png" alt="Swipely Logo" width="200" height="100">
  
  **A modern React Native e-commerce application featuring Tinder-style product discovery**
  
  [![React Native](https://img.shields.io/badge/React%20Native-0.72+-blue.svg)](https://reactnative.dev/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
  [![Expo](https://img.shields.io/badge/Expo-49+-black.svg)](https://expo.dev/)
  [![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
</div>

## Overview

Swipely revolutionizes mobile commerce with an intuitive swipe-based product discovery experience. Built with React Native and TypeScript, it delivers a seamless shopping experience across iOS, Android, and web platforms.

## Key Features

### **Smart Product Discovery**
- **Tinder-style Interface**: Swipe left to skip, right to like products
- **Intelligent Recommendations**: AI-powered product suggestions based on user preferences
- **Category Filtering**: Browse products by specific categories
- **Real-time Feed**: Dynamic product loading with infinite scroll

### **Platform-Optimized Experience**
- **Material Design (Android)**: Native Android UI patterns with ripple effects
- **Human Interface Guidelines (iOS)**: iOS-native design with haptic feedback
- **Responsive Web**: Mouse and keyboard optimized for desktop browsers
- **Cohesive Styling**: Unified visual experience across all platforms

### **Secure Authentication**
- **Firebase Integration**: Enterprise-grade authentication system
- **Multi-provider Support**: Email, Google, Facebook, and Apple Sign-In
- **Secure Session Management**: Persistent login with automatic token refresh
- **Password Recovery**: Secure password reset functionality

### **Advanced Shopping Features**
- **Smart Cart Management**: Add, remove, and modify cart items
- **Wishlist System**: Save products for later with organized collections
- **Offline Support**: Continue browsing and shopping without internet
- **Data Synchronization**: Seamless sync across devices

### **Performance & Optimization**
- **Image Optimization**: Lazy loading, caching, and responsive sizing
- **Memory Management**: Efficient resource usage and cleanup
- **Gesture Performance**: Smooth 60fps animations and interactions
- **Error Handling**: Comprehensive error recovery and user feedback

### **Analytics & Insights**
- **User Behavior Tracking**: Swipe patterns and engagement metrics
- **A/B Testing Framework**: Optimize UI/UX with data-driven decisions
- **Crash Reporting**: Real-time error monitoring and diagnostics
- **Performance Monitoring**: Track app performance and user experience

## Architecture

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

## Getting Started

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

## Feature Showcase

### **Authentication System**
- **Multi-Provider Login**: Email, Google, Facebook, Apple Sign-In
- **Secure Registration**: Email verification and password strength validation
- **Session Management**: Persistent login with automatic token refresh
- **Password Recovery**: Secure reset via email with temporary tokens

### **Product Discovery Engine**
- **Swipe Interface**: Intuitive Tinder-style product browsing
- **Smart Recommendations**: ML-powered suggestions based on user behavior
- **Category Filtering**: Browse by electronics, fashion, home, sports, etc.
- **Real-time Feed**: Dynamic loading with infinite scroll and pull-to-refresh

### **Platform-Specific Optimizations**
- **Android**: Material Design 3 with native ripple effects and toast notifications
- **iOS**: Human Interface Guidelines with haptic feedback and native animations
- **Web**: Mouse and keyboard optimized with hover states and click interactions
- **Unified Experience**: Consistent visual design across all platforms

### **Shopping Features**
- **Smart Cart**: Add, modify quantities, remove items with persistence
- **Wishlist Management**: Save products with organized collections
- **Offline Mode**: Continue browsing and shopping without internet connection
- **Data Sync**: Seamless synchronization across multiple devices

### **Performance & Reliability**
- **Image Optimization**: WebP support, lazy loading, responsive sizing, and caching
- **Memory Management**: Efficient resource cleanup and garbage collection
- **Error Handling**: Comprehensive error boundaries with user-friendly recovery
- **Crash Reporting**: Real-time monitoring with detailed crash analytics

### **Analytics & Insights**
- **User Behavior**: Track swipe patterns, engagement, and conversion metrics
- **A/B Testing**: Built-in framework for UI/UX experimentation
- **Performance Monitoring**: Real-time tracking of app performance and user experience
- **Custom Events**: Track business-specific metrics and user journeys

## Testing Guide

### **Authentication Flow**
1. Launch app → Login screen appears
2. **New User**: Tap "Sign Up" → Enter details → Verify email
3. **Existing User**: Enter credentials → Automatic login
4. **Forgot Password**: Tap link → Enter email → Check inbox for reset

### **Product Discovery**

#### **Mobile Gestures**
- **Swipe Left**: Skip product (red overlay appears)
- **Swipe Right**: Like product (green overlay with logo)
- **Tap Card**: View detailed product information
- **Pull Down**: Refresh product feed

#### **Desktop/Web**
- **Click & Drag**: Same as mobile swipe gestures
- **Mouse Hover**: Preview product details
- **Scroll Wheel**: Navigate through image galleries
- **Keyboard**: Arrow keys for navigation

#### **Button Actions**
- **Skip Button**: Same as swipe left
- **Like Button**: Same as swipe right + auto-advance to next card
- **Add to Cart**: Add product + auto-advance to next card
- **View Details**: Open product modal with full information

### **Navigation & Features**
- **Bottom Tabs**: Discover, Wishlist, Cart, Profile
- **Product Details**: Swipe through images, view specifications
- **Cart Management**: Modify quantities, remove items
- **Wishlist**: Save products, organize collections
- **Offline Mode**: Continue browsing without internet

### **Development Workflow**

#### **Code Quality**
```bash
npm run type-check     # TypeScript validation
npm run lint          # ESLint code style check
npm run test          # Jest unit tests
npm run test:e2e      # End-to-end testing
```

#### **Performance Testing**
```bash
npm run perf:analyze  # Bundle size analysis
npm run perf:profile  # Performance profiling
npm run perf:memory   # Memory usage tracking
```

#### **Platform Testing**
```bash
npm run test:android  # Android-specific tests
npm run test:ios      # iOS-specific tests
npm run test:web      # Web-specific tests
```

## Configuration

### **Environment Variables**
```bash
# Firebase Configuration
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id

# API Configuration
API_BASE_URL=https://api.swipely.com
API_VERSION=v1

# Analytics
ANALYTICS_ENABLED=true
CRASH_REPORTING_ENABLED=true
```

### **Platform-Specific Setup**

#### **Android Configuration**
```bash
# Enable Hermes engine (recommended)
android/app/build.gradle:
enableHermes: true

# Minimum SDK version
minSdkVersion 24
targetSdkVersion 33
```

#### **iOS Configuration**
```bash
# Minimum deployment target
ios/Podfile:
platform :ios, '12.0'

# Enable Flipper for debugging (development only)
use_flipper!()
```

## Troubleshooting

### **Common Issues**

#### **Build Issues**
```bash
# Clear all caches
npm run clean
npx expo start --clear

# Reset Metro bundler
npx expo start --reset-cache

# Clean platform-specific builds
npm run clean:android
npm run clean:ios
```

#### **Android Issues**
```bash
# Reanimated crashes - automatic fallback to simplified components
# SimpleProductDetailsScreen, SimpleSwipeableCard, SimpleImageGallery

# Fix Reanimated configuration
# Ensure babel.config.js includes:
plugins: ["react-native-reanimated/plugin"]

# Clean and rebuild
npx expo run:android --clear
```

#### **iOS Issues**
```bash
# Pod installation issues
cd ios && pod install --repo-update

# Simulator issues
npx expo run:ios --simulator="iPhone 14"

# Device provisioning
npx expo run:ios --device
```

#### **Web Issues**
```bash
# Web-specific dependencies
npm install @expo/webpack-config

# Clear web cache
rm -rf .expo/web
npm run web
```

### **Performance Optimization**

#### **Memory Management**
- Automatic cleanup of unused components
- Image caching with size limits
- Gesture handler optimization
- Background process management

#### **Network Optimization**
- Request deduplication
- Automatic retry with exponential backoff
- Offline data persistence
- Optimistic UI updates

## Requirements Compliance

### **Platform Support**
- **Android**: 8.0+ (API level 26+) with Material Design 3
- **iOS**: 12.0+ with Human Interface Guidelines
- **Web**: Modern browsers with responsive design
- **Cross-platform**: 95%+ code sharing with platform-specific optimizations

### **Performance Standards**
- **Load Time**: < 3 seconds initial app launch
- **Gesture Response**: < 16ms for 60fps animations
- **Memory Usage**: < 200MB average consumption
- **Network Efficiency**: Optimized API calls with caching

### **User Experience**
- **Accessibility**: WCAG 2.1 AA compliance
- **Internationalization**: Multi-language support ready
- **Offline Support**: Core functionality available without internet
- **Error Handling**: Graceful degradation with user-friendly messages

### **Security & Privacy**
- **Data Encryption**: End-to-end encryption for sensitive data
- **Authentication**: Multi-factor authentication support
- **Privacy**: GDPR and CCPA compliant data handling
- **Security**: Regular security audits and updates

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### **Development Setup**
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Ensure all tests pass: `npm test`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### **Code Standards**
- Follow TypeScript best practices
- Maintain 90%+ test coverage
- Use conventional commit messages
- Follow platform-specific design guidelines

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- **React Native Team** for the amazing framework
- **Expo Team** for development tools and services
- **Firebase Team** for authentication and backend services

---
Built by the Arnaldo Torres
