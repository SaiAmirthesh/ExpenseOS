import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Modal,
  Switch,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  User as UserIcon,
  Lock,
  Bell,
  Palette,
  LogOut,
  ChevronRight,
  ShieldCheck,
  HelpCircle,
  X,
  Check,
  ChevronDown,
  ChevronUp
} from 'lucide-react-native';
import { useAuth } from '../../src/store/authContext';
import { useTheme } from '../../src/theme/ThemeContext';
import { Colors } from '../../src/theme/theme';
import { authService } from '../../src/services/authService';
import { Card } from '../../src/components/common/Card';
import { Avatar } from '../../src/components/common/Avatar';
import { Input } from '../../src/components/common/Input';
import { Button } from '../../src/components/common/Button';
import { getStorageItem, setStorageItem } from '../../src/store/storage';

const ChevronRightIcon = ChevronRight as any;
const UserIconComp = UserIcon as any;
const LockIcon = Lock as any;
const BellIcon = Bell as any;
const PaletteIcon = Palette as any;
const LogOutIcon = LogOut as any;
const ShieldCheckIcon = ShieldCheck as any;
const HelpCircleIcon = HelpCircle as any;
const XIcon = X as any;
const CheckIcon = Check as any;
const ChevronDownIcon = ChevronDown as any;
const ChevronUpIcon = ChevronUp as any;

