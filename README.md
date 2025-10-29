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

## Requirements Addressed

- ✅ 4.1: Android 8.0+ and iOS 12.0+ support
- ✅ 4.2: Cross-platform compatibility
- ✅ 4.3: Platform-specific optimizations

## Development

- Use `npm run type-check` to check TypeScript types
- Use `npm run lint` to check code style
- Use `npm test` to run tests (when implemented)

## Next Steps

The project structure is now ready for implementing the authentication system, product management, and swipe interface as outlined in the implementation plan.