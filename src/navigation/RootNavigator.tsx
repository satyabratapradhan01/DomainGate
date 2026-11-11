import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { LoginScreen } from '../screens/LoginScreen';
import { AccessDeniedScreen } from '../screens/AccessDeniedScreen';
import { DashboardScreen } from '../screens/DashboardScreen';

export type RootStackParamList = {
  Login: undefined;
  AccessDenied: undefined;
  Dashboard: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

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
  const { state, isInitializing } = useAuth();

  // Prevent authentication state flicker while onAuthStateChanged reads cached credentials
  if (isInitializing) {
    return <AppInitializationGate />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: { backgroundColor: '#030712' },
        }}
      >
        {state === 'AUTHORIZED' ? (
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
        ) : state === 'ACCESS_DENIED' ? (
          <Stack.Screen name="AccessDenied" component={AccessDeniedScreen} />
        ) : (
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
