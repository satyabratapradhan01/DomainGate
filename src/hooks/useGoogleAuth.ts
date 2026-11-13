import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import { AuthService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { sanitizeAuthError } from '../utils/errorHandler';

// Complete any pending auth session in web browser
WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth() {
  const { handleSecurityResult, setAuthBusy, setAuthError } = useAuth();

  const webClientId =
    process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB ||
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
    '';

  // For Expo Go on Android / iOS:
  // Must use the registered HTTPS proxy redirect URI that complies with Google OAuth 2.0 policy:
  const proxyRedirectUri = 'https://auth.expo.io/@satyabratapradhann/DomainGate';

  const redirectUri = Platform.select({
    web: AuthSession.makeRedirectUri(),
    default: proxyRedirectUri,
  });

  if (Platform.OS !== 'web') {
    console.log(`[DomainGate] Google Auth redirectUri (${Platform.OS}):`, redirectUri);
  }

  // Use Google.useIdTokenAuthRequest with the Web Client ID
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: webClientId,
    webClientId: webClientId,
    redirectUri,
    selectAccount: true,
  });

  // Handle mobile (Android & iOS) OAuth redirect response
  useEffect(() => {
    async function processMobileResponse() {
      if (!response) return;

      console.log('[DomainGate] AuthSession response received:', response.type);

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
        // In Expo Go, passing { showInRecents: true } ensures the browser returns to the foreground app
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
