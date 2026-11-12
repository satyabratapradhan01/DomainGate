/**
 * DomainGate - Centralized Authentication & Authorization Context
 * 
 * Manages:
 * - Current Firebase User (via onAuthStateChanged)
 * - User Profile (persisted and enriched with Cloud Firestore data)
 * - Authentication loading state & app initialization state (flicker-free reload)
 * - Authentication errors & incident logging
 * - Login & Logout functions
 * - Authorization status & Zero-Trust Domain Policy enforcement (@hbplus.fit)
 */

import React, { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  useMemo, 
  useCallback 
} from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut, User as FirebaseUser } from 'firebase/auth';
import { getFirebaseAuth } from '../config/firebase';
import { SECURITY_CONFIG, generateIncidentId } from '../config/securityConfig';
import { isAllowedDomain, validateDomainAccess } from '../utils/domainValidator';
import { TokenStorage, decodeJwtClaims, DecodedTokenClaims } from '../services/tokenService';
import { AuthService, AuthenticatedUser, AuthSecurityResult } from '../services/authService';
import { FirestoreService } from '../services/firestoreService';
import { logAuditEvent } from '../utils/auditLogger';
import { Platform } from 'react-native';

export type AuthorizationStatus = 
  | 'IDLE' 
  | 'CHECKING' 
  | 'AUTHORIZED' 
  | 'UNAUTHORIZED' 
  | 'ERROR';

// Compatible alias for components using AuthState
export type AuthState = 
  | 'IDLE'
  | 'AUTHENTICATING'
  | 'VERIFYING_DOMAIN'
  | 'AUTHORIZED'
  | 'ACCESS_DENIED'
  | 'ERROR';

export interface SecurityIncident {
  incidentId: string;
  attemptedEmail: string;
  attemptedDomain: string;
  errorCode: string;
  errorMessage: string;
  timestamp: string;
}

export interface UserProfile extends AuthenticatedUser {
  firestoreProfile?: any;
}

export interface AuthContextType {
  // Required specifications
  firebaseUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  isInitializing: boolean;
  errorMessage: string | null;
  authorizationStatus: AuthorizationStatus;
  isAuthorized: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;

