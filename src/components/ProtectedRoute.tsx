/**
 * DomainGate - Protected Route Guard Component
 * 
 * Enforces Zero-Trust Route Protection:
 * - Unauthenticated users cannot view children; redirected to Login.
 * - Unauthorized users (non-@hbplus.fit) are quarantined or redirected to Login.
 * - Authentication initialization state prevents flickering or premature access.
 * - Non-client-only security: pairs with Firestore Security Rules & token validation.
 */

import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { LoginScreen } from '../screens/LoginScreen';
import { AccessDeniedScreen } from '../screens/AccessDeniedScreen';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  fallback 
}) => {
  const { isAuthorized, isInitializing, state } = useAuth();

  // 1. Prevent access while authentication is still initializing
  if (isInitializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#38BDF8" />
        <Text style={styles.loadingText}>Initializing Zero-Trust Security Gate...</Text>
      </View>
    );
  }

  // 2. Unauthorized users locked in quarantine screen or redirected
  if (state === 'ACCESS_DENIED') {
    return <AccessDeniedScreen />;
  }

  // 3. Unauthenticated users must only access login
  if (!isAuthorized) {
    return fallback ? <>{fallback}</> : <LoginScreen />;
  }

  // 4. Authenticated & authorized users can access the protected screen
  return <>{children}</>;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#030712',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 14,
    fontWeight: '600',
  },
});
