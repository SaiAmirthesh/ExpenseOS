import { 
  Pressable, 
  Text, 
  ActivityIndicator, 
  StyleSheet, 
  ViewStyle, 
  TextStyle,
  StyleProp
} from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Colors } from '../../theme/theme';
import { useTheme } from '../../theme/ThemeContext';

interface ButtonProps {
  onPress: () => void;
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  isLoading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const Button: React.FC<ButtonProps> = ({
  onPress,
  title,
  variant = 'primary',
  isLoading = false,
  disabled = false,
  style,
  textStyle,
}) => {
  const scale = useSharedValue(1);
  const { colors } = useTheme();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!disabled && !isLoading) {
      scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const getButtonStyles = () => {
    switch (variant) {
      case 'secondary':
        return styles.secondary;
      case 'outline':
        return [styles.outline, { borderColor: colors.primary }];
      case 'danger':
        return styles.danger;
      case 'primary':
      default:
        return [styles.primary, { backgroundColor: colors.primary }];
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'outline':
        return [styles.textOutline, { color: colors.primary }];
      case 'primary':
        return [styles.textPrimary, { color: colors.primary === '#D7FF3F' ? '#000000' : '#FFFFFF' }];
      default:
        return styles.textCommon;
    }
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || isLoading}
      style={[
        styles.button,
        getButtonStyles(),
        disabled && styles.disabled,
        animatedStyle,
        style,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator 
          color={variant === 'primary' ? (colors.primary === '#D7FF3F' ? '#000000' : '#FFFFFF') : colors.primary} 
          size="small" 
        />
      ) : (
        <Text style={[styles.text, getTextStyle(), textStyle]}>
          {title}
        </Text>
      )}
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: 16, // Large radius
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    flexDirection: 'row',
  },
  primary: {
    // Dynamic background color override is applied inline
  },
  secondary: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  danger: {
    backgroundColor: Colors.error,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans-SemiBold', // Premium typography
    letterSpacing: 0.2,
  },
  textPrimary: {
    fontWeight: 'bold',
  },
  textOutline: {
    // Dynamic text color override is applied inline
  },
  textCommon: {
    color: Colors.text,
  },
});
