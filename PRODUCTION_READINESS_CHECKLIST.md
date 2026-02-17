# Production Readiness Checklist

## Completed in this repo
- Added runtime environment config in `src/config/env.ts`.
- Added provider abstraction and factory in `src/data/providers/ProductFeedProvider.ts` and `src/data/providers/index.ts`.
- Added cart provider abstraction in `src/data/providers/CartProvider.ts`.
- Added wishlist provider abstraction in `src/data/providers/WishlistProvider.ts`.
- Wired `src/screens/main/FeedScreen.tsx` to a provider instead of direct `ProductFeedService` usage.
- Wired cart and wishlist consumer screens to providers:
  - `src/screens/main/FeedScreen.tsx`
  - `src/screens/main/WishlistScreen.tsx`
  - `src/screens/main/CartScreen.tsx`
  - `src/screens/main/SkippedProductsScreen.tsx`
- Added env defaults for local development in `.env.example`.
- Updated EAS profiles in `eas.json`:
  - `preview`, `preview2`, `preview3` use mock data.
  - `production` disables mock data.

## Build and release setup
1. Configure production API URL in EAS secrets:
   - `EXPO_PUBLIC_API_BASE_URL`
2. Configure release signing:
   - Android upload keystore variables in `android/gradle.properties` for local release builds.
3. Build and validate both tracks:
   - `npx eas build -p android --profile preview`
   - `npx eas build -p android --profile production`

## Runtime safety checks
1. Verify production build blocks mock mode:
   - `EXPO_PUBLIC_APP_ENV=production`
   - `EXPO_PUBLIC_USE_MOCK_DATA=true` should still run API mode due to guardrail in `src/config/env.ts`.
2. Verify preview build still supports deterministic testing with mock data.

## Testing gates before release
1. Type checks:
   - `npm run type-check`
2. Unit tests:
   - `npm test`
3. Manual smoke tests:
   - Feed load
   - Swipe left/right
   - Product details actions and return flow
   - Add to cart and cart count updates

## Recommended next implementation tasks
1. Implement API-backed auth provider with mock fallback for test builds.
2. Add telemetry wiring to real analytics/crash backends and gate them with `AppConfig.features`.
3. Add CI pipeline gates for typecheck, tests, and production EAS build.
