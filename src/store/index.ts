import { configureStore } from '@reduxjs/toolkit';

// Placeholder reducer - will be replaced with actual slices
const rootReducer = {
  // auth: authSlice.reducer,
  // products: productsSlice.reducer,
  // cart: cartSlice.reducer,
  // wishlist: wishlistSlice.reducer,
};

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;