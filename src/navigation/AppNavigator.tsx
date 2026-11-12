/**
 * DomainGate - Application Navigation Controller
 * 
 * Implements strict zero-trust route protection:
 * - Unauthenticated users access only Login.
 * - Authenticated and authorized @hbplus.fit users access Dashboard.
 * - Unauthorized domains are redirected and quarantined.
 * - Direct deep-link URLs to /dashboard are blocked at the router level.
 * - Session restoration is protected by LoadingScreen to prevent state flickering.
 */

import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { LoginScreen } from '../screens/LoginScreen';
import { AccessDeniedScreen } from '../screens/AccessDeniedScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { LoadingScreen } from '../components/LoadingScreen';
import { APP_CONFIG } from '../constants/config';

export type RootStackParamList = {
  Login: undefined;
  AccessDenied: undefined;
  Dashboard: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Universal Deep Linking Configuration for Web & Mobile
 */
const linking: LinkingOptions<RootStackParamList> = {
  prefixes: APP_CONFIG.LINKING_PREFIXES,
  config: {
    screens: {
      Login: 'login',
      Dashboard: 'dashboard',
      AccessDenied: 'access-denied',
    },
  },
};

export const AppNavigator: React.FC = () => {
  const { isAuthorized, state, isInitializing } = useAuth();

  // Guard against browser history re-entry (e.g. Back button) on Web
  React.useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const enforceLoginUrl = () => {
        if (!isAuthorized && window.location.pathname.includes('dashboard')) {
          window.history.replaceState(null, '', '/login');
        }
      };

      enforceLoginUrl();
      window.addEventListener('popstate', enforceLoginUrl);
      return () => {
        window.removeEventListener('popstate', enforceLoginUrl);
      };
    }
  }, [isAuthorized]);

  // 1. Prevent access and avoid flickering while authentication is initializing
  if (isInitializing) {
    return <LoadingScreen subtitle="Verifying Zero-Trust Security State..." />;
  }

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: { backgroundColor: '#080D1A' },
        }}
      >
        {isAuthorized ? (
          // Authenticated & Authorized: Dashboard is mounted
          <Stack.Screen name="Dashboard">
            {() => (
              <ProtectedRoute>
                <DashboardScreen />
              </ProtectedRoute>
            )}
          </Stack.Screen>
        ) : state === 'ACCESS_DENIED' ? (
          // Unauthorized domain attempt: Quarantined screen
          <Stack.Screen name="AccessDenied" component={AccessDeniedScreen} />
        ) : (
          // Unauthenticated: Only Login exists in routing hierarchy
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// Compatible export for RootNavigator
export const RootNavigator = AppNavigator;

