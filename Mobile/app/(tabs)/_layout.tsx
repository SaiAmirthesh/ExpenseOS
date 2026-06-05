import { Tabs } from 'expo-router';
import React from 'react';
import { LayoutDashboard, Users, Wallet } from 'lucide-react-native';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '../../src/theme/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.muted,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 60,
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
            return <Icon size={22} color={color} />;
          },
        }}
      />
      <Tabs.Screen
        name="personal"
        options={{
          title: 'Personal',
          tabBarIcon: ({ color }) => {
            const Icon = Wallet as any;
            return <Icon size={22} color={color} />;
          },
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Groups',
          tabBarIcon: ({ color }) => {
            const Icon = Users as any;
            return <Icon size={22} color={color} />;
          },
        }}
      />
    </Tabs>
  );
}
