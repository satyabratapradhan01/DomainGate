import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { AuthService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { sanitizeAuthError } from '../utils/errorHandler';

// Ensure WebBrowser session finishes cleanly on Web & iOS AuthSession flows
WebBrowser.maybeCompleteAuthSession();

// Configure GoogleSignin for Android / native environments
const webClientId =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
  process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB ||
  '';

if (Platform.OS === 'android') {
  try {
    GoogleSignin.configure({
      webClientId: webClientId || undefined,
      offlineAccess: false,
    });
  } catch (e) {
    console.warn('[GoogleSignin] configure warning:', e);
  }
}

export function useGoogleAuth() {
  const { handleSecurityResult, setAuthBusy, setAuthError } = useAuth();

  // ---------------------------------------------------------------------------
  // iOS Fallback: expo-auth-session
  // (Maintained for iOS compatibility when running outside native Google SDK)
  // ---------------------------------------------------------------------------
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'domaingate',
  });

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: webClientId,
    webClientId: webClientId,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS,
    redirectUri,
    selectAccount: true,
  });

  // Handle iOS AuthSession response
  useEffect(() => {
    async function processIosResponse() {
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

    if (Platform.OS === 'ios') {
      processIosResponse();
    }
  }, [response]);

  // ---------------------------------------------------------------------------
  // Android Native Implementation: @react-native-google-signin/google-signin
  // ---------------------------------------------------------------------------
  const signInWithGoogleAndroid = async () => {
    setAuthBusy(true);
    try {
      // 1. Verify Google Play Services availability
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      // 2. Perform native sign in
      const response = await GoogleSignin.signIn();

      // Check if user cancelled
      if (response.type === 'cancelled') {
        const sanitized = sanitizeAuthError({ code: 'auth_cancelled' });
        setAuthError(sanitized.userMessage);
        return;
      }

      // In @react-native-google-signin/google-signin v17:
      // response is SignInResponse (type: 'success', data: { idToken, user, ... })
      const idToken = response.data?.idToken;
      if (!idToken) {
        throw new Error('Google ID token not received from native Google Sign-In');
      }

      // 3. Exchange ID token with Firebase and enforce DomainGate boundary
      const result = await AuthService.exchangeGoogleIdTokenAndAuthorize(idToken);
      handleSecurityResult(result);
    } catch (error: any) {
      console.error('[GoogleSignin Android] Error:', error);
      const sanitized = sanitizeAuthError(error);
      setAuthError(sanitized.userMessage);
    } finally {
      setAuthBusy(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Unified Sign-In Trigger across Web, Android, and iOS
  // ---------------------------------------------------------------------------
  const startGoogleSignIn = async () => {
    if (Platform.OS === 'web') {
      // 1. Web: Firebase signInWithPopup()
      setAuthBusy(true);
      try {
        const result = await AuthService.signInWithGoogleWeb();
        handleSecurityResult(result);
      } catch (err: any) {
        const sanitized = sanitizeAuthError(err);
        setAuthError(sanitized.userMessage);
      } finally {
        setAuthBusy(false);
      }
    } else if (Platform.OS === 'android') {
      // 2. Android: Native GoogleSignin
      await signInWithGoogleAndroid();
    } else {
      // 3. iOS: expo-auth-session prompt
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
      } finally {
        setAuthBusy(false);
      }
    }
  };

  return {
    startGoogleSignIn,
    signInWithGoogleAndroid,
    isReady: Platform.OS === 'web' || Platform.OS === 'android' || Boolean(request),
  };
}
