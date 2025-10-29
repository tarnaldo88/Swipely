import { configureStore, createSlice } from '@reduxjs/toolkit';

// Temporary placeholder slice for testing
const placeholderSlice = createSlice({
  name: 'placeholder',
  initialState: { value: 0 },
  reducers: {
    increment: (state) => {
      state.value += 1;
    },
  },
});

// Placeholder reducer - will be replaced with actual slices
const rootReducer = {
  placeholder: placeholderSlice.reducer,
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