import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator 
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { X, Check } from 'lucide-react-native';

import { Colors } from '../src/theme/theme';
import { useTheme } from '../src/theme/ThemeContext';
import { createGroupSchema, CreateGroupFields } from '../src/features/groups/schemas/groupSchemas';
import { groupService } from '../src/services/groupService';
import { Input } from '../src/components/common/Input';
import { Button } from '../src/components/common/Button';
import { Card } from '../src/components/common/Card';

export default function ModalScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useTheme();
  const [createError, setCreateError] = useState<string | null>(null);

  // Mutations
  const createGroupMutation = useMutation({
    mutationFn: groupService.createGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      router.back();
    },
    onError: (err: any) => {
      setCreateError(err.response?.data?.message || 'Failed to create group');
    }
  });

  // Forms
  const { control, handleSubmit, formState: { errors } } = useForm<CreateGroupFields>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const onSubmit = (data: CreateGroupFields) => {
    setCreateError(null);
    createGroupMutation.mutate(data);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Create Group Section */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Create Group Hub</Text>
      <Card style={styles.formCard}>
        {createError && (
          <View style={[styles.errorBanner, { backgroundColor: colors.error + '10', borderColor: colors.error + '25' }]}>
            <Text style={[styles.errorBannerText, { color: colors.error }]}>{createError}</Text>
          </View>
        )}

        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Group Name"
              placeholder="e.g. Roommates, Trip 2026"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={errors.name?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Description"
              placeholder="Optional description"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={errors.description?.message}
            />
          )}
        />

        <Button 
          title="Create Group"
          onPress={handleSubmit(onSubmit)}
          isLoading={createGroupMutation.isPending}
          style={styles.actionBtn}
        />
      </Card>

      {/* Close button at the bottom */}
      <Button 
        title="Close" 
        variant="secondary" 
        onPress={() => router.back()} 
        style={styles.closeBtn}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#FFFFFF',
    marginBottom: 16,
    marginTop: 8,
  },
  formCard: {
    marginBottom: 20,
    padding: 18,
  },
  errorBanner: {
    backgroundColor: 'rgba(255, 107, 107, 0.08)',
    borderWidth: 1,
    borderColor: Colors.error,
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
  actionBtn: {
    marginTop: 8,
  },
  closeBtn: {
    marginTop: 12,
    marginBottom: 40,
  },
});
