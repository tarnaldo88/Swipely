import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';

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
        styles.button,
        isDisabled && styles.buttonDisabled,
        style,
      ]}
      onPress={handlePress}
      activeOpacity={isDisabled ? 1 : 0.7}
      disabled={isDisabled}
    >
      <View style={styles.content}>
        {isLoading ? (
          <>
            <ActivityIndicator 
              size="small" 
              color={loadingColor} 
              style={styles.loadingIndicator}
            />
            <Text style={[styles.buttonText, styles.loadingText, textStyle]}>
              Loading...
            </Text>
          </>
        ) : (
          <Text style={[styles.buttonText, isDisabled && styles.buttonTextDisabled, textStyle]}>
            {title}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1976D2',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  buttonDisabled: {
    borderColor: '#BDBDBD',
    opacity: 0.6,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#1976D2',
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
  },
  buttonTextDisabled: {
    color: '#757575',
  },
  loadingText: {
    marginLeft: 8,
  },
  loadingIndicator: {
    marginRight: 4,
  },
});