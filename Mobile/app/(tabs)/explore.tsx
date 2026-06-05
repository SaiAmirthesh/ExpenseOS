import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  RefreshControl, 
  TouchableOpacity, 
  SafeAreaView 
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Plus, Users, FolderOpen, ArrowRight } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '../../src/theme/theme';
import { groupService } from '../../src/services/groupService';
import { Card } from '../../src/components/common/Card';
import { Skeleton } from '../../src/components/common/Skeleton';

const PlusIcon = Plus as any;
const UsersIcon = Users as any;
const FolderOpenIcon = FolderOpen as any;
const ArrowRightIcon = ArrowRight as any;

export default function GroupsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

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
    <View style={[styles.safeArea, { paddingTop: Math.max(insets.top, 16) }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Groups</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => router.push('/modal')}
          activeOpacity={0.7}
        >
          <PlusIcon size={20} color="#000000" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {/* Banner/Stat block */}
        <Card style={styles.statCard}>
          <View style={styles.statHeader}>
            <Text style={styles.statLabel}>Total Active Hubs</Text>
            <FolderOpenIcon size={18} color={Colors.secondary} />
          </View>
          <Text style={styles.statValue}>{groups.length}</Text>
          <Text style={styles.statSubtext}>Start splitting expenses with group members</Text>
        </Card>

        {isLoading ? (
          <View style={styles.listContainer}>
            <Skeleton height={80} style={styles.skeletonCard} />
            <Skeleton height={80} style={styles.skeletonCard} />
            <Skeleton height={80} style={styles.skeletonCard} />
          </View>
        ) : groups.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>No groups yet</Text>
            <Text style={styles.emptySubtext}>Tap the "+" icon at the top to create your first shared group hub.</Text>
          </Card>
        ) : (
          <View style={styles.listContainer}>
            {groups.map((group) => (
              <TouchableOpacity
                key={group.id}
                style={styles.groupCard}
                onPress={() => router.push(`/groups/${group.id}`)}
                activeOpacity={0.7}
              >
                <View style={styles.groupAvatar}>
                  <Text style={styles.groupAvatarText}>{group.name.substring(0, 2).toUpperCase()}</Text>
                </View>
                <View style={styles.groupInfo}>
                  <Text style={styles.groupName}>{group.name}</Text>
                  <Text style={styles.groupDesc} numberOfLines={1}>
                    {group.description || 'No description provided'}
                  </Text>
                </View>
                <ArrowRightIcon size={16} color={Colors.primary} />
              </TouchableOpacity>
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
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    padding: 24,
    paddingTop: 8,
  },
  statCard: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.secondary,
    marginBottom: 24,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.muted,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statSubtext: {
    fontSize: 12,
    color: Colors.muted,
  },
  listContainer: {
    gap: 12,
  },
  skeletonCard: {
    borderRadius: 12,
    marginBottom: 12,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    marginTop: 20,
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptySubtext: {
    color: Colors.muted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 20,
  },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
  },
  groupAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  groupAvatarText: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  groupInfo: {
    flex: 1,
    marginLeft: 16,
  },
  groupName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  groupDesc: {
    color: Colors.muted,
    fontSize: 13,
    marginTop: 4,
  },
});
