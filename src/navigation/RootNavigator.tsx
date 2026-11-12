/**
 * DomainGate - Enterprise Protected Route Navigator
 * 
 * Route Protection Implementation:
 * 1. Unauthenticated users can only access the Login page.
 * 2. Authenticated and authorized users (@hbplus.fit) access the Dashboard.
 * 3. Unauthorized users are blocked from protected screens and routed to quarantine/login.
 * 4. Direct URL access to /dashboard is blocked at the router level via conditional definition.
 * 5. Authentication state is preserved after browser reloads.
 * 6. Access is strictly blocked while authentication is initializing (flicker-free).
 * 7. Defense-in-depth: Paired with Firestore & Storage rules so client navigation guards
 *    are never the sole security boundary.
 */

import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { LoginScreen } from '../screens/LoginScreen';
import { AccessDeniedScreen } from '../screens/AccessDeniedScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { ProtectedRoute } from '../components/ProtectedRoute';

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
  prefixes: [
    'domaingate://',
    'https://domaingate.netlify.app',
    'http://localhost:8081',
    'http://localhost:19006',
  ],
  config: {
    screens: {
      Login: 'login',
      Dashboard: 'dashboard',
      AccessDenied: 'access-denied',
    },
  },
};

/**
 * High-polish initialization splash screen preventing state flicker during session restore
 */
function AppInitializationGate() {
  return (
    <View style={styles.gateContainer}>
      <View style={styles.iconCircle}>
        <Ionicons name="shield-checkmark" size={32} color="#38BDF8" />
      </View>
      <Text style={styles.brandTitle}>DomainGate</Text>
      <Text style={styles.brandSubtitle}>Verifying Zero-Trust Security State...</Text>
      <ActivityIndicator size="small" color="#38BDF8" style={{ marginTop: 20 }} />
    </View>
  );
}

export const RootNavigator: React.FC = () => {
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

  // 1. Prevent access while authentication is still initializing
  if (isInitializing) {
    return <AppInitializationGate />;
  }

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: { backgroundColor: '#030712' },
        }}
      >
        {isAuthorized ? (
          // Authenticated and authorized: Dashboard screen is mounted
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
          // Unauthenticated / Default: Only Login is in the routing hierarchy.
          // Direct URL access to /dashboard automatically falls back to Login.
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  gateContainer: {
    flex: 1,
    backgroundColor: '#030712',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0F172A',
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  brandTitle: {
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  brandSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 6,
  },
});
