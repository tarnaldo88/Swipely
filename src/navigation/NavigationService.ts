import { NavigationContainerRef, CommonActions } from '@react-navigation/native';
import { RootStackParamList } from '../types';

/**
 * Navigation service for programmatic navigation throughout the app
 * Requirements: 1.1, 2.1, 3.1
 */
class NavigationService {
  private navigationRef: React.RefObject<NavigationContainerRef<RootStackParamList>> | null = null;

  /**
   * Set the navigation reference
   */
  setNavigationRef(ref: React.RefObject<NavigationContainerRef<RootStackParamList>>) {
    this.navigationRef = ref;
  }

  /**
   * Navigate to a specific route
   */
  navigate(routeName: keyof RootStackParamList, params?: any) {
    if (this.navigationRef?.current) {
      this.navigationRef.current.navigate(routeName as never, params as never);
    }
  }

  /**
   * Go back to the previous screen
   */
  goBack() {
    if (this.navigationRef?.current?.canGoBack()) {
      this.navigationRef.current.goBack();
    }
  }

  /**
   * Reset navigation stack to a specific route
   */
  reset(routeName: keyof RootStackParamList, params?: any) {
    if (this.navigationRef?.current) {
      this.navigationRef.current.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: routeName as never, params: params as never }],
        })
      );
    }
  }

  /**
   * Get current route name
   */
  getCurrentRoute() {
    return this.navigationRef?.current?.getCurrentRoute();
  }

  /**
   * Navigate to product details
   */
  navigateToProductDetails(productId: string, product?: any) {
    this.navigate('Main');
    // Use setTimeout to ensure the main navigator is ready
    setTimeout(() => {
      if (this.navigationRef?.current) {
        (this.navigationRef.current as any).navigate('ProductDetails', {
          productId,
          product,
        });
      }
    }, 100);
  }

  /**
   * Navigate to category selection
   */
  navigateToCategorySelection(isInitialSetup = false) {
    this.navigate('Main');
    setTimeout(() => {
      if (this.navigationRef?.current) {
        (this.navigationRef.current as any).navigate('CategorySelection', {
          isInitialSetup,
        });
      }
    }, 100);
  }

  /**
   * Navigate to main app after authentication
   */
  navigateToMainApp() {
    this.reset('Main');
  }

  /**
   * Navigate to authentication flow
   */
  navigateToAuth() {
    this.reset('Auth');
  }

  /**
   * Check if navigation is ready
   */
  isReady(): boolean {
    return this.navigationRef?.current?.isReady() ?? false;
  }
}

// Export singleton instance
export const navigationService = new NavigationService();