import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { AuthService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { sanitizeAuthError } from '../utils/errorHandler';

// Ensure redirect auth session closes cleanly in web/popup contexts
WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth() {
  const { handleSecurityResult, setAuthBusy, setAuthError } = useAuth();

  // Detect whether running in Expo Go client vs standalone / custom dev build
  const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

  // Build the appropriate redirect URI
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'domaingate',
  });

  // Log for convenient Google Cloud Console setup
  if (Platform.OS !== 'web') {
    console.log(`[DomainGate] Google Auth redirectUri (${Platform.OS}, ExpoGo=${isExpoGo}):`, redirectUri);
  }

  // Configure Google ID token request:
  // In Expo Go, Google rejects 'androidClientId' with browser redirects (redirect_uri_mismatch).
  // Per Expo docs, Expo Go must use the Web Client ID ('clientId').
  // Standalone builds use 'androidClientId' with custom scheme redirect.
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB,
    iosClientId: isExpoGo ? undefined : process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS,
    androidClientId: isExpoGo ? undefined : process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID,
    redirectUri,
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

