import { Tabs } from 'expo-router';
import React from 'react';
import { LayoutDashboard, Users, Wallet, BarChart3, User } from 'lucide-react-native';

import { HapticTab } from '@/components/haptic-tab';
import { useTheme } from '../../src/theme/ThemeContext';

export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarLabelStyle: {
          fontFamily: 'PlusJakartaSans-SemiBold',
          fontSize: 10,
          marginTop: -2,
        },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => {
            const Icon = LayoutDashboard as any;
            return <Icon size={20} color={color} />;
          },
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Groups',
          tabBarIcon: ({ color }) => {
            const Icon = Users as any;
            return <Icon size={20} color={color} />;
          },
        }}
      />
      <Tabs.Screen
        name="personal"
        options={{
          title: 'Personal',
          tabBarIcon: ({ color }) => {
            const Icon = Wallet as any;
            return <Icon size={20} color={color} />;
          },
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color }) => {
            const Icon = BarChart3 as any;
            return <Icon size={20} color={color} />;
          },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => {
            const Icon = User as any;
            return <Icon size={20} color={color} />;
          },
        }}
      />
    </Tabs>
  );
}
