import { LinkingOptions } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { RootStackParamList } from '../types';

const prefix = Linking.createURL('/');

export const LinkingConfiguration: LinkingOptions<RootStackParamList> = {
  prefixes: [prefix, 'swipely://'],
  config: {
    screens: {
      Auth: {
        screens: {
          Login: 'login',
          SignUp: 'signup',
          ForgotPassword: 'forgot-password',
        },
      },
      Main: {
        screens: {
          MainTabs: {
            screens: {
              Feed: 'feed',
              Wishlist: 'wishlist',
              Cart: 'cart',
              Profile: 'profile',
            },
          },
          ProductDetails: {
            path: 'product/:productId',
            parse: {
              productId: (productId: string) => productId,
            },
          },
          CategorySelection: 'categories',
          SkippedProducts: {
            path: 'skipped/:category',
            parse: {
              category: (category: string) => category,
            },
          },
        },
      },
    },
  },
};