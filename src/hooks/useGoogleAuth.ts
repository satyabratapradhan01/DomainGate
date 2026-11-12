import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import { ResponseType } from 'expo-auth-session';
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

  const redirectUri = Platform.select({
    web: AuthSession.makeRedirectUri(),
    default: 'https://auth.expo.io/@satyabratapradhann/DomainGate',
  });

  if (Platform.OS !== 'web') {
    console.log(`[DomainGate] Google Auth redirectUri (${Platform.OS}):`, redirectUri);
  }

  // Explicitly configure responseType: ResponseType.IdToken for proxy flow
  // In Expo Go with auth.expo.io proxy, requesting responseType="id_token" allows Google
  // to deliver the id_token in the URL hash, which auth.expo.io sends directly to the app.
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: webClientId,
    webClientId: webClientId,
    responseType: ResponseType.IdToken,
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
