import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { Colors } from '../../theme/theme';
import { Button } from './Button';

const AlertTriangleIcon = AlertTriangle as any;

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  style?: ViewStyle;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message,
  onRetry,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <AlertTriangleIcon size={24} color={Colors.error} style={styles.icon} />
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <Button
          title="Retry"
          onPress={onRetry}
          variant="outline"
          style={styles.button}
          textStyle={{ color: Colors.primary }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 107, 107, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.15)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  icon: {
    marginBottom: 8,
  },
  message: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: Colors.error,
    textAlign: 'center',
    lineHeight: 18,
  },
  button: {
    marginTop: 12,
    height: 38,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderColor: Colors.border,
  },
});
