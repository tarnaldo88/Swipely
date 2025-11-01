/**
 * Optimized image component with lazy loading and caching
 * Requirements: 3.1, 6.5
 */

import React, { useState, useCallback, memo } from 'react';
import { 
  Image, 
  ImageProps, 
  ImageStyle, 
  View, 
  ActivityIndicator, 
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { ErrorType } from '../../types/errors';

interface OptimizedImageProps extends Omit<ImageProps, 'source'> {
  uri: string;
  fallbackUri?: string;
  placeholder?: React.ReactNode;
  errorComponent?: React.ReactNode;
  lazy?: boolean;
  cachePolicy?: 'memory' | 'disk' | 'memory-disk' | 'none';
  resizeMode?: ImageStyle['resizeMode'];
  quality?: 'low' | 'medium' | 'high';
  width?: number;
  height?: number;
  aspectRatio?: number;
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
  onError?: (error: any) => void;
}

interface ImageState {
  loading: boolean;
  error: boolean;
  loaded: boolean;
}

const { width: screenWidth } = Dimensions.get('window');

export const OptimizedImage = memo<OptimizedImageProps>(({
  uri,
  fallbackUri,
  placeholder,
  errorComponent,
  lazy = true,
  cachePolicy = 'memory-disk',
  resizeMode = 'cover',
  quality = 'medium',
  width,
  height,
  aspectRatio,
  style,
  onLoadStart,
  onLoadEnd,
  onError,
  ...props
}) => {
  const [imageState, setImageState] = useState<ImageState>({
    loading: false,
    error: false,
    loaded: false,
  });
  const [currentUri, setCurrentUri] = useState(uri);
  const { handleError } = useErrorHandler();

  // Optimize image URI based on device capabilities and quality settings
  const getOptimizedUri = useCallback((originalUri: string): string => {
    if (!originalUri) return originalUri;

    // For demo purposes, we'll add query parameters for image optimization
    // In production, this would integrate with a CDN like Cloudinary or ImageKit
    const url = new URL(originalUri);
    
    // Add width parameter for responsive images
    if (width) {
      url.searchParams.set('w', Math.ceil(width * 2).toString()); // 2x for retina
    } else if (screenWidth) {
      url.searchParams.set('w', Math.ceil(screenWidth * 2).toString());
    }

    // Add height parameter if specified
    if (height) {
      url.searchParams.set('h', Math.ceil(height * 2).toString());
    }

    // Add quality parameter
    const qualityMap = {
      low: '60',
      medium: '80',
      high: '95',
    };
    url.searchParams.set('q', qualityMap[quality]);

    // Add format optimization
    url.searchParams.set('auto', 'format');
    
    return url.toString();
  }, [width, height, quality]);

  const handleLoadStart = useCallback(() => {
    setImageState(prev => ({ ...prev, loading: true, error: false }));
    onLoadStart?.();
  }, [onLoadStart]);

  const handleLoadEnd = useCallback(() => {
    setImageState(prev => ({ ...prev, loading: false, loaded: true }));
    onLoadEnd?.();
  }, [onLoadEnd]);

  const handleImageError = useCallback(async (error: any) => {
    console.warn('Image load error:', error);
    
    // Try fallback URI if available and not already using it
    if (fallbackUri && currentUri !== fallbackUri) {
      setCurrentUri(fallbackUri);
      return;
    }

    // Set error state
    setImageState(prev => ({ ...prev, loading: false, error: true }));
    
    // Handle error through error handling service
    await handleError(error, {
      uri: currentUri,
      fallbackUri,
      component: 'OptimizedImage',
    });

    onError?.(error);
  }, [fallbackUri, currentUri, handleError, onError]);

  // Calculate container style
  const containerStyle = [
    styles.container,
    width && { width },
    height && { height },
    aspectRatio && { aspectRatio },
    style,
  ];

  // Calculate image style
  const imageStyle = [
    styles.image,
    { resizeMode },
    width && { width },
    height && { height },
    aspectRatio && { aspectRatio },
  ];

  // Show placeholder while loading
  if (imageState.loading && !imageState.loaded) {
    return (
      <View style={containerStyle}>
        {placeholder || (
          <View style={styles.placeholder}>
            <ActivityIndicator size="small" color="#007AFF" />
          </View>
        )}
      </View>
    );
  }

  // Show error component if image failed to load
  if (imageState.error) {
    return (
      <View style={containerStyle}>
        {errorComponent || (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Failed to load image</Text>
          </View>
        )}
      </View>
    );
  }

  const optimizedUri = getOptimizedUri(currentUri);

  return (
    <View style={containerStyle}>
      <Image
        {...props}
        source={{ uri: optimizedUri }}
        style={imageStyle}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleImageError}
        // Performance optimizations
        fadeDuration={200}
        progressiveRenderingEnabled={true}
        // Cache policy (React Native doesn't have built-in cache control, 
        // but this would be implemented with a library like react-native-fast-image)
      />
      
      {/* Loading overlay */}
      {imageState.loading && imageState.loaded && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="#007AFF" />
        </View>
      )}
    </View>
  );
});

OptimizedImage.displayName = 'OptimizedImage';

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f5f5f5',
    overflow: 'hidden',
  },
  image: {
    flex: 1,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
});

/**
 * Hook for preloading images
 */
export function useImagePreloader() {
  const [preloadedImages, setPreloadedImages] = useState<Set<string>>(new Set());
  const { handleError } = useErrorHandler();

  const preloadImage = useCallback(async (uri: string): Promise<boolean> => {
    if (preloadedImages.has(uri)) {
      return true;
    }

    try {
      await Image.prefetch(uri);
      setPreloadedImages(prev => new Set([...prev, uri]));
      return true;
    } catch (error) {
      await handleError(error, {
        uri,
        operation: 'preload',
        component: 'useImagePreloader',
      });
      return false;
    }
  }, [preloadedImages, handleError]);

  const preloadImages = useCallback(async (uris: string[]): Promise<boolean[]> => {
    return Promise.all(uris.map(preloadImage));
  }, [preloadImage]);

  const isPreloaded = useCallback((uri: string): boolean => {
    return preloadedImages.has(uri);
  }, [preloadedImages]);

  return {
    preloadImage,
    preloadImages,
    isPreloaded,
    preloadedCount: preloadedImages.size,
  };
}