type ModalType = 'ACCOUNT' | 'SECURITY' | 'NOTIFICATIONS' | 'APPEARANCE' | 'PRIVACY' | 'SUPPORT' | null;

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuth();
  const { colors, themeMode, updateThemeMode } = useTheme();
  const insets = useSafeAreaInsets();

  // State for functional features
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [displayName, setDisplayName] = useState(user.name || 'Premium User');

  // Account Form
  const [editName, setEditName] = useState(user.name || '');
  const [accountSuccess, setAccountSuccess] = useState(false);

  // Security Form
  const [currPassword, setCurrPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityError, setSecurityError] = useState<string | null>(null);
  const [securitySuccess, setSecuritySuccess] = useState(false);
  const [securityLoading, setSecurityLoading] = useState(false);

  // Notification Toggles
  const [pushEnabled, setPushEnabled] = useState(() => getStorageItem('profile.push') !== 'false');
  const [budgetEnabled, setBudgetEnabled] = useState(() => getStorageItem('profile.budget') !== 'false');
  const [debtEnabled, setDebtEnabled] = useState(() => getStorageItem('profile.debt') !== 'false');

  // FAQs Accordion States
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Sync display name if user details load after mount
  useEffect(() => {
    if (user.name) {
      setDisplayName(user.name);
      setEditName(user.name);
    }
  }, [user]);

  // Handle Account Form Save
  const handleSaveAccount = () => {
    if (!editName.trim()) return;
    updateUser({ name: editName });
    setDisplayName(editName);
    setAccountSuccess(true);
    setTimeout(() => {
      setAccountSuccess(false);
      setActiveModal(null);
    }, 1500);
  };

  // Handle Security Form Save
  const handleSaveSecurity = async () => {
    setSecurityError(null);
    if (!currPassword || !newPassword || !confirmPassword) {
      setSecurityError('All fields are required.');
      return;
    }
    if (newPassword.length < 6) {
      setSecurityError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setSecurityError('Passwords do not match.');
      return;
    }

    setSecurityLoading(true);
    try {
      await authService.changePassword({
        currentPassword: currPassword,
        newPassword,
        confirmPassword,
      });
      setSecuritySuccess(true);
      setCurrPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setSecuritySuccess(false);
        setActiveModal(null);
      }, 1500);
    } catch (error: any) {
      const msg = error.response?.data?.message || error.response?.data || 'Failed to change password.';
      setSecurityError(typeof msg === 'string' ? msg : 'Failed to change password.');
    } finally {
      setSecurityLoading(false);
    }
  };

  // Handle Notification Toggle Change
  const handleTogglePush = (val: boolean) => {
    setPushEnabled(val);
    setStorageItem('profile.push', String(val));
  };
  const handleToggleBudget = (val: boolean) => {
    setBudgetEnabled(val);
    setStorageItem('profile.budget', String(val));
  };
  const handleToggleDebt = (val: boolean) => {
    setDebtEnabled(val);
    setStorageItem('profile.debt', String(val));
  };

  const menuItems = [
    { icon: UserIconComp, label: 'Account Details', desc: 'Personal information & email', action: () => { setEditName(displayName); setActiveModal('ACCOUNT'); } },
    { icon: LockIcon, label: 'Security & Access', desc: 'Change password & PIN', action: () => { setSecurityError(null); setActiveModal('SECURITY'); } },
    { icon: BellIcon, label: 'Notifications', desc: 'Alerts & budget warnings', action: () => { setActiveModal('NOTIFICATIONS'); } },
    { icon: PaletteIcon, label: 'Appearance', desc: 'Change background theme (navy, black, white)', action: () => { setActiveModal('APPEARANCE'); } },
    { icon: ShieldCheckIcon, label: 'Privacy Policy', desc: 'Data control & usage settings', action: () => { setActiveModal('PRIVACY'); } },
    { icon: HelpCircleIcon, label: 'Help & Support', desc: 'FAQs & troubleshooting', action: () => { setActiveModal('SUPPORT'); } },
  ];

  const faqs = [
    { q: 'How do I split an expense?', a: 'Navigate to the Groups tab, tap on your group, select "Add Bill", enter the amount, and choose your split schema (Equal, Exact, or Percentage).' },
    { q: 'Can I export my transaction ledger?', a: 'Yes! Export options are available on the web dashboard of ExpenseOS by logging into your account.' },
    { q: 'Is my data secure?', a: 'Absolutely. All communications with our servers are encrypted via TLS, and confidential personal vault tokens are stored locally on your device using secure storage.' },
    { q: 'How do I invite members to a group?', a: 'Open the specific group page, switch to the "Members" tab, type in your friend\'s email address, and tap the invite button.' },
  ];

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.background, paddingTop: Math.max(insets.top, 16) }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>My Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Premium Account Card */}
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <Avatar name={displayName} size={56} style={styles.avatar} />
            <View style={styles.profileDetails}>
              <Text style={[styles.userName, { color: colors.text }]}>{displayName}</Text>
              <Text style={[styles.userEmail, { color: colors.muted }]}>{user?.email || 'user@expenseos.com'}</Text>
            </View>
          </View>
          <View style={styles.badgeRow}>
            <View style={[styles.memberBadge, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}>
              <Text style={[styles.badgeText, { color: colors.primary }]}>PREMIUM USER</Text>
            </View>
          </View>
        </Card>

        {/* Menu Items */}
        <Card style={styles.menuCard}>
          {menuItems.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.menuItem,
                  index > 0 && [styles.menuItemBorder, { borderTopColor: colors.border }],
                ]}
                activeOpacity={0.7}
                onPress={item.action}
              >
                <View style={styles.menuItemLeft}>
                  <View style={[styles.iconContainer, { backgroundColor: colors.primary + '08', borderColor: colors.primary + '15' }]}>
                    <IconComponent size={20} color={colors.primary} />
                  </View>
                  <View style={styles.menuItemInfo}>
                    <Text style={[styles.menuItemLabel, { color: colors.text }]}>{item.label}</Text>
                    <Text style={[styles.menuItemDesc, { color: colors.muted }]}>{item.desc}</Text>
                  </View>
                </View>
                <ChevronRightIcon size={16} color={colors.muted} />
              </TouchableOpacity>
            );
          })}
        </Card>

        {/* Log Out Button */}
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: colors.error + '10', borderColor: colors.error + '25' }]}
          onPress={logout}
          activeOpacity={0.8}
        >
          <LogOutIcon size={18} color={colors.error} />
          <Text style={[styles.logoutText, { color: colors.error }]}>Log Out</Text>
        </TouchableOpacity>

        <Text style={[styles.versionText, { color: colors.muted }]}>ExpenseOS Mobile v1.0.0 (Production)</Text>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* -------------------- SETTINGS MODALS -------------------- */}

      {/* 1. Account Details Modal */}
      <Modal visible={activeModal === 'ACCOUNT'} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Account Details</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <XIcon size={20} color={colors.muted} />
              </TouchableOpacity>
            </View>

            {accountSuccess && (
              <View style={[styles.successBanner, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}>
                <CheckIcon size={16} color={colors.primary} />
                <Text style={[styles.bannerText, { color: colors.primary }]}>Account details updated successfully!</Text>
              </View>
            )}

            <Input
              label="Full Name"
              value={editName}
              onChangeText={setEditName}
              placeholder="Enter your name"
            />
            <Input
              label="Email Address (read-only)"
              value={user?.email || ''}
              editable={false}
              style={{ opacity: 0.6 }}
            />
            <Button
              title="Save Changes"
              onPress={handleSaveAccount}
              style={[styles.modalActionBtn, { backgroundColor: colors.primary }]}
              textStyle={colors.primary === '#D7FF3F' ? { color: '#000' } : { color: '#FFF' }}
            />
          </View>
        </View>
      </Modal>

      {/* 2. Security Modal */}
      <Modal visible={activeModal === 'SECURITY'} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Security & Access</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <XIcon size={20} color={colors.muted} />
              </TouchableOpacity>
            </View>

            {securityError && (
              <View style={[styles.errorBanner, { backgroundColor: colors.error + '10', borderColor: colors.error + '25' }]}>
                <Text style={[styles.errorText, { color: colors.error }]}>{securityError}</Text>
              </View>
            )}

            {securitySuccess && (
              <View style={[styles.successBanner, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}>
                <CheckIcon size={16} color={colors.primary} />
                <Text style={[styles.bannerText, { color: colors.primary }]}>Password updated successfully!</Text>
              </View>
            )}

            <Input
              label="Current Password"
              placeholder="••••••••"
              secureTextEntry
              value={currPassword}
              onChangeText={setCurrPassword}
            />
            <Input
              label="New Password"
              placeholder="••••••••"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <Input
              label="Confirm New Password"
              placeholder="••••••••"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            <Button
              title="Change Password"
              onPress={handleSaveSecurity}
              isLoading={securityLoading}
              style={[styles.modalActionBtn, { backgroundColor: colors.primary }]}
              textStyle={colors.primary === '#D7FF3F' ? { color: '#000' } : { color: '#FFF' }}
            />
          </View>
        </View>
      </Modal>

      {/* 3. Notifications Modal */}
      <Modal visible={activeModal === 'NOTIFICATIONS'} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Notification Settings</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <XIcon size={20} color={colors.muted} />
              </TouchableOpacity>
            </View>

            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Text style={[styles.toggleLabel, { color: colors.text }]}>Push Notifications</Text>
                <Text style={[styles.toggleDesc, { color: colors.muted }]}>Receive instant bill split requests</Text>
              </View>
              <Switch
                value={pushEnabled}
                onValueChange={handleTogglePush}
                thumbColor={pushEnabled ? colors.primary : '#FFF'}
                trackColor={{ true: colors.primary + '33', false: colors.surface }}
              />
            </View>

            <View style={[styles.toggleRow, styles.menuItemBorder, { borderTopColor: colors.border }]}>
              <View style={styles.toggleInfo}>
                <Text style={[styles.toggleLabel, { color: colors.text }]}>Budget Alerts</Text>
                <Text style={[styles.toggleDesc, { color: colors.muted }]}>Alert when spending exceeds 80% of target</Text>
              </View>
              <Switch
                value={budgetEnabled}
                onValueChange={handleToggleBudget}
                thumbColor={budgetEnabled ? colors.primary : '#FFF'}
                trackColor={{ true: colors.primary + '33', false: colors.surface }}
              />
            </View>

            <View style={[styles.toggleRow, styles.menuItemBorder, { borderTopColor: colors.border }]}>
              <View style={styles.toggleInfo}>
                <Text style={[styles.toggleLabel, { color: colors.text }]}>Debt Reminders</Text>
                <Text style={[styles.toggleDesc, { color: colors.muted }]}>Daily reminders for pending settlements</Text>
              </View>
              <Switch
                value={debtEnabled}
                onValueChange={handleToggleDebt}
                thumbColor={debtEnabled ? colors.primary : '#FFF'}
                trackColor={{ true: colors.primary + '33', false: colors.surface }}
              />
            </View>

            <Button
              title="Close"
              onPress={() => setActiveModal(null)}
              style={[styles.modalActionBtn, { backgroundColor: colors.primary }]}
              textStyle={colors.primary === '#D7FF3F' ? { color: '#000' } : { color: '#FFF' }}
            />
          </View>
        </View>
      </Modal>

      {/* 4. Appearance Modal */}
      <Modal visible={activeModal === 'APPEARANCE'} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Background Theme</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <XIcon size={20} color={colors.muted} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalSubtext, { color: colors.muted }]}>Choose your preferred financial application backdrop.</Text>

            <View style={styles.themePickerContainer}>
              {[
                { name: 'Navy Blue (Default)', value: 'navy', bg: '#0B1020', accent: '#D7FF3F' },
                { name: 'Pure Black', value: 'black', bg: '#000000', accent: '#D7FF3F' },
                { name: 'Light White', value: 'white', bg: '#F3F4F6', accent: '#0052FF' }
              ].map((t) => (
                <TouchableOpacity
                  key={t.value}
                  style={[
                    styles.themeOptionCard,
                    { backgroundColor: t.bg, borderColor: themeMode === t.value ? t.accent : colors.border }
                  ]}
                  onPress={() => updateThemeMode(t.value as any)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.themeOptionText, { color: t.value === 'white' ? '#111827' : '#FFFFFF' }]}>
                    {t.name}
                  </Text>
                  <View style={[styles.themeOptionDot, { backgroundColor: t.accent }]} />
                </TouchableOpacity>
              ))}
            </View>

            <Button
              title="Confirm Theme"
              onPress={() => setActiveModal(null)}
              style={[styles.modalActionBtn, { backgroundColor: colors.primary }]}
              textStyle={colors.primary === '#D7FF3F' ? { color: '#000' } : { color: '#FFF' }}
            />
          </View>
        </View>
      </Modal>

      {/* 5. Privacy Policy Modal */}
      <Modal visible={activeModal === 'PRIVACY'} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Privacy Policy</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <XIcon size={20} color={colors.muted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 300, marginBottom: 20 }}>
              <Text style={[styles.privacyHeading, { color: colors.text }]}>1. Data Security</Text>
              <Text style={[styles.privacyText, { color: colors.muted }]}>
                We take security seriously. All personal transactions, group balances, and account logs are protected with industrial-grade bank level encryption.
              </Text>
              <Text style={[styles.privacyHeading, { color: colors.text }]}>2. Local Storage</Text>
              <Text style={[styles.privacyText, { color: colors.muted }]}>
                Information regarding auth keys, settings configurations, and device settings are cached locally on your device via secure MMKV components.
              </Text>
              <Text style={[styles.privacyHeading, { color: colors.text }]}>3. Contact & Terms</Text>
              <Text style={[styles.privacyText, { color: colors.muted }]}>
                For queries regarding your financial records deletion or account deactivation, reach out to legal@expenseos.com.
              </Text>
            </ScrollView>

            <Button
              title="Acknowledge"
              onPress={() => setActiveModal(null)}
              style={[styles.modalActionBtn, { backgroundColor: colors.primary }]}
              textStyle={colors.primary === '#D7FF3F' ? { color: '#000' } : { color: '#FFF' }}
            />
          </View>
        </View>
      </Modal>

      {/* 6. Help & Support Modal */}
      <Modal visible={activeModal === 'SUPPORT'} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Help & FAQs</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <XIcon size={20} color={colors.muted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 300, marginBottom: 20 }}>
              {faqs.map((faq, idx) => {
                const isExpanded = expandedFaq === idx;
                return (
                  <View key={idx} style={[styles.faqItem, idx > 0 && [styles.menuItemBorder, { borderTopColor: colors.border }]]}>
                    <TouchableOpacity
                      style={styles.faqHeader}
                      onPress={() => setExpandedFaq(isExpanded ? null : idx)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.faqQuestion, { color: colors.text }]}>{faq.q}</Text>
                      {isExpanded ? (
                        <ChevronUpIcon size={16} color={colors.primary} />
                      ) : (
                        <ChevronDownIcon size={16} color={colors.muted} />
                      )}
                    </TouchableOpacity>
                    {isExpanded && (
                      <Text style={[styles.faqAnswer, { color: colors.muted }]}>{faq.a}</Text>
                    )}
                  </View>
                );
              })}
            </ScrollView>

            <Button
              title="Email Support"
              onPress={() => Alert.alert('Support Request', 'Support ticket opened at support@expenseos.com')}
              style={[styles.modalActionBtn, { backgroundColor: colors.primary }]}
              textStyle={colors.primary === '#D7FF3F' ? { color: '#000' } : { color: '#FFF' }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#FFFFFF',
  },
  container: {
    paddingHorizontal: 24,
  },
  profileCard: {
    padding: 20,
    marginBottom: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    marginRight: 16,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  profileDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#FFFFFF',
  },
  userEmail: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: Colors.muted,
    marginTop: 4,
  },
  badgeRow: {
    flexDirection: 'row',
  },
  memberBadge: {
    backgroundColor: 'rgba(215, 255, 63, 0.08)',
    borderColor: 'rgba(215, 255, 63, 0.15)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 9,
    fontFamily: 'PlusJakartaSans-Bold',
    letterSpacing: 0.5,
  },
  menuCard: {
    paddingVertical: 8,
    paddingHorizontal: 0,
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  menuItemBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(215, 255, 63, 0.03)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)'
  },
  menuItemInfo: {
    flex: 1,
  },
  menuItemLabel: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-SemiBold',
    color: '#FFFFFF',
  },
  menuItemDesc: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: Colors.muted,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 107, 107, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.15)',
    marginBottom: 24,
  },
  logoutText: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans-SemiBold',
    color: Colors.error,
  },
  versionText: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: Colors.muted,
    textAlign: 'center',
    opacity: 0.6,
  },
  // Modal layout
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 16, 32, 0.85)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#FFFFFF',
  },
  modalSubtext: {
    color: Colors.muted,
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginBottom: 16,
  },
  modalActionBtn: {
    marginTop: 16,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(215, 255, 63, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(215, 255, 63, 0.15)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorBanner: {
    backgroundColor: 'rgba(255, 107, 107, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.15)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: Colors.error,
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  bannerText: {
    color: Colors.primary,
    fontSize: 13,
    fontFamily: 'Inter-Regular',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  toggleInfo: {
    flex: 1,
    marginRight: 16,
  },
  toggleLabel: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-SemiBold',
    color: '#FFFFFF',
  },
  toggleDesc: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: Colors.muted,
    marginTop: 4,
  },
  themePickerContainer: {
    gap: 12,
    marginVertical: 16,
  },
  themeOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
  },
  themeOptionText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 14,
  },
  themeOptionDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  privacyHeading: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#FFFFFF',
    marginTop: 12,
    marginBottom: 6,
  },
  privacyText: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: Colors.muted,
    lineHeight: 18,
  },
  faqItem: {
    paddingVertical: 12,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-SemiBold',
    color: '#FFFFFF',
    flex: 1,
    marginRight: 12,
  },
  faqAnswer: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: Colors.muted,
    marginTop: 8,
    lineHeight: 18,
  },
});
