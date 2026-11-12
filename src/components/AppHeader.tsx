/**
 * DomainGate - Universal Application Header
 * 
 * Modular top navigation header displaying corporate organization branding,
 * active zero-trust session indicators, and quick account actions.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { APP_CONFIG } from '../constants/config';

interface AppHeaderProps {
  organizationName?: string;
  isDesktop?: boolean;
  onLogout?: () => void;
  isLoggingOut?: boolean;
  showLogout?: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  organizationName = APP_CONFIG.ORGANIZATION_NAME,
  isDesktop = false,
  onLogout,
  isLoggingOut = false,
  showLogout = true,
}) => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <View style={styles.headerContainer}>
      <View style={styles.leftSection}>
        <View style={styles.brandIconBox}>
          <Ionicons name="shield-checkmark" size={18} color="#3B82F6" />
        </View>
        <View>
          <Text style={styles.brandName}>{APP_CONFIG.APP_NAME}</Text>
          <Text style={styles.orgSubtitle} numberOfLines={1}>{organizationName}</Text>
        </View>
      </View>

      <View style={styles.rightSection}>
        {isDesktop && (
          <Text style={styles.dateText}>{currentDate}</Text>
        )}

        <View style={styles.sessionPill}>
          <View style={styles.onlineDot} />
          <Text style={styles.sessionText}>Active</Text>
        </View>

        {showLogout && onLogout && (
          <TouchableOpacity 
            style={styles.logoutBtn}
            onPress={onLogout}
            disabled={isLoggingOut}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Sign out"
          >
            {isLoggingOut ? (
              <ActivityIndicator size="small" color="#F87171" style={{ marginRight: 4 }} />
            ) : (
              <Ionicons name="log-out-outline" size={16} color="#F87171" style={{ marginRight: 4 }} />
            )}
            <Text style={styles.logoutBtnText}>
              {isLoggingOut ? '...' : 'Logout'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#0B132B',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  orgSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    maxWidth: 240,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dateText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  sessionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 14,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 5,
  },
  sessionText: {
    fontSize: 11,
    color: '#34D399',
    fontWeight: '600',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  logoutBtnText: {
    color: '#F87171',
    fontSize: 11,
    fontWeight: '600',
  },
});
