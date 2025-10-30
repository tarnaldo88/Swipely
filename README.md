# Swipely Commerce App

A React Native mobile commerce application with Tinder-style product discovery interface.

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── common/         # Common components (buttons, inputs, etc.)
│   └── product/        # Product-specific components
├── screens/            # Screen components
│   ├── auth/          # Authentication screens
│   └── main/          # Main app screens
├── services/          # API services and business logic
├── store/             # Redux store configuration
├── navigation/        # Navigation configuration
├── types/             # TypeScript type definitions
└── utils/             # Utility functions and helpers
```

## Tech Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **State Management**: Redux Toolkit
- **Navigation**: React Navigation 6
- **Gestures**: React Native Gesture Handler
- **Animations**: React Native Reanimated 3
- **Storage**: AsyncStorage

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the development server:

   ```bash
   npm start
   ```

3. Run on specific platform:
   ```bash
   npm run android  # Android
   npm run ios      # iOS (macOS required)
   npm run web      # Web
   ```

## Features Implemented

### Authentication System

- ✅ Firebase Authentication integration
- ✅ Email/password login and registration
- ✅ Password reset functionality
- ✅ Persistent authentication state

### Product Discovery

- ✅ Tinder-style swipeable product cards
- ✅ Product details modal with image gallery
- ✅ Swipe gestures (left to skip, right to like)
- ✅ Add to cart functionality
- ✅ Optimized image loading and caching
- ✅ Performance optimizations with lazy loading

### Navigation

- ✅ Tab-based navigation (Discover, Wishlist, Cart, Profile)
- ✅ Modal presentation for product details
- ✅ Smooth transitions and animations

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
