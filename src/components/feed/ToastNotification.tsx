import React, { memo } from 'react';
import {
  View,
  Text,
} from 'react-native';
import { FeedScreenStyles } from '../../screens/Styles/ProductStyles';

interface ToastNotificationProps {
  visible: boolean;
  message: string;
}

/**
 * Separated toast component to prevent re-renders of main feed
 * Only re-renders when message changes
 */
export const ToastNotification = memo<ToastNotificationProps>(({
  visible,
  message,
}) => {
  if (!visible) {
    return null;
  }

  return (
    <View style={FeedScreenStyles.toastContainer}>
      <View style={FeedScreenStyles.toast}>
        <Text style={FeedScreenStyles.toastText}>{message}</Text>
      </View>
    </View>
  );
});

ToastNotification.displayName = 'ToastNotification';
