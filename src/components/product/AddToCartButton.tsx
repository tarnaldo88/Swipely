import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';

interface AddToCartButtonProps {
  onPress: () => Promise<void> | void;
  disabled?: boolean;
  loading?: boolean;
  style?: any;
  textStyle?: any;
  loadingColor?: string;
  title?: string;
}

export const AddToCartButton: React.FC<AddToCartButtonProps> = ({
  onPress,
  disabled = false,
  loading: externalLoading = false,
  style,
  textStyle,
  loadingColor = '#FFFFFF',
  title = 'Add to Cart',
}) => {
  const [internalLoading, setInternalLoading] = useState(false);
  
  const isLoading = externalLoading || internalLoading;
  const isDisabled = disabled || isLoading;

  const handlePress = async () => {
    console.log('AddToCartButton.handlePress called');
    console.log('isDisabled:', isDisabled);
    
    if (isDisabled) {
      console.log('Button is disabled, returning early');
      return;
    }

    try {
      console.log('Setting loading state and calling onPress');
      setInternalLoading(true);
      await onPress();
      console.log('onPress completed successfully');
    } catch (error) {
      console.error('Error in AddToCartButton:', error);
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
              Adding...
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
    backgroundColor: '#1976D2',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  buttonDisabled: {
    backgroundColor: '#BDBDBD',
    opacity: 0.6,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
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