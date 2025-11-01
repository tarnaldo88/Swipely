/**
 * Optimized FlatList component with performance enhancements for product feeds
 * Requirements: 3.1, 6.5
 */

import React, { memo, useCallback, useMemo, useRef } from 'react';
import {
  FlatList,
  FlatListProps,
  ViewToken,
  ListRenderItem,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useErrorHandler } from '../../hooks/useErrorHandler';

interface OptimizedFlatListProps<T> extends Omit<FlatListProps<T>, 'renderItem'> {
  renderItem: ListRenderItem<T>;
  onEndReachedThreshold?: number;
  onRefresh?: () => Promise<void>;
  refreshing?: boolean;
  enableVirtualization?: boolean;
  itemHeight?: number;
  estimatedItemSize?: number;
  windowSize?: number;
  maxToRenderPerBatch?: number;
  updateCellsBatchingPeriod?: number;
  removeClippedSubviews?: boolean;
  onViewableItemsChanged?: (info: { viewableItems: ViewToken[]; changed: ViewToken[] }) => void;
  viewabilityConfig?: {
    itemVisiblePercentThreshold?: number;
    minimumViewTime?: number;
    waitForInteraction?: boolean;
  };
}

const { height: screenHeight } = Dimensions.get('window');

function OptimizedFlatListComponent<T>({
  data,
  renderItem,
  keyExtractor,
  onEndReached,
  onEndReachedThreshold = 0.5,
  onRefresh,
  refreshing = false,
  enableVirtualization = true,
  itemHeight,
  estimatedItemSize,
  windowSize = 10,
  maxToRenderPerBatch = 5,
  updateCellsBatchingPeriod = 50,
  removeClippedSubviews = true,
  onViewableItemsChanged,
  viewabilityConfig,
  ...props
}: OptimizedFlatListProps<T>) {
  const flatListRef = useRef<FlatList<T>>(null);
  const { handleError } = useErrorHandler();

  // Memoized render item to prevent unnecessary re-renders
  const memoizedRenderItem = useCallback<ListRenderItem<T>>(
    (itemInfo) => {
      try {
        return renderItem(itemInfo);
      } catch (error) {
        handleError(error, {
          itemIndex: itemInfo.index,
          itemId: keyExtractor?.(itemInfo.item, itemInfo.index),
          component: 'OptimizedFlatList',
        });
        return null;
      }
    },
    [renderItem, keyExtractor, handleError]
  );

  // Optimized key extractor
  const memoizedKeyExtractor = useCallback(
    (item: T, index: number) => {
      try {
        return keyExtractor ? keyExtractor(item, index) : index.toString();
      } catch (error) {
        handleError(error, {
          itemIndex: index,
          component: 'OptimizedFlatList',
        });
        return index.toString();
      }
    },
    [keyExtractor, handleError]
  );

  // Handle end reached with error handling
  const handleEndReached = useCallback(
    async (info: { distanceFromEnd: number }) => {
      try {
        await onEndReached?.(info);
      } catch (error) {
        await handleError(error, {
          distanceFromEnd: info.distanceFromEnd,
          component: 'OptimizedFlatList',
          operation: 'onEndReached',
        });
      }
    },
    [onEndReached, handleError]
  );

  // Handle refresh with error handling
  const handleRefresh = useCallback(async () => {
    try {
      await onRefresh?.();
    } catch (error) {
      await handleError(error, {
        component: 'OptimizedFlatList',
        operation: 'onRefresh',
      });
    }
  }, [onRefresh, handleError]);

  // Optimized viewability config
  const optimizedViewabilityConfig = useMemo(() => ({
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 100,
    waitForInteraction: true,
    ...viewabilityConfig,
  }), [viewabilityConfig]);

  // Handle viewable items changed with error handling
  const handleViewableItemsChanged = useCallback(
    (info: { viewableItems: ViewToken[]; changed: ViewToken[] }) => {
      try {
        onViewableItemsChanged?.(info);
      } catch (error) {
        handleError(error, {
          viewableItemsCount: info.viewableItems.length,
          changedItemsCount: info.changed.length,
          component: 'OptimizedFlatList',
          operation: 'onViewableItemsChanged',
        });
      }
    },
    [onViewableItemsChanged, handleError]
  );

  // Calculate optimal item layout if height is provided
  const getItemLayout = useMemo(() => {
    if (!itemHeight) return undefined;
    
    return (data: T[] | null | undefined, index: number) => ({
      length: itemHeight,
      offset: itemHeight * index,
      index,
    });
  }, [itemHeight]);

  // Refresh control component
  const refreshControl = useMemo(() => {
    if (!onRefresh) return undefined;
    
    return (
      <RefreshControl
        refreshing={refreshing}
        onRefresh={handleRefresh}
        tintColor="#007AFF"
        colors={['#007AFF']}
      />
    );
  }, [refreshing, handleRefresh, onRefresh]);

  return (
    <FlatList
      ref={flatListRef}
      data={data}
      renderItem={memoizedRenderItem}
      keyExtractor={memoizedKeyExtractor}
      onEndReached={handleEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
      refreshControl={refreshControl}
      
      // Performance optimizations
      getItemLayout={getItemLayout}
      initialNumToRender={Math.ceil(screenHeight / (estimatedItemSize || itemHeight || 200))}
      windowSize={windowSize}
      maxToRenderPerBatch={maxToRenderPerBatch}
      updateCellsBatchingPeriod={updateCellsBatchingPeriod}
      removeClippedSubviews={removeClippedSubviews && enableVirtualization}
      
      // Viewability tracking
      onViewableItemsChanged={onViewableItemsChanged ? handleViewableItemsChanged : undefined}
      viewabilityConfig={onViewableItemsChanged ? optimizedViewabilityConfig : undefined}
      
      // Memory optimizations
      legacyImplementation={false}
      disableVirtualization={!enableVirtualization}
      
      {...props}
    />
  );
}

export const OptimizedFlatList = memo(OptimizedFlatListComponent) as <T>(
  props: OptimizedFlatListProps<T>
) => React.ReactElement;

/**
 * Hook for managing FlatList performance metrics
 */
export function useFlatListPerformance() {
  const renderStartTime = useRef<number>(0);
  const renderCount = useRef<number>(0);
  const { handleError } = useErrorHandler();

  const startRenderTracking = useCallback(() => {
    renderStartTime.current = Date.now();
    renderCount.current += 1;
  }, []);

  const endRenderTracking = useCallback((itemCount: number) => {
    const renderTime = Date.now() - renderStartTime.current;
    
    // Log performance metrics
    console.debug('FlatList render performance:', {
      renderTime,
      itemCount,
      renderCount: renderCount.current,
      averageTimePerItem: renderTime / itemCount,
    });

    // Report performance issues
    if (renderTime > 1000) { // More than 1 second
      handleError(new Error('Slow FlatList render detected'), {
        renderTime,
        itemCount,
        renderCount: renderCount.current,
        component: 'useFlatListPerformance',
      });
    }
  }, [handleError]);

  const resetMetrics = useCallback(() => {
    renderStartTime.current = 0;
    renderCount.current = 0;
  }, []);

  return {
    startRenderTracking,
    endRenderTracking,
    resetMetrics,
    renderCount: renderCount.current,
  };
}

/**
 * Hook for managing FlatList scroll performance
 */
export function useScrollPerformance() {
  const scrollStartTime = useRef<number>(0);
  const isScrolling = useRef<boolean>(false);
  const { handleError } = useErrorHandler();

  const onScrollBeginDrag = useCallback(() => {
    scrollStartTime.current = Date.now();
    isScrolling.current = true;
  }, []);

  const onScrollEndDrag = useCallback(() => {
    const scrollDuration = Date.now() - scrollStartTime.current;
    isScrolling.current = false;
    
    // Log scroll performance
    console.debug('Scroll performance:', {
      scrollDuration,
      isScrolling: isScrolling.current,
    });

    // Report scroll performance issues
    if (scrollDuration > 100) { // More than 100ms for scroll response
      handleError(new Error('Slow scroll response detected'), {
        scrollDuration,
        component: 'useScrollPerformance',
      });
    }
  }, [handleError]);

  const onMomentumScrollEnd = useCallback(() => {
    isScrolling.current = false;
  }, []);

  return {
    onScrollBeginDrag,
    onScrollEndDrag,
    onMomentumScrollEnd,
    isScrolling: isScrolling.current,
  };
}