import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView 
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';

import { registerSchema, RegisterFields } from '../../src/features/auth/schemas/authSchema';
import { authService } from '../../src/services/authService';
import { Colors } from '../../src/theme/theme';
import { useTheme } from '../../src/theme/ThemeContext';
import { Button } from '../../src/components/common/Button';
import { Input } from '../../src/components/common/Input';
import { Card } from '../../src/components/common/Card';

export default function RegisterScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<RegisterFields>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: RegisterFields) => {
    setIsLoading(true);
    setServerError(null);
    setSuccessMessage(null);
    try {
      const response = await authService.register(data);
      setSuccessMessage(response || 'Registered successfully! Please login.');
      setTimeout(() => {
        router.replace('/(auth)/login');
      }, 2000);
    } catch (error: any) {
      if (error.response && error.response.data) {
        setServerError(
          typeof error.response.data === 'string'
            ? error.response.data
            : error.response.data.message || 'Registration failed'
        );
      } else {
        setServerError('Cannot connect to server. Check your network.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={[styles.keyboardView, { backgroundColor: colors.background }]}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.logo, { color: colors.text }]}>Expense<Text style={[styles.logoHighlight, { color: colors.primary }]}>OS</Text></Text>
          <Text style={[styles.tagline, { color: colors.muted }]}>Join the Premium Expense Platform</Text>
        </View>

        <Card style={styles.formContainer}>
          <Text style={[styles.formTitle, { color: colors.text }]}>Create Account</Text>
          <Text style={[styles.formSubtitle, { color: colors.muted }]}>Get started with a free account today</Text>

          {serverError && (
            <View style={[styles.errorBanner, { backgroundColor: colors.error + '10', borderColor: colors.error + '25' }]}>
              <Text style={[styles.errorBannerText, { color: colors.error }]}>{serverError}</Text>
            </View>
          )}

          {successMessage && (
            <View style={[styles.successBanner, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '25' }]}>
              <Text style={[styles.successBannerText, { color: colors.primary }]}>{successMessage}</Text>
            </View>
          )}

          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Full Name"
                placeholder="John Doe"
                autoCapitalize="words"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.name?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Email Address"
                placeholder="name@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.email?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Password"
                placeholder="Min. 6 characters"
                secureTextEntry
                autoCapitalize="none"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.password?.message}
              />
            )}
          />

          <Button
            title="Register Account"
            onPress={handleSubmit(onSubmit)}
            isLoading={isLoading}
            style={styles.registerButton}
          />

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.muted }]}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={[styles.footerLink, { color: colors.primary }]}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logo: {
    fontSize: 40,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  logoHighlight: {
    color: Colors.primary,
  },
  tagline: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.muted,
    marginTop: 8,
    letterSpacing: 0.5,
  },
  formContainer: {
    padding: 24,
    marginBottom: 0,
  },
  formTitle: {
    fontSize: 24,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  formSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.muted,
    marginBottom: 24,
  },
  errorBanner: {
    backgroundColor: 'rgba(255, 107, 107, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.15)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  errorBannerText: {
    color: Colors.error,
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  successBanner: {
    backgroundColor: 'rgba(215, 255, 63, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(215, 255, 63, 0.15)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  successBannerText: {
    color: Colors.primary,
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  registerButton: {
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    color: Colors.muted,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  footerLink: {
    color: Colors.primary,
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 14,
  },
});
