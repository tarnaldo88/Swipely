import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList, SignUpData } from '../../types';
import { getAuthService } from '../../services';

type SignUpScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'SignUp'>;

interface Props {
  navigation: SignUpScreenNavigationProp;
}

export const SignUpScreen: React.FC<Props> = ({ navigation }) => {
  const [signUpData, setSignUpData] = useState<SignUpData>({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
    provider: 'email',
    acceptTerms: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [registrationMethod, setRegistrationMethod] = useState<'email' | 'phone'>('email');

  const validateForm = (): boolean => {
    if (!signUpData.displayName.trim()) {
      Alert.alert('Error', 'Please enter your display name');
      return false;
    }

    if (registrationMethod === 'email') {
      if (!signUpData.email || !signUpData.email.includes('@')) {
        Alert.alert('Error', 'Please enter a valid email address');
        return false;
      }
    } else {
      if (!signUpData.phone || signUpData.phone.length < 10) {
        Alert.alert('Error', 'Please enter a valid phone number');
        return false;
      }
    }

    if (!signUpData.password || signUpData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return false;
    }

    if (signUpData.password !== signUpData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }

    if (!signUpData.acceptTerms) {
      Alert.alert('Error', 'Please accept the terms and conditions');
      return false;
    }

    return true;
  };

  const handleSignUp = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const authService = getAuthService();
      
      const result = await authService.signUp(signUpData);
      
      // Navigation to main app will be handled by the root navigator
      // based on authentication state
      console.log('Sign up successful:', result.user.displayName);
    } catch (error: any) {
      console.error('Sign up error:', error);
      Alert.alert('Error', error.message || 'Sign up failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialSignUp = async (provider: 'google' | 'facebook' | 'apple') => {
    setIsLoading(true);
    try {
      const authService = getAuthService();
      
      // For now, social sign up will use a placeholder implementation
      // In a real app, this would integrate with platform-specific social auth
      const socialSignUpData: SignUpData = {
        displayName: `${provider} User`, // Placeholder
        email: `${provider}@example.com`, // Placeholder
        password: 'social_auth_token', // Placeholder
        confirmPassword: 'social_auth_token', // Placeholder
        provider,
        acceptTerms: true,
      };
      
      const result = await authService.signUp(socialSignUpData);
      console.log(`${provider} sign up successful:`, result.user.displayName);
    } catch (error: any) {
      console.error(`${provider} sign up error:`, error);
      Alert.alert('Error', `${provider} sign up failed. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSignUpData = (field: keyof SignUpData, value: string | boolean) => {
    setSignUpData(prev => ({
      ...prev,
      [field]: value,
      provider: registrationMethod,
    }));
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Image source={require('../../../assets/SwipelyLogo.png')} style={styles.logo} />
          <Text style={styles.title}>Join Swipely</Text>
          <Text style={styles.subtitle}>Create your account to start discovering</Text>
        </View>

        <View style={styles.form}>
          {/* Registration method toggle */}
          <View style={styles.methodToggle}>
            <TouchableOpacity
              style={[styles.methodButton, registrationMethod === 'email' && styles.methodButtonActive]}
              onPress={() => setRegistrationMethod('email')}
            >
              <Text style={[styles.methodButtonText, registrationMethod === 'email' && styles.methodButtonTextActive]}>
                Email
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.methodButton, registrationMethod === 'phone' && styles.methodButtonActive]}
              onPress={() => setRegistrationMethod('phone')}
            >
              <Text style={[styles.methodButtonText, registrationMethod === 'phone' && styles.methodButtonTextActive]}>
                Phone
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form inputs */}
          <TextInput
            style={styles.input}
            placeholder="Display Name"
            value={signUpData.displayName}
            onChangeText={(value) => updateSignUpData('displayName', value)}
            autoCapitalize="words"
            autoCorrect={false}
          />

          <TextInput
            style={styles.input}
            placeholder={registrationMethod === 'email' ? 'Email address' : 'Phone number'}
            value={registrationMethod === 'email' ? signUpData.email : signUpData.phone}
            onChangeText={(value) => updateSignUpData(registrationMethod, value)}
            keyboardType={registrationMethod === 'email' ? 'email-address' : 'phone-pad'}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            value={signUpData.password}
            onChangeText={(value) => updateSignUpData('password', value)}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            value={signUpData.confirmPassword}
            onChangeText={(value) => updateSignUpData('confirmPassword', value)}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/* Terms and conditions */}
          <TouchableOpacity
            style={styles.termsContainer}
            onPress={() => updateSignUpData('acceptTerms', !signUpData.acceptTerms)}
          >
            <View style={[styles.checkbox, signUpData.acceptTerms && styles.checkboxChecked]}>
              {signUpData.acceptTerms && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.termsText}>
              I agree to the <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.signUpButton, isLoading && styles.signUpButtonDisabled]}
            onPress={handleSignUp}
            disabled={isLoading}
          >
            <Text style={styles.signUpButtonText}>
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Text>
          </TouchableOpacity>

          {/* Social sign up options */}
          <View style={styles.socialSection}>
            <Text style={styles.orText}>Or sign up with</Text>
            
            <View style={styles.socialButtons}>
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => handleSocialSignUp('google')}
              >
                <Text style={styles.socialButtonText}>Google</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => handleSocialSignUp('facebook')}
              >
                <Text style={styles.socialButtonText}>Facebook</Text>
              </TouchableOpacity>
              
              {Platform.OS === 'ios' && (
                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={() => handleSocialSignUp('apple')}
                >
                  <Text style={styles.socialButtonText}>Apple</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Sign in link */}
          <View style={styles.signInSection}>
            <Text style={styles.signInText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.signInLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  logo: {
    width: 240,
    height: 120,
    marginBottom: 10,
    resizeMode: 'contain',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: "#221e27",
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#d8c0fc',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#08f88c',
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  methodToggle: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 4,
  },
  methodButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  methodButtonActive: {
    backgroundColor: '#08f88c',
  },
  methodButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  methodButtonTextActive: {
    color: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#08f88c',
    borderColor: '#007AFF',
  },
  checkmark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: '#08f88c',
    lineHeight: 20,
  },
  termsLink: {
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
  signUpButton: {
    backgroundColor: '#08f88c',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  signUpButtonDisabled: {
    backgroundColor: '#ccc',
  },
  signUpButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  socialSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  orText: {
    color: '#08f88c',
    fontSize: 14,
    marginBottom: 16,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',    
  },
  socialButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor:'#fff',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  socialButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
  signInSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInText: {
    color: '#08f88c',
    fontSize: 14,
  },
  signInLink: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
});