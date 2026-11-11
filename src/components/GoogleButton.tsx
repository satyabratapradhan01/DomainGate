import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  View,
  Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface GoogleButtonProps {
  onPress: () => void;
  isLoading?: boolean;
  label?: string;
  subLabel?: string;
  disabled?: boolean;
}

export const GoogleButton: React.FC<GoogleButtonProps> = ({
  onPress,
  isLoading = false,
  label = 'Sign in with Google',
  subLabel,
  disabled = false,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        disabled && styles.buttonDisabled,
      ]}
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.8}
    >
      {isLoading ? (
        <ActivityIndicator color="#FFFFFF" size="small" />
      ) : (
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="logo-google" size={20} color="#EA4335" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.label}>{label}</Text>
            {subLabel ? <Text style={styles.subLabel}>{subLabel}</Text> : null}
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minHeight: 54,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    alignItems: 'flex-start',
  },
  label: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  subLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '400',
    marginTop: 1,
  },
});

