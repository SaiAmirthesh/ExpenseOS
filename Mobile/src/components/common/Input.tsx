import React, { useState } from 'react';
import { 
  View, 
  TextInput, 
  Text, 
  StyleSheet, 
  TextInputProps, 
  TouchableOpacity 
} from 'react-native';
import { Colors } from '../../theme/theme';
import { useTheme } from '../../theme/ThemeContext';
import { Eye, EyeOff } from 'lucide-react-native';

const EyeIcon = Eye as any;
const EyeOffIcon = EyeOff as any;

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  secureTextEntry?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  secureTextEntry = false,
  style,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(!secureTextEntry);
  const { colors } = useTheme();

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View 
        style={[
          styles.inputContainer,
          isFocused && { borderColor: colors.primary },
          error ? styles.errorBorder : null,
        ]}
      >
        <TextInput
          placeholderTextColor="#667085"
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={[styles.input, style]}
          {...props}
        />
        {secureTextEntry && (
          <TouchableOpacity 
            onPress={togglePasswordVisibility} 
            activeOpacity={0.7}
            style={styles.eyeButton}
          >
            {isPasswordVisible ? (
              <EyeOffIcon size={20} color={Colors.muted} />
            ) : (
              <EyeIcon size={20} color={Colors.muted} />
            )}
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    width: '100%',
  },
  label: {
    color: Colors.muted,
    fontSize: 13,
    fontFamily: 'PlusJakartaSans-SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  inputContainer: {
    height: 52,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16, // Rounded corner style
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  focusedBorder: {
    // Dynamic border color is applied inline
  },
  errorBorder: {
    borderColor: Colors.error,
  },
  input: {
    flex: 1,
    height: '100%',
    color: Colors.text,
    fontFamily: 'Inter-Regular',
    fontSize: 15,
  },
  eyeButton: {
    padding: 8,
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 6,
  },
});
