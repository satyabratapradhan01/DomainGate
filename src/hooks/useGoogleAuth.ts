import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { AuthService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { sanitizeAuthError } from '../utils/errorHandler';

// Ensure redirect auth session closes cleanly in web/popup contexts
WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth() {
  const { handleSecurityResult, setAuthBusy, setAuthError } = useAuth();

  // Configure Google ID token request for Mobile (iOS & Android)
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB || '102938475610-web-domaingate.apps.googleusercontent.com',
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS || '102938475610-ios-domaingate.apps.googleusercontent.com',
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID || '102938475610-android-domaingate.apps.googleusercontent.com',
    selectAccount: true,
  });

  // Handle native mobile OAuth response
  useEffect(() => {
    async function processNativeResponse() {
      if (!response) return;

      if (response.type === 'success') {
        const idToken = response.params?.id_token;
        if (!idToken) {
          setAuthError('Google authentication succeeded but no ID token was returned.');
          return;
        }

        setAuthBusy(true);
        try {
          const result = await AuthService.exchangeGoogleIdTokenAndAuthorize(idToken);
          handleSecurityResult(result);
        } catch (err: any) {
          const sanitized = sanitizeAuthError(err);
          setAuthError(sanitized.userMessage);
        }
      } else if (response.type === 'cancel' || response.type === 'dismiss') {
        const sanitized = sanitizeAuthError({ code: 'auth_cancelled' });
        setAuthError(sanitized.userMessage);
      } else if (response.type === 'error') {
        const sanitized = sanitizeAuthError(response.error);
        setAuthError(sanitized.userMessage);
      }
    }

    if (Platform.OS !== 'web') {
      processNativeResponse();
    }
  }, [response]);

  /**
   * Unified trigger across Web, Android, and iOS
   */
  const startGoogleSignIn = async () => {
    if (Platform.OS === 'web') {
      setAuthBusy(true);
      try {
        const result = await AuthService.signInWithGoogleWeb();
        handleSecurityResult(result);
      } catch (err: any) {
        const sanitized = sanitizeAuthError(err);
        setAuthError(sanitized.userMessage);
      }
    } else {
      // Mobile native trigger via expo-auth-session
      if (!request) {
        setAuthError('Google Sign-In service is initializing. Please tap again in a moment.');
        return;
      }
      setAuthBusy(true);
      try {
        await promptAsync();
      } catch (err: any) {
        const sanitized = sanitizeAuthError(err);
        setAuthError(sanitized.userMessage);
      }
    }
  };

  return {
    startGoogleSignIn,
    isReady: Boolean(request) || Platform.OS === 'web',
  };
}

