import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  RefreshControl, 
  TouchableOpacity, 
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Plus, FolderOpen } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../../src/store/authContext';
import { Colors } from '../../src/theme/theme';
import { useTheme } from '../../src/theme/ThemeContext';
import { groupService } from '../../src/services/groupService';
import { Card } from '../../src/components/common/Card';
import { Skeleton } from '../../src/components/common/Skeleton';
import { GroupCard } from '../../src/components/common/GroupCard';
import { EmptyState } from '../../src/components/common/EmptyState';

const PlusIcon = Plus as any;
const FolderOpenIcon = FolderOpen as any;

export default function GroupsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  const { 
    data: groups = [], 
    isLoading, 
    refetch 
  } = useQuery({
    queryKey: ['groups'],
    queryFn: groupService.listGroups,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.background, paddingTop: Math.max(insets.top, 16) }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerSubtitle, { color: colors.muted }]}>COLLABORATIVE VAULTS</Text>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Groups Hub</Text>
        </View>
        <TouchableOpacity 
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/modal')}
          activeOpacity={0.7}
        >
          <PlusIcon size={20} color={colors.primary === '#D7FF3F' ? '#000000' : '#FFFFFF'} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Banner/Stat block */}
        <Card style={[styles.statCard, { borderLeftColor: colors.primary }]} delay={50}>
          <View style={styles.statHeader}>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Total Active Vaults</Text>
            <FolderOpenIcon size={18} color={colors.primary} />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>{groups.length}</Text>
          <Text style={[styles.statSubtext, { color: colors.muted }]}>Start splitting expenses with group members in shared hubs</Text>
        </Card>

        {isLoading ? (
          <View style={styles.listContainer}>
            <Skeleton height={140} style={styles.skeletonCard} />
            <Skeleton height={140} style={styles.skeletonCard} />
            <Skeleton height={140} style={styles.skeletonCard} />
          </View>
        ) : groups.length === 0 ? (
          <EmptyState
            title="No groups created yet"
            description="Create your first shared group hub to divide expenses and settle bills."
            icon={<FolderOpenIcon size={32} color={colors.muted} />}
            actionTitle="Create Group"
            onActionPress={() => router.push('/modal')}
          />
        ) : (
          <View style={styles.listContainer}>
            {groups.map((group, idx) => (
              <GroupCard
                key={group.id}
                name={group.name}
                description={group.description || 'No description provided'}
                tag={group.createdBy === user?.email ? 'OWNER' : 'MEMBER'}
                membersList={[group.createdBy || 'User']}
                activityText="Tap to view transactions ledger"
                onPress={() => router.push(`/groups/${group.id}`)}
                delay={100 + idx * 50}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  headerSubtitle: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans-SemiBold',
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#FFFFFF',
    marginTop: 4,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    paddingHorizontal: 24,
  },
  statCard: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    marginBottom: 20,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans-SemiBold',
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 32,
    fontFamily: 'PlusJakartaSans-ExtraBold',
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  statSubtext: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: Colors.muted,
    lineHeight: 16,
  },
  listContainer: {
    gap: 12,
  },
  skeletonCard: {
    borderRadius: 20,
    marginBottom: 12,
  },
});
