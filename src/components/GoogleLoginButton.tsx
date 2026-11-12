/**
 * DomainGate - Google Login Button Component
 * 
 * High-polish, accessible Single Sign-On button adhering to
 * Google Branding and OAuth 2.0 Identity Platform guidelines.
 */

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

export interface GoogleLoginButtonProps {
  onPress: () => void;
  isLoading?: boolean;
  label?: string;
  subLabel?: string;
  disabled?: boolean;
}

export const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({
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
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || isLoading, busy: isLoading }}
    >
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#0F172A" size="small" />
          <Text style={styles.loadingText}>Authenticating with Google...</Text>
        </View>
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

// Compatible alias for components importing GoogleButton
export const GoogleButton = GoogleLoginButton;

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minHeight: 54,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        cursor: 'pointer',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 3,
      },
    }),
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '600',
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
    fontSize: 15,
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