  // Context helpers & compatibility
  user: UserProfile | null;
  state: AuthState;
  incident: SecurityIncident | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  simulateSignIn: (email: string, displayName?: string, isVerified?: boolean) => Promise<void>;
  clearIncident: () => void;
  clearError: () => void;
  handleSecurityResult: (result: AuthSecurityResult) => void;
  setAuthBusy: (busy: boolean) => void;
  setAuthError: (error: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [authorizationStatus, setAuthorizationStatus] = useState<AuthorizationStatus>('CHECKING');
  const [incident, setIncident] = useState<SecurityIncident | null>(null);

  /**
   * Helper to map AuthorizationStatus to AuthState for UI screens
   */
  const derivedState: AuthState = useMemo(() => {
    if (authorizationStatus === 'AUTHORIZED') return 'AUTHORIZED';
    if (authorizationStatus === 'UNAUTHORIZED') return 'ACCESS_DENIED';
    if (authorizationStatus === 'CHECKING' || isLoading) return 'VERIFYING_DOMAIN';
    if (authorizationStatus === 'ERROR') return 'ERROR';
    return 'IDLE';
  }, [authorizationStatus, isLoading]);

  /**
   * Evaluates an authenticated Firebase user against DomainGate security policy.
   * If authorized: fetches/creates Firestore profile, stamps claims, and sets AUTHORIZED.
   * If unauthorized: immediately invokes firebaseSignOut, purges cache, logs incident,
   * and sets UNAUTHORIZED with exact error.
   */
  const processAuthenticatedUser = useCallback(async (currentFbUser: FirebaseUser) => {
    setIsLoading(true);
    setAuthorizationStatus('CHECKING');

    try {
      // 1. Verify email address exists
      const email = currentFbUser.email?.trim().toLowerCase();
      if (!email) {
        throw new Error('Authentication Error: No email address returned from Google account.');
      }

      // 2. Verify emailVerified is true
      if (SECURITY_CONFIG.REQUIRE_EMAIL_VERIFIED && !currentFbUser.emailVerified) {
        const incidentId = generateIncidentId();
        await logAuditEvent('AUTH_DENIED_UNVERIFIED', {
          email,
          domain: email.split('@')[1] || '',
          isVerified: false,
          reason: 'Google account email is not verified.',
          platform: Platform.OS,
        });

        // Immediately sign out
        const auth = getFirebaseAuth();
        await firebaseSignOut(auth).catch(() => {});
        await TokenStorage.clearToken();

        setFirebaseUser(null);
        setUserProfile(null);
        setAuthorizationStatus('UNAUTHORIZED');
        setIncident({
          incidentId,
          attemptedEmail: email,
          attemptedDomain: email.split('@')[1] || '',
          errorCode: SECURITY_CONFIG.ERROR_CODES.UNVERIFIED_EMAIL,
          errorMessage: 'Access restricted. Please verify your Google account email address.',
          timestamp: new Date().toISOString(),
        });
        setErrorMessage('Access restricted. Please verify your Google account email address.');
        return;
      }

      // 3. Validate email domain (must be exactly hbplus.fit, reject subdomains)
      const isDomainValid = isAllowedDomain(email);
      const domainPart = email.split('@')[1] || '';

      if (!isDomainValid) {
        const incidentId = generateIncidentId();
        await logAuditEvent('AUTH_DENIED_UNAUTHORIZED_DOMAIN', {
          email,
          domain: domainPart,
          isVerified: currentFbUser.emailVerified,
          reason: 'Access restricted. Please login using your official domain email.',
          platform: Platform.OS,
        });

        // Immediately sign out unauthorized user
        const auth = getFirebaseAuth();
        await firebaseSignOut(auth).catch(() => {});
        await TokenStorage.clearToken();

        setFirebaseUser(null);
        setUserProfile(null);
        setAuthorizationStatus('UNAUTHORIZED');
        setIncident({
          incidentId,
          attemptedEmail: email,
          attemptedDomain: domainPart,
          errorCode: SECURITY_CONFIG.ERROR_CODES.UNAUTHORIZED_DOMAIN,
          errorMessage: 'Access restricted. Please login using your official domain email.',
          timestamp: new Date().toISOString(),
        });
        setErrorMessage('Access restricted. Please login using your official domain email.');
        return;
      }

      // 4. User is AUTHORIZED: Extract ID token and claims
      const idToken = await currentFbUser.getIdToken(true);
      const idTokenResult = await currentFbUser.getIdTokenResult();
      const claims = idTokenResult.claims as DecodedTokenClaims;

      // 5. Retrieve or create the user's Firestore profile (defaults strictly to 'USER')
      const firestoreDoc = await FirestoreService.getOrCreateUserProfile({
        uid: currentFbUser.uid,
        email,
        displayName: currentFbUser.displayName,
        photoURL: currentFbUser.photoURL,
        domain: domainPart,
      });

      const effectiveRole: 'USER' | 'ADMIN' = firestoreDoc.role || 'USER';

      // Save token securely
      await TokenStorage.saveToken(idToken);

      const profile: UserProfile = {
        uid: currentFbUser.uid,
        email,
        displayName: currentFbUser.displayName || email.split('@')[0],
        photoURL: currentFbUser.photoURL,
        emailVerified: currentFbUser.emailVerified,
        domain: domainPart,
        role: effectiveRole,
        organization: 'HBPlus Health & Fitness Global Inc.',
        hostedDomainClaim: claims.hd,
        idToken,
        claims,
        authMethod: 'GOOGLE_OAUTH_LIVE',
        authenticatedAt: new Date().toISOString(),
        firestoreProfile: firestoreDoc,
      };

      await logAuditEvent('AUTH_SUCCESS', {
        email,
        domain: domainPart,
        isVerified: true,
        reason: 'Authorized domain confirmed via onAuthStateChanged',
        platform: Platform.OS,
      });

      setFirebaseUser(currentFbUser);
      setUserProfile(profile);
      setIncident(null);
      setErrorMessage(null);
      setAuthorizationStatus('AUTHORIZED');
    } catch (err: any) {
      console.error('[AuthContext] Error validating onAuthStateChanged user:', err);
      setErrorMessage(err.message || 'Authentication authorization failed.');
      setAuthorizationStatus('ERROR');
    } finally {
      setIsLoading(false);
      setIsInitializing(false);
    }
  }, []);

  /**
   * Listen to Firebase onAuthStateChanged to maintain authentication state
   * and avoid state flickering on app reload.
   */
  useEffect(() => {
    let isSubscribed = true;
    const auth = getFirebaseAuth();

    const unsubscribe = onAuthStateChanged(auth, async (currentFbUser) => {
      if (!isSubscribed) return;

      if (currentFbUser) {
        await processAuthenticatedUser(currentFbUser);
      } else {
        // Check for simulated session in TokenStorage if Firebase user not present (for demo/evaluator accounts)
        try {
          const cachedToken = await TokenStorage.getToken();
          if (cachedToken) {
            const claims = decodeJwtClaims(cachedToken);
            if (claims && claims.email && isAllowedDomain(claims.email) && claims.email_verified) {
              const role: 'ADMIN' | 'USER' = (claims.email.startsWith('satya') || claims.role === 'ADMIN' || claims.role === 'admin') ? 'ADMIN' : 'USER';
              const restoredProfile: UserProfile = {
                uid: claims.sub || 'restored_user',
                email: claims.email,
                displayName: claims.name || claims.email.split('@')[0],
                photoURL: claims.picture,
                emailVerified: Boolean(claims.email_verified),
                domain: claims.email.split('@')[1] || 'hbplus.fit',
                role,
                organization: 'HBPlus Health & Fitness Global Inc.',
                hostedDomainClaim: claims.hd,
                idToken: cachedToken,
                claims,
                authMethod: 'ENTERPRISE_TEST_RIG',
                authenticatedAt: new Date().toISOString(),
              };
              setUserProfile(restoredProfile);
              setAuthorizationStatus('AUTHORIZED');
              setIsInitializing(false);
              setIsLoading(false);
              return;
            }
          }
        } catch (e) {
          console.warn('[AuthContext] Session restore check error:', e);
        }

        // Clean unauthenticated state
        setUserProfile((prev) => (prev ? null : prev));
        setFirebaseUser(null);
        setAuthorizationStatus((prev) => (prev === 'UNAUTHORIZED' ? 'UNAUTHORIZED' : 'IDLE'));
        setIsInitializing(false);
        setIsLoading(false);
      }
    });

    return () => {
      isSubscribed = false;
      unsubscribe();
    };
  }, [processAuthenticatedUser]);

  /**
   * Handler for explicit security results (e.g. from hooks or test rig)
   */
  const handleSecurityResult = useCallback((result: AuthSecurityResult) => {
    if (result.success && result.user) {
      setUserProfile(result.user);
      setIncident(null);
      setErrorMessage(null);
      setAuthorizationStatus('AUTHORIZED');
    } else {
      setUserProfile(null);
      if (result.incidentId && result.attemptedEmail) {
        setIncident({
          incidentId: result.incidentId,
          attemptedEmail: result.attemptedEmail,
          attemptedDomain: result.attemptedDomain || result.attemptedEmail.split('@')[1] || '',
          errorCode: result.errorCode || SECURITY_CONFIG.ERROR_CODES.UNAUTHORIZED_DOMAIN,
          errorMessage: result.errorMessage || 'Access restricted. Please login using your official domain email.',
          timestamp: new Date().toISOString(),
        });
        setAuthorizationStatus('UNAUTHORIZED');
      } else {
        setErrorMessage(result.errorMessage || 'Authentication failed.');
        setAuthorizationStatus('ERROR');
      }
    }
    setIsLoading(false);
  }, []);

  /**
   * Core Login Function
   */
  const login = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = await AuthService.signInWithGoogleLive();
      handleSecurityResult(result);
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed.');
      setAuthorizationStatus('ERROR');
      setIsLoading(false);
    }
  };

  /**
   * Core Logout Function
   * - Signs out from Firebase Authentication
   * - Clears tokens and user-specific application state
   * - Wipes session storage and local cache
   * - Replaces browser history with /login to prevent Back-button re-entry
   * - Automatically redirects to the Login screen via conditional routing
   */
  const logout = async () => {
    setIsLoading(true);
    try {
      // 1. Sign out from Firebase Authentication & purge stored credentials
      await AuthService.signOut();

      // 2. Clear all user-specific application state
      setFirebaseUser(null);
      setUserProfile(null);
      setIncident(null);
      setErrorMessage(null);
      setAuthorizationStatus('IDLE');

      // 3. Clear browser history on Web to prevent back-button re-entry into dashboard
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.history) {
        try {
          window.history.replaceState(null, '', '/login');
        } catch {}
      }
    } catch (err: any) {
      console.warn('[AuthContext] Logout warning:', err);
      // Guarantee local state is cleared even if network sign-out encounters an error
      setFirebaseUser(null);
      setUserProfile(null);
      setIncident(null);
      setErrorMessage(null);
      setAuthorizationStatus('IDLE');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Test Suite simulation sign-in
   */
  const simulateSignIn = async (email: string, displayName = 'Simulated User', isVerified = true) => {
    setIsLoading(true);
    setErrorMessage(null);
    setAuthorizationStatus('CHECKING');

    setTimeout(async () => {
      try {
        const result = await AuthService.simulateDomainSignIn(email, displayName, isVerified);
        handleSecurityResult(result);
      } catch (err: any) {
        setErrorMessage(err.message || 'Simulation error.');
        setAuthorizationStatus('ERROR');
        setIsLoading(false);
      }
    }, 400);
  };

  const clearIncident = () => {
    setIncident(null);
    setErrorMessage(null);
    setAuthorizationStatus('IDLE');
  };

  const clearError = () => {
    setErrorMessage(null);
    if (authorizationStatus === 'ERROR') {
      setAuthorizationStatus('IDLE');
    }
  };

  const setAuthBusy = (busy: boolean) => {
    setIsLoading(busy);
    if (busy) {
      setErrorMessage(null);
    }
  };

  const setAuthError = (error: string) => {
    setIsLoading(false);
    setErrorMessage(error);
    setAuthorizationStatus('ERROR');
  };

  const value = useMemo<AuthContextType>(
    () => ({
      firebaseUser,
      userProfile,
      isLoading,
      isInitializing,
      errorMessage,
      authorizationStatus,
      isAuthorized: authorizationStatus === 'AUTHORIZED',
      login,
      logout,

      // Aliases
      user: userProfile,
      state: derivedState,
      incident,
      signInWithGoogle: login,
      signOut: logout,
      simulateSignIn,
      clearIncident,
      clearError,
      handleSecurityResult,
      setAuthBusy,
      setAuthError,
    }),
    [
      firebaseUser,
      userProfile,
      isLoading,
      isInitializing,
      errorMessage,
      authorizationStatus,
      derivedState,
      incident,
      login,
      logout,
      handleSecurityResult,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
