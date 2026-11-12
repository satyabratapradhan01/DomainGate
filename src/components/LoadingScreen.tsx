/**
 * DomainGate - Loading Screen Component
 * 
 * High-polish initialization splash and verification screen.
 * Prevents authentication state flickering and unauthorized screen flash
 * while Firebase credentials or token claims are being resolved.
 */

import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { APP_CONFIG } from '../constants/config';

interface LoadingScreenProps {
  title?: string;
  subtitle?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  title = APP_CONFIG.APP_NAME,
  subtitle = 'Verifying Zero-Trust Security State...',
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name="shield-checkmark" size={32} color="#3B82F6" />
      </View>
      <Text style={styles.brandTitle}>{title}</Text>
      <Text style={styles.brandSubtitle}>{subtitle}</Text>
      <ActivityIndicator size="small" color="#3B82F6" style={{ marginTop: 22 }} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080D1A', // Deep Navy Canvas
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#0F172A',
    borderWidth: 1.5,
    borderColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  brandSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 6,
    fontWeight: '500',
  },
});

