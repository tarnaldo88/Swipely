import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  View,
} from 'react-native';
import { ViewDetailStyles } from '@/screens/Styles/ProductStyles';

interface ViewDetailsButtonProps {
  onPress: () => Promise<void> | void;
  disabled?: boolean;
  loading?: boolean;
  style?: any;
  textStyle?: any;
  loadingColor?: string;
  title?: string;
}

export const ViewDetailsButton: React.FC<ViewDetailsButtonProps> = ({
  onPress,
  disabled = false,
  loading: externalLoading = false,
  style,
  textStyle,
  loadingColor = '#1976D2',
  title = 'View Details',
}) => {
  const [internalLoading, setInternalLoading] = useState(false);
  
  const isLoading = externalLoading || internalLoading;
  const isDisabled = disabled || isLoading;

  const handlePress = async () => {
    if (isDisabled) return;

    try {
      setInternalLoading(true);
      await onPress();
    } catch (error) {
      console.error('Error in ViewDetailsButton:', error);
    } finally {
      setInternalLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={[
        ViewDetailStyles.button,
        isDisabled && ViewDetailStyles.buttonDisabled,
        style,
      ]}
      onPress={handlePress}
      activeOpacity={isDisabled ? 1 : 0.7}
      disabled={isDisabled}
    >
      <View style={ViewDetailStyles.content}>
        {isLoading ? (
          <>
            <ActivityIndicator 
              size="small" 
              color={loadingColor} 
              style={ViewDetailStyles.loadingIndicator}
            />
            <Text style={[ViewDetailStyles.buttonText, ViewDetailStyles.loadingText, textStyle]}>
              Loading...
            </Text>
          </>
        ) : (
          <Text style={[ViewDetailStyles.buttonText, isDisabled && ViewDetailStyles.buttonTextDisabled, textStyle]}>
            {title}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};