/**
 * Payment Method Screen
 * Allows users to enter payment card details
 * Third step in the checkout flow
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
import { useStripe } from '@stripe/stripe-react-native';
import * as Linking from 'expo-linking';
import { CheckoutService } from '../../services/CheckoutService';
import { PaymentService } from '../../services/PaymentService';
import { PaymentMethod, CartCalculation } from '../../types/checkout';
import { validatePaymentMethod } from '../../utils/checkoutValidation';
import { PaymentMethodStyles } from '../Styles/PaymentMethodStyles';

type PaymentMethodScreenProps = StackScreenProps<any, 'Payment'>;

export const PaymentMethodScreen: React.FC<PaymentMethodScreenProps> = ({
  navigation,
  route,
}) => {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const stripeEnabled = PaymentService.isStripeConfigured();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>({
    cardNumber: '',
    expirationDate: '',
    cvv: '',
    cardholderName: '',
    isDefault: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [totals, setTotals] = useState<CartCalculation>({
    subtotal: 0,
    tax: 0,
    shipping: 0,
    total: 0,
  });

  useEffect(() => {
    // Load totals and existing payment method if available
    const state = CheckoutService.getState();
    const calculation = CheckoutService.calculateTotals();
    setTotals(calculation);

    if (state.paymentMethod) {
      setPaymentMethod(state.paymentMethod);
    }
  }, []);

  const handleFieldChange = (field: keyof PaymentMethod, value: string | boolean) => {
    let formattedValue = value;

    // Format card number (add spaces every 4 digits)
    if (field === 'cardNumber' && typeof value === 'string') {
      formattedValue = value
        .replace(/\s/g, '')
        .replace(/(\d{4})/g, '$1 ')
        .trim();
    }

    // Format expiration date (MM/YY)
    if (field === 'expirationDate' && typeof value === 'string') {
      const cleaned = value.replace(/\D/g, '');
      if (cleaned.length >= 2) {
        formattedValue = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
      } else {
        formattedValue = cleaned;
      }
    }

    // Limit CVV to 4 digits
    if (field === 'cvv' && typeof value === 'string') {
      formattedValue = value.replace(/\D/g, '').slice(0, 4);
    }

    const updatedMethod = { ...paymentMethod, [field]: formattedValue };
    setPaymentMethod(updatedMethod);

    // Clear error for this field when user starts typing
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  const validateForm = (): boolean => {
    if (stripeEnabled) {
      return true;
    }

    const result = validatePaymentMethod(paymentMethod);
    setErrors(result.errors);
    return result.isValid;
  };

  const handleStripeCheckout = async (orderId: string): Promise<boolean> => {
    try {
      const paymentSheet = await PaymentService.createPaymentSheetParams(orderId, totals.total);

      const initResult = await initPaymentSheet({
        merchantDisplayName: paymentSheet.merchantDisplayName || 'Swipely',
        paymentIntentClientSecret: paymentSheet.clientSecret,
        customerId: paymentSheet.customerId,
        customerEphemeralKeySecret: paymentSheet.ephemeralKey,
        returnURL: Linking.createURL('stripe-redirect'),
        allowsDelayedPaymentMethods: true,
      });

      if (initResult.error) {
        Alert.alert('Payment Setup Failed', initResult.error.message);
        return false;
      }

      const presentResult = await presentPaymentSheet();
      if (presentResult.error) {
        Alert.alert('Payment Failed', presentResult.error.message);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Stripe checkout error:', error);
      Alert.alert('Payment Failed', 'Unable to start Stripe checkout');
      return false;
    }
  };

  const handleCompletePayment = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors below');
      return;
    }

    setIsLoading(true);
    try {
      CheckoutService.setProcessing(true);

      const orderId = `ORD-${Date.now()}`;

      let paymentResult;
      if (stripeEnabled) {
        const stripeSuccess = await handleStripeCheckout(orderId);
        if (!stripeSuccess) {
          CheckoutService.setProcessing(false);
          setIsLoading(false);
          return;
        }

        CheckoutService.setPaymentMethod({
          cardNumber: '4242 4242 4242 4242',
          expirationDate: '12/99',
          cvv: '123',
          cardholderName: 'Stripe Payment',
          isDefault: false,
        });

        paymentResult = {
          success: true,
          orderId,
          confirmationNumber: `CONF-${Date.now()}`,
        };
      } else {
        // Save payment method for non-Stripe flow
        CheckoutService.setPaymentMethod(paymentMethod);
        paymentResult = await PaymentService.processPayment(paymentMethod, totals.total, orderId);
      }

      if (!paymentResult.success) {
        Alert.alert('Payment Failed', paymentResult.error || 'Payment processing failed');
        CheckoutService.setProcessing(false);
        setIsLoading(false);
        return;
      }

      // Payment successful - proceed to confirmation
      CheckoutService.proceedToNextStep();
      navigation.navigate('Confirmation', {
        orderId: paymentResult.orderId,
        confirmationNumber: paymentResult.confirmationNumber,
      });
    } catch (error) {
      console.error('Error processing payment:', error);
      Alert.alert('Error', 'An unexpected error occurred');
      CheckoutService.setProcessing(false);
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
      style={PaymentMethodStyles.container}
    >
      <ScrollView
        contentContainerStyle={PaymentMethodStyles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={PaymentMethodStyles.title}>Payment Method</Text>
        <Text style={PaymentMethodStyles.subtitle}>
          {stripeEnabled ? 'Secure checkout powered by Stripe' : 'Enter your card details'}
        </Text>

        {!stripeEnabled && (
          <>
            {/* Cardholder Name */}
            <View style={PaymentMethodStyles.fieldContainer}>
              <Text style={PaymentMethodStyles.label}>Cardholder Name *</Text>
              <TextInput
                style={[
                  PaymentMethodStyles.input,
                  errors.cardholderName && PaymentMethodStyles.inputError,
                ]}
                placeholder="John Doe"
                value={paymentMethod.cardholderName}
                onChangeText={value => handleFieldChange('cardholderName', value)}
                editable={!isLoading}
              />
              {errors.cardholderName && (
                <Text style={PaymentMethodStyles.errorText}>{errors.cardholderName}</Text>
              )}
            </View>

            {/* Card Number */}
            <View style={PaymentMethodStyles.fieldContainer}>
              <Text style={PaymentMethodStyles.label}>Card Number *</Text>
              <TextInput
                style={[
                  PaymentMethodStyles.input,
                  errors.cardNumber && PaymentMethodStyles.inputError,
                ]}
                placeholder="4242 4242 4242 4242"
                value={paymentMethod.cardNumber}
                onChangeText={value => handleFieldChange('cardNumber', value)}
                keyboardType="numeric"
                maxLength={19}
                editable={!isLoading}
              />
              {errors.cardNumber && (
                <Text style={PaymentMethodStyles.errorText}>{errors.cardNumber}</Text>
              )}
            </View>

            {/* Expiration Date and CVV Row */}
            <View style={PaymentMethodStyles.rowContainer}>
              <View style={[PaymentMethodStyles.fieldContainer, PaymentMethodStyles.halfWidth]}>
                <Text style={PaymentMethodStyles.label}>Expiration Date *</Text>
                <TextInput
                  style={[
                    PaymentMethodStyles.input,
                    errors.expirationDate && PaymentMethodStyles.inputError,
                  ]}
                  placeholder="MM/YY"
                  value={paymentMethod.expirationDate}
                  onChangeText={value => handleFieldChange('expirationDate', value)}
                  keyboardType="numeric"
                  maxLength={5}
                  editable={!isLoading}
                />
                {errors.expirationDate && (
                  <Text style={PaymentMethodStyles.errorText}>{errors.expirationDate}</Text>
                )}
              </View>

              <View style={[PaymentMethodStyles.fieldContainer, PaymentMethodStyles.halfWidth]}>
                <Text style={PaymentMethodStyles.label}>CVV *</Text>
                <TextInput
                  style={[PaymentMethodStyles.input, errors.cvv && PaymentMethodStyles.inputError]}
                  placeholder="123"
                  value={paymentMethod.cvv}
                  onChangeText={value => handleFieldChange('cvv', value)}
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry
                  editable={!isLoading}
                />
                {errors.cvv && <Text style={PaymentMethodStyles.errorText}>{errors.cvv}</Text>}
              </View>
            </View>

            {/* Save Payment Method Checkbox */}
            <View style={PaymentMethodStyles.checkboxContainer}>
              <Switch
                value={paymentMethod.isDefault || false}
                onValueChange={value => handleFieldChange('isDefault', value)}
                disabled={isLoading}
              />
              <Text style={PaymentMethodStyles.checkboxLabel}>Save this card for future use</Text>
            </View>
          </>
        )}

        {/* Order Summary */}
        <View style={PaymentMethodStyles.summaryContainer}>
          <Text style={PaymentMethodStyles.summaryTitle}>Order Summary</Text>

          <View style={PaymentMethodStyles.summaryRow}>
            <Text style={PaymentMethodStyles.summaryLabel}>Subtotal:</Text>
            <Text style={PaymentMethodStyles.summaryValue}>${totals.subtotal.toFixed(2)}</Text>
          </View>

          <View style={PaymentMethodStyles.summaryRow}>
            <Text style={PaymentMethodStyles.summaryLabel}>Tax:</Text>
            <Text style={PaymentMethodStyles.summaryValue}>${totals.tax.toFixed(2)}</Text>
          </View>

          <View style={PaymentMethodStyles.summaryRow}>
            <Text style={PaymentMethodStyles.summaryLabel}>Shipping:</Text>
            <Text style={PaymentMethodStyles.summaryValue}>${totals.shipping.toFixed(2)}</Text>
          </View>

          <View style={[PaymentMethodStyles.summaryRow, PaymentMethodStyles.totalRow]}>
            <Text style={PaymentMethodStyles.totalLabel}>Total:</Text>
            <Text style={PaymentMethodStyles.totalValue}>${totals.total.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={PaymentMethodStyles.buttonContainer}>
        <TouchableOpacity
          style={PaymentMethodStyles.backButton}
          onPress={handleGoBack}
          disabled={isLoading}
        >
          <Text style={PaymentMethodStyles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            PaymentMethodStyles.proceedButton,
            isLoading && PaymentMethodStyles.proceedButtonDisabled,
          ]}
          onPress={handleCompletePayment}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={PaymentMethodStyles.proceedButtonText}>Complete Purchase</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};
