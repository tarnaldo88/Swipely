# Firebase Setup Guide for Swipely Expo App

This guide will help you set up Firebase Authentication for the Swipely Expo app using the web Firebase SDK.

## Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter your project name (e.g., "swipely-app")
4. Choose whether to enable Google Analytics (optional)
5. Click "Create project"

## Step 2: Add Your App to Firebase

1. In your Firebase project dashboard, click the "Add app" button
2. Select the **Web** platform (🌐 icon)
3. Register your app with a name (e.g., "Swipely App")
4. You don't need to set up Firebase Hosting for now
5. Copy the Firebase configuration object

## Step 3: Configure Your App

1. Open `src/config/firebase.ts`
2. Replace the placeholder values with your actual Firebase config:

```typescript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-actual-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-actual-sender-id",
  appId: "your-actual-app-id"
};
```

## Step 4: Dependencies (Already Installed)

The required packages are already installed:
- `firebase` (web SDK)
- `@react-native-async-storage/async-storage` (for persistence)

## Step 5: Enable Authentication Methods

1. In the Firebase Console, go to "Authentication" > "Sign-in method"
2. Enable the sign-in providers you want to use:
   - **Email/Password**: Click "Enable" toggle
   - **Google**: Click "Enable" and configure OAuth consent screen
   - **Facebook**: Click "Enable" and add your Facebook App ID and secret
   - **Apple**: Click "Enable" (iOS only)

## Step 6: Configure Authentication Settings

1. Go to "Authentication" > "Settings" > "Authorized domains"
2. Add your domains if needed (localhost is included by default for development)
3. For Expo development, you may need to add your Expo development URL

## Step 7: Test Your Setup

### For Development:
```bash
# Start the Expo development server
npm start
```

### Test the Integration:
1. Try creating a new account with email/password
2. Try signing in with the created account
3. Check the Firebase Console > Authentication > Users to see registered users

## Troubleshooting

### Common Issues:

1. **"Firebase app not initialized"**
   - Make sure you've updated the config in `src/config/firebase.ts`
   - Ensure all required fields are filled with your actual Firebase project values

2. **"Network request failed"**
   - Check your internet connection
   - Verify your Firebase project is active
   - Check if you've enabled Email/Password authentication in Firebase Console

3. **"Invalid API key"**
   - Double-check your API key in the Firebase config
   - Make sure you're using the correct project
   - Ensure you're using the **Web** platform config, not iOS/Android

4. **Expo-specific issues**
   - Make sure you're using the web Firebase SDK (`firebase` package)
   - Clear Expo cache: `expo start --clear`
   - Restart the development server

## Important Notes for Expo

1. **Web Firebase SDK**: Expo uses the web Firebase SDK, not React Native Firebase
2. **No Platform-Specific Setup**: Unlike bare React Native, Expo doesn't require platform-specific configuration files
3. **Development vs Production**: The same configuration works for both development and production
4. **Persistence**: Firebase Auth automatically persists user sessions using AsyncStorage

## Environment Variables (Recommended for Production)

For production apps, consider using environment variables:

1. Create a `.env` file (add to .gitignore)
2. Store your config values as environment variables
3. Use a library like `expo-constants` to load them

Example `.env`:
```
FIREBASE_API_KEY=your-api-key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
```