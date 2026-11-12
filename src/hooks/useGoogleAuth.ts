import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import { AuthService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { sanitizeAuthError } from '../utils/errorHandler';

// Ensure redirect auth session closes cleanly in web/popup/browser contexts
WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth() {
  const { handleSecurityResult, setAuthBusy, setAuthError } = useAuth();

  // The Web Client ID from Google Cloud Console / Firebase
  const webClientId =
    process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB ||
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
    '';

  // In Expo Go, the auth session redirects back to Expo's auth proxy (https://auth.expo.io/@...)
  // or to the local scheme (domaingate://).
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'domaingate',
  });

  if (Platform.OS !== 'web') {
    console.log(`[DomainGate] Google Auth redirectUri (${Platform.OS}):`, redirectUri);
  }

  // CRITICAL FOR EXPO GO:
  // In Expo Go, Google rejects 'androidClientId' because Android Client IDs in Google Cloud
  // only validate native apps with SHA-1 signatures and do not allow HTTP redirect URIs.
  // Expo's official documentation requires passing the Web Client ID ('clientId' / 'webClientId')
  // for both Android and iOS when running in Expo Go.
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: webClientId,
    webClientId: webClientId,
    // Do NOT pass androidClientId or iosClientId in Expo Go, as that triggers native package checks
    // which fail with Error 400: redirect_uri_mismatch or invalid_request under GeneralOAuthFlow.
    redirectUri,
    selectAccount: true,
  });

  // Handle mobile (Android & iOS) OAuth redirect response
  useEffect(() => {
    async function processMobileResponse() {
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
        } finally {
          setAuthBusy(false);
        }
      } else if (response.type === 'cancel' || response.type === 'dismiss') {
        const sanitized = sanitizeAuthError({ code: 'auth_cancelled' });
        setAuthError(sanitized.userMessage);
      } else if (response.type === 'error') {
        console.warn('[DomainGate] Google Auth Error response:', response.error);
        const sanitized = sanitizeAuthError(response.error);
        setAuthError(sanitized.userMessage);
      }
    }

    if (Platform.OS !== 'web') {
      processMobileResponse();
    }
  }, [response]);

  /**
   * Unified trigger across Web, Android, and iOS
   */
  const startGoogleSignIn = async () => {
    if (Platform.OS === 'web') {
      // Web: Direct Firebase signInWithPopup()
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
    } else {
      // Mobile (Android / iOS): Expo AuthSession browser flow
      if (!request) {
        setAuthError('Google Sign-In is initializing. Please tap again in a moment.');
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
    isReady: Boolean(request) || Platform.OS === 'web',
    redirectUri,
  };
}
