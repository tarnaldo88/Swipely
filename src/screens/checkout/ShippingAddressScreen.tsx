/**
 * Shipping Address Screen
 * Allows users to enter and validate shipping address
 * Second step in the checkout flow
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { CheckoutService } from '../../services/CheckoutService';
import { ShippingAddress, ValidationResult } from '../../types/checkout';
import { validateShippingAddress } from '../../utils/checkoutValidation';
import { ShippingAddressStyles } from '../Styles/ShippingAddressStyles';

type ShippingAddressScreenProps = StackScreenProps<any, 'Shipping'>;

const COUNTRIES = ['US', 'CA', 'UK', 'AU', 'DE', 'FR', 'JP', 'CN'];

export const ShippingAddressScreen: React.FC<ShippingAddressScreenProps> = ({
  navigation,
  route,
}) => {
  const [address, setAddress] = useState<ShippingAddress>({
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'US',
    isDefault: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [validation, setValidation] = useState<ValidationResult>({
    isValid: false,
    errors: {},
  });

  useEffect(() => {
    // Load existing address if available
    const state = CheckoutService.getState();
    if (state.shippingAddress) {
      setAddress(state.shippingAddress);
    }
  }, []);

  const handleFieldChange = (field: keyof ShippingAddress, value: string | boolean) => {
    const updatedAddress = { ...address, [field]: value };
    setAddress(updatedAddress);

    // Clear error for this field when user starts typing
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  const validateForm = (): boolean => {
    const result = validateShippingAddress(address);
    setValidation(result);
    setErrors(result.errors);
    return result.isValid;
  };

  const handleProceedToPayment = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors below');
      return;
    }

    setIsLoading(true);
    try {
      CheckoutService.setShippingAddress(address);
      const state = CheckoutService.proceedToNextStep();

      if (state.error) {
        Alert.alert('Error', state.error);
        setIsLoading(false);
        return;
      }

      navigation.navigate('Payment');
    } catch (error) {
      console.error('Error proceeding to payment:', error);
      Alert.alert('Error', 'Failed to proceed to payment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    CheckoutService.goToPreviousStep();
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={ShippingAddressStyles.container}
    >
      <ScrollView
        contentContainerStyle={ShippingAddressStyles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={ShippingAddressStyles.title}>Shipping Address</Text>
        <Text style={ShippingAddressStyles.subtitle}>
          Enter the address where you'd like your order delivered
        </Text>

        {/* Street Address */}
        <View style={ShippingAddressStyles.fieldContainer}>
          <Text style={ShippingAddressStyles.label}>Street Address *</Text>
          <TextInput
            style={[
              ShippingAddressStyles.input,
              errors.street && ShippingAddressStyles.inputError,
            ]}
            placeholder="123 Main Street"
            value={address.street}
            onChangeText={value => handleFieldChange('street', value)}
            editable={!isLoading}
          />
          {errors.street && <Text style={ShippingAddressStyles.errorText}>{errors.street}</Text>}
        </View>

        {/* City */}
        <View style={ShippingAddressStyles.fieldContainer}>
          <Text style={ShippingAddressStyles.label}>City *</Text>
          <TextInput
            style={[ShippingAddressStyles.input, errors.city && ShippingAddressStyles.inputError]}
            placeholder="New York"
            value={address.city}
            onChangeText={value => handleFieldChange('city', value)}
            editable={!isLoading}
          />
          {errors.city && <Text style={ShippingAddressStyles.errorText}>{errors.city}</Text>}
        </View>

        {/* State and Postal Code Row */}
        <View style={ShippingAddressStyles.rowContainer}>
          <View style={[ShippingAddressStyles.fieldContainer, ShippingAddressStyles.halfWidth]}>
            <Text style={ShippingAddressStyles.label}>State *</Text>
            <TextInput
              style={[
                ShippingAddressStyles.input,
                errors.state && ShippingAddressStyles.inputError,
              ]}
              placeholder="NY"
              value={address.state}
              onChangeText={value => handleFieldChange('state', value)}
              editable={!isLoading}
            />
            {errors.state && <Text style={ShippingAddressStyles.errorText}>{errors.state}</Text>}
          </View>

          <View style={[ShippingAddressStyles.fieldContainer, ShippingAddressStyles.halfWidth]}>
            <Text style={ShippingAddressStyles.label}>Postal Code *</Text>
            <TextInput
              style={[
                ShippingAddressStyles.input,
                errors.postalCode && ShippingAddressStyles.inputError,
              ]}
              placeholder="10001"
              value={address.postalCode}
              onChangeText={value => handleFieldChange('postalCode', value)}
              editable={!isLoading}
            />
            {errors.postalCode && (
              <Text style={ShippingAddressStyles.errorText}>{errors.postalCode}</Text>
            )}
          </View>
        </View>

        {/* Country */}
        <View style={ShippingAddressStyles.fieldContainer}>
          <Text style={ShippingAddressStyles.label}>Country *</Text>
          <View style={ShippingAddressStyles.countryPickerContainer}>
            {COUNTRIES.map(country => (
              <TouchableOpacity
                key={country}
                style={[
                  ShippingAddressStyles.countryButton,
                  address.country === country && ShippingAddressStyles.countryButtonActive,
                ]}
                onPress={() => handleFieldChange('country', country)}
                disabled={isLoading}
              >
                <Text
                  style={[
                    ShippingAddressStyles.countryButtonText,
                    address.country === country && ShippingAddressStyles.countryButtonTextActive,
                  ]}
                >
                  {country}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.country && <Text style={ShippingAddressStyles.errorText}>{errors.country}</Text>}
        </View>

        {/* Save Address Checkbox */}
        <View style={ShippingAddressStyles.checkboxContainer}>
          <Switch
            value={address.isDefault || false}
            onValueChange={value => handleFieldChange('isDefault', value)}
            disabled={isLoading}
          />
          <Text style={ShippingAddressStyles.checkboxLabel}>Save this address for future use</Text>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={ShippingAddressStyles.buttonContainer}>
        <TouchableOpacity
          style={ShippingAddressStyles.backButton}
          onPress={handleGoBack}
          disabled={isLoading}
        >
          <Text style={ShippingAddressStyles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            ShippingAddressStyles.proceedButton,
            isLoading && ShippingAddressStyles.proceedButtonDisabled,
          ]}
          onPress={handleProceedToPayment}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={ShippingAddressStyles.proceedButtonText}>Proceed to Payment</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};
