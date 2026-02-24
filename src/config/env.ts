export type AppEnvironment = 'development' | 'staging' | 'production';

const parseBoolean = (value: string | undefined, defaultValue: boolean): boolean => {
  if (value === undefined) {
    return defaultValue;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === 'true' || normalized === '1' || normalized === 'yes') {
    return true;
  }
  if (normalized === 'false' || normalized === '0' || normalized === 'no') {
    return false;
  }

  return defaultValue;
};

const resolveEnvironment = (): AppEnvironment => {
  const rawEnv = process.env.EXPO_PUBLIC_APP_ENV?.trim().toLowerCase();

  if (rawEnv === 'production' || rawEnv === 'staging' || rawEnv === 'development') {
    return rawEnv;
  }

  return __DEV__ ? 'development' : 'production';
};

const environment = resolveEnvironment();
const defaultMockMode = environment !== 'production';
const requestedMockMode = parseBoolean(process.env.EXPO_PUBLIC_USE_MOCK_DATA, defaultMockMode);

// Guardrail: never allow mock mode in production runtime.
const useMockData = environment === 'production' ? false : requestedMockMode;

if (environment === 'production' && requestedMockMode) {
  console.warn('EXPO_PUBLIC_USE_MOCK_DATA was true in production and has been forced to false.');
}

export const AppConfig = {
  app: {
    environment,
  },
  api: {
    baseUrl: process.env.EXPO_PUBLIC_API_BASE_URL?.trim() || '',
  },
  productFeed: {
    baseUrl: process.env.EXPO_PUBLIC_PRODUCT_FEED_BASE_URL?.trim() || '',
  },
  stripe: {
    publishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() || '',
    merchantIdentifier:
      process.env.EXPO_PUBLIC_STRIPE_MERCHANT_IDENTIFIER?.trim() || 'merchant.com.swipely',
    paymentSheetUrl: process.env.EXPO_PUBLIC_STRIPE_PAYMENT_SHEET_URL?.trim() || '',
    paymentSheetPath: '/payments/create-payment-sheet',
  },
  features: {
    useMockData,
    useRemoteProductFeed: parseBoolean(process.env.EXPO_PUBLIC_USE_REMOTE_PRODUCT_FEED, false),
    analyticsEnabled: parseBoolean(process.env.EXPO_PUBLIC_ANALYTICS_ENABLED, !__DEV__),
    crashReportingEnabled: parseBoolean(process.env.EXPO_PUBLIC_CRASH_REPORTING_ENABLED, !__DEV__),
    stripeEnabled:
      Boolean(process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim()) &&
      Boolean(
        process.env.EXPO_PUBLIC_STRIPE_PAYMENT_SHEET_URL?.trim() ||
        process.env.EXPO_PUBLIC_API_BASE_URL?.trim()
      ),
  },
};

export const isProduction = AppConfig.app.environment === 'production';
export const isStaging = AppConfig.app.environment === 'staging';
export const isDevelopment = AppConfig.app.environment === 'development';
