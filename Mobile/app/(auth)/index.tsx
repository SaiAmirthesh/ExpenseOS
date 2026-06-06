import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  StatusBar,
  Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../src/components/common/Button';
import { Card } from '../../src/components/common/Card';
import { useTheme } from '../../src/theme/ThemeContext';
import { Colors } from '../../src/theme/theme';

export default function OnboardingScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.primary === '#0052FF' ? 'dark-content' : 'light-content'} />
      
      {/* Background radial effects */}
      <View style={[styles.glowBlob, { backgroundColor: colors.primary + '08' }]} />

      <View style={styles.contentContainer}>
        
        {/* Brand Area */}
        <View className="items-center" style={styles.brandContainer}>
          <View style={styles.logoWrapper}>
            <Image 
              source={require('../../assets/images/logo.png')} 
              style={styles.logoImage} 
              resizeMode="contain"
            />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>
            Expense<Text style={{ color: colors.primary }}>OS</Text>
          </Text>
          <Text style={[styles.tagline, { color: colors.muted }]}>
            Collaborative Finance Vault
          </Text>
        </View>

        {/* Feature Highlights Card */}
        <Card style={styles.featuresCard}>
          <View style={styles.featureRow}>
            <Text style={styles.featureIcon}>💳</Text>
            <View style={styles.featureTextContainer}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>Personal Spending</Text>
              <Text style={[styles.featureDesc, { color: colors.muted }]}>Track your daily velocity ledgers and budgets</Text>
            </View>
          </View>

          <View style={styles.featureRow}>
            <Text style={styles.featureIcon}>👥</Text>
            <View style={styles.featureTextContainer}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>Collaborative Vaults</Text>
              <Text style={[styles.featureDesc, { color: colors.muted }]}>Split group bills equally, exactly, or by percentage</Text>
            </View>
          </View>

          <View style={[styles.featureRow, { marginBottom: 0 }]}>
            <Text style={styles.featureIcon}>⚡</Text>
            <View style={styles.featureTextContainer}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>Optimal Settlements</Text>
              <Text style={[styles.featureDesc, { color: colors.muted }]}>Minimize debts automatically with peer approvals</Text>
            </View>
          </View>
        </Card>

        {/* Buttons / Actions */}
        <View style={styles.actionContainer}>
          <Button
            title="Login / Register"
            onPress={() => router.push('/(auth)/login')}
            style={styles.actionBtn}
          />
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  glowBlob: {
    position: 'absolute',
    top: '10%',
    left: '-20%',
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  brandContainer: {
    alignItems: 'center',
    marginTop: 48,
  },
  logoWrapper: {
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 5,
  },
  logoImage: {
    width: 130,
    height: 130,
    borderRadius: 26,
  },
  title: {
    fontSize: 40,
    fontFamily: 'PlusJakartaSans-Bold',
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    marginTop: 8,
    letterSpacing: 0.5,
  },
  featuresCard: {
    padding: 20,
    marginVertical: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  featureIcon: {
    fontSize: 22,
    marginRight: 16,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  featureDesc: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
    lineHeight: 16,
  },
  actionContainer: {
    width: '100%',
    marginBottom: 16,
  },
  actionBtn: {
    width: '100%',
  },
});
