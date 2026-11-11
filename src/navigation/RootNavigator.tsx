import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
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

export const RootNavigator: React.FC = () => {
  const { state } = useAuth();

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

