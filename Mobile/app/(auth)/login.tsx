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

import { loginSchema, LoginFields } from '../../src/features/auth/schemas/authSchema';
import { authService } from '../../src/services/authService';
import { useAuth } from '../../src/store/authContext';
import { userService } from '../../src/services/userService';
import { setStorageItem, StorageKeys } from '../../src/store/storage';
import { Colors } from '../../src/theme/theme';
import { useTheme } from '../../src/theme/ThemeContext';
import { Button } from '../../src/components/common/Button';
import { Input } from '../../src/components/common/Input';
import { Card } from '../../src/components/common/Card';
import { Logo } from '../../src/components/common/Logo';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const { colors } = useTheme();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<LoginFields>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFields) => {
    setIsLoading(true);
    setServerError(null);
    try {
      const response = await authService.login(data);
      setStorageItem(StorageKeys.ACCESS_TOKEN, response.accessToken);
      const profile = await userService.getCurrentUser();
      
      login(response.accessToken, {
        id: profile.id.toString(), 
        name: profile.name,
        email: profile.email,
      });
    } catch (error: any) {
      if (error.response && error.response.data) {
        setServerError(
          typeof error.response.data === 'string'
            ? error.response.data
            : error.response.data.message || 'Login failed'
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
          <View style={{ marginBottom: 16 }}>
            <Logo size={72} color={colors.primary} />
          </View>
          <Text style={[styles.logo, { color: colors.text }]}>Expense<Text style={[styles.logoHighlight, { color: colors.primary }]}>OS</Text></Text>
          <Text style={[styles.tagline, { color: colors.muted }]}>Premium Financial Operating System</Text>
        </View>

        <Card style={styles.formContainer}>
          <Text style={[styles.formTitle, { color: colors.text }]}>Welcome back</Text>
          <Text style={[styles.formSubtitle, { color: colors.muted }]}>Sign in to your private financial account</Text>

          {serverError && (
            <View style={[styles.errorBanner, { backgroundColor: colors.error + '10', borderColor: colors.error + '25' }]}>
              <Text style={[styles.errorBannerText, { color: colors.error }]}>{serverError}</Text>
            </View>
          )}

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
                placeholder="••••••••"
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
            title="Sign In"
            onPress={handleSubmit(onSubmit)}
            isLoading={isLoading}
            style={styles.signInButton}
          />

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.muted }]}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text style={[styles.footerLink, { color: colors.primary }]}>Register</Text>
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
    marginBottom: 40,
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
  signInButton: {
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
