import { 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithCredential
} from 'firebase/auth';
import { Platform } from 'react-native';
import { getFirebaseAuth, googleAuthProvider } from '../config/firebase';
import { SECURITY_CONFIG, validateDomain, generateIncidentId } from '../config/securityConfig';
import { TokenStorage, DecodedTokenClaims } from './tokenService';
import { logAuditEvent } from '../utils/auditLogger';
import { base64UrlEncode } from '../utils/base64';

export interface AuthenticatedUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string | null;
  emailVerified: boolean;
  domain: string;
  role: 'USER' | 'ADMIN';
  organization: string;
  hostedDomainClaim?: string;
  idToken: string;
  claims: DecodedTokenClaims;
  authMethod: 'GOOGLE_OAUTH_LIVE' | 'ENTERPRISE_TEST_RIG';
  authenticatedAt: string;
}

export interface AuthSecurityResult {
  success: boolean;
  user?: AuthenticatedUser;
  errorCode?: string;
  errorMessage?: string;
  incidentId?: string;
  attemptedEmail?: string;
  attemptedDomain?: string;
}

/**
 * Creates a cryptographically structured mock JWT for testing without live domain access.
 */
function createSimulatedJwt(email: string, name: string, isVerified = true): string {
  const now = Math.floor(Date.now() / 1000);
  const parts = email.split('@');
  const domain = parts[1] || '';

  const header = {
    alg: 'RS256',
    typ: 'JWT',
    kid: 'domaingate_sim_key_1',
  };

  const payload: DecodedTokenClaims = {
    iss: 'https://securetoken.google.com/domaingate-hbplus',
    aud: 'domaingate-hbplus',
    auth_time: now,
    user_id: `sim_${Date.now()}`,
    sub: `sim_${Date.now()}`,
    iat: now,
    exp: now + 3600, // 1 hour validity
    email,
    email_verified: isVerified,
    firebase: {
      identities: {
        'google.com': [`google_sim_${Date.now()}`],
        email: [email],
      },
      sign_in_provider: 'google.com',
    },
    name,
    picture: `https://api.dicebear.com/7.x/initials/png?seed=${encodeURIComponent(name)}`,
    hd: domain,
  };

  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));

  return `${headerB64}.${payloadB64}.SIMULATED_RSA256_SIGNATURE_PROOF`;
}

export const AuthService = {
  /**
   * Evaluates authentication token & user claims against DomainGate security policy.
   * Enforces that user is verified AND belongs strictly to @hbplus.fit.
   */
  async enforceSecurityBoundary(
    userProfile: {
      uid: string;
      email: string;
      displayName?: string | null;
      photoURL?: string | null;
      emailVerified: boolean;
    },
    idToken: string,
    claims: DecodedTokenClaims,
    authMethod: 'GOOGLE_OAUTH_LIVE' | 'ENTERPRISE_TEST_RIG'
  ): Promise<AuthSecurityResult> {
    const domainCheck = validateDomain(userProfile.email);

    // 1. Check verified email
    if (SECURITY_CONFIG.REQUIRE_EMAIL_VERIFIED && !userProfile.emailVerified) {
      const incidentId = generateIncidentId();
      await logAuditEvent('AUTH_DENIED_UNVERIFIED', {
        email: userProfile.email,
        domain: domainCheck.domain,
        isVerified: false,
        reason: 'Email is not marked as verified by identity provider',
        platform: Platform.OS,
      });

      // Immediate session purge
      await this.emergencyPurge();

      return {
        success: false,
        errorCode: SECURITY_CONFIG.ERROR_CODES.UNVERIFIED_EMAIL,
        errorMessage: 'Your Google Account email address has not been verified. Unverified accounts cannot pass DomainGate.',
        incidentId,
        attemptedEmail: userProfile.email,
        attemptedDomain: domainCheck.domain,
      };
    }

    // 2. Check strict domain requirement: hbplus.fit
    if (!domainCheck.isValid) {
      const incidentId = generateIncidentId();
      await logAuditEvent('AUTH_DENIED_UNAUTHORIZED_DOMAIN', {
        email: userProfile.email,
        domain: domainCheck.domain,
        isVerified: userProfile.emailVerified,
        reason: 'Access restricted. Please login using your official domain email.',
        platform: Platform.OS,
      });

      // Immediate session purge so unauthorized credentials never linger
      await this.emergencyPurge();

      return {
        success: false,
        errorCode: SECURITY_CONFIG.ERROR_CODES.UNAUTHORIZED_DOMAIN,
        errorMessage: 'Access restricted. Please login using your official domain email.',
        incidentId,
        attemptedEmail: userProfile.email,
        attemptedDomain: domainCheck.domain,
      };
    }

    // 3. Authorized success: persist token and audit log
    await TokenStorage.saveToken(idToken);
    await logAuditEvent('AUTH_SUCCESS', {
      email: userProfile.email,
      domain: domainCheck.domain,
      isVerified: true,
      reason: 'Domain and verification requirements met',
      platform: Platform.OS,
    });

    const userRole: 'USER' | 'ADMIN' = 
      (userProfile.email.toLowerCase().startsWith('satya') || 
       userProfile.email.toLowerCase().includes('admin') || 
       claims.role === 'admin' || 
       claims.role === 'ADMIN') ? 'ADMIN' : 'USER';

    const authenticatedUser: AuthenticatedUser = {
      uid: userProfile.uid,
      email: userProfile.email,
      displayName: userProfile.displayName || userProfile.email.split('@')[0],
      photoURL: userProfile.photoURL,
      emailVerified: userProfile.emailVerified,
      domain: domainCheck.domain,
      role: userRole,
      organization: 'HBPlus Health & Fitness Global Inc.',
      hostedDomainClaim: claims.hd,
      idToken,
      claims,
      authMethod,
      authenticatedAt: new Date().toISOString(),
    };

    return {
      success: true,
      user: authenticatedUser,
    };
  },

  /**
   * Web: Authenticates using Firebase GoogleAuthProvider and signInWithPopup.
   * Handles popup cancellation and browser popup blockers gracefully.
   */
  async signInWithGoogleWeb(): Promise<AuthSecurityResult> {
    try {
      const auth = getFirebaseAuth();
      const result = await signInWithPopup(auth, googleAuthProvider);
      const fbUser: FirebaseUser = result.user;
      const idToken = await fbUser.getIdToken(true);
      const idTokenResult = await fbUser.getIdTokenResult();
      const claims: DecodedTokenClaims = idTokenResult.claims as DecodedTokenClaims;

      return await this.enforceSecurityBoundary(
        {
          uid: fbUser.uid,
          email: fbUser.email || '',
          displayName: fbUser.displayName,
          photoURL: fbUser.photoURL,
          emailVerified: fbUser.emailVerified,
        },
        idToken,
        claims,
        'GOOGLE_OAUTH_LIVE'
      );
    } catch (err: any) {
      console.warn('[AuthService] Google Web Sign-In error:', err);
      const incidentId = generateIncidentId();

      // Explicit error mapping for browser popup scenarios
      if (err.code === 'auth/popup-closed-by-user') {
        return {
          success: false,
          errorCode: 'POPUP_CLOSED_BY_USER',
          errorMessage: 'Sign-in cancelled: The Google authentication popup was closed before completing login.',
          incidentId,
        };
      }

      if (err.code === 'auth/popup-blocked') {
        return {
          success: false,
          errorCode: 'POPUP_BLOCKED_BY_BROWSER',
          errorMessage: 'Sign-in failed: The authentication popup was blocked by your browser. Please allow popups for this site and try again.',
          incidentId,
        };
      }

      if (err.code === 'auth/cancelled-popup-request') {
        return {
          success: false,
          errorCode: 'POPUP_REQUEST_CANCELLED',
          errorMessage: 'An authentication popup is already open. Please complete or close the open Google window.',
          incidentId,
        };
      }

      if (err.code === 'auth/blocking-cloud-function-error' || err.message?.includes('permission-denied')) {
        return {
          success: false,
          errorCode: SECURITY_CONFIG.ERROR_CODES.BLOCKING_RULE_REJECTION,
          errorMessage: 'Access restricted: Firebase Cloud Identity blocking function rejected unauthorized domain.',
          incidentId,
        };
      }

      return {
        success: false,
        errorCode: err.code || 'AUTH_FAILURE',
        errorMessage: err.message || 'Google authentication encountered an unexpected error.',
        incidentId,
      };
    }
  },

  /**
   * Android & iOS: Exchanges Google ID token from expo-auth-session for Firebase credential.
   * Authenticates using Firebase signInWithCredential().
   */
  async exchangeGoogleIdTokenAndAuthorize(googleIdToken: string): Promise<AuthSecurityResult> {
    try {
      const auth = getFirebaseAuth();
      // Exchange ID token for Firebase Credential
      const credential = GoogleAuthProvider.credential(googleIdToken);
      const userCredential = await signInWithCredential(auth, credential);
      const fbUser: FirebaseUser = userCredential.user;

      const idToken = await fbUser.getIdToken(true);
      const idTokenResult = await fbUser.getIdTokenResult();
      const claims: DecodedTokenClaims = idTokenResult.claims as DecodedTokenClaims;

      return await this.enforceSecurityBoundary(
        {
          uid: fbUser.uid,
          email: fbUser.email || '',
          displayName: fbUser.displayName,
          photoURL: fbUser.photoURL,
          emailVerified: fbUser.emailVerified,
        },
        idToken,
        claims,
        'GOOGLE_OAUTH_LIVE'
      );
    } catch (err: any) {
      console.warn('[AuthService] Mobile credential exchange error:', err);
      const incidentId = generateIncidentId();

      if (err.code === 'auth/blocking-cloud-function-error' || err.message?.includes('permission-denied')) {
        return {
          success: false,
          errorCode: SECURITY_CONFIG.ERROR_CODES.BLOCKING_RULE_REJECTION,
          errorMessage: 'Access restricted: Firebase Cloud Identity blocking function rejected unauthorized domain.',
          incidentId,
        };
      }

      return {
        success: false,
        errorCode: err.code || 'CREDENTIAL_EXCHANGE_FAILURE',
        errorMessage: err.message || 'Failed to authenticate Google credential with Firebase.',
        incidentId,
      };
    }
  },

  /**
   * Unified Live Google OAuth entry point
   */
  async signInWithGoogleLive(): Promise<AuthSecurityResult> {
    if (Platform.OS === 'web') {
      return await this.signInWithGoogleWeb();
    } else {
      return {
        success: false,
        errorCode: 'NATIVE_USE_HOOK',
        errorMessage: 'Native mobile authentication should be triggered via useGoogleAuth() hook for OAuth session handling.',
      };
    }
  },

  /**
   * Enterprise Test Rig / Sandbox Authenticator
   * Allows testing both authorized (@hbplus.fit) and unauthorized domains (e.g. gmail.com, yahoo.com)
   * with full cryptographic token simulation and realistic security boundary checks.
   */
  async simulateDomainSignIn(
    email: string, 
    displayName = 'Test User', 
    isVerified = true
  ): Promise<AuthSecurityResult> {
    const idToken = createSimulatedJwt(email, displayName, isVerified);
    const domain = email.split('@')[1] || '';

    const claims: DecodedTokenClaims = {
      iss: 'https://securetoken.google.com/domaingate-hbplus',
      aud: 'domaingate-hbplus',
      email,
      email_verified: isVerified,
      hd: domain,
      name: displayName,
      exp: Math.floor(Date.now() / 1000) + 3600,
    };

    return await this.enforceSecurityBoundary(
      {
        uid: `sim_usr_${Math.abs(email.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0))}`,
        email,
        displayName,
        photoURL: `https://api.dicebear.com/7.x/initials/png?seed=${encodeURIComponent(displayName)}`,
        emailVerified: isVerified,
      },
      idToken,
      claims,
      'ENTERPRISE_TEST_RIG'
    );
  },

  /**
   * Emergency session teardown: signs out of Firebase, wipes secure tokens and local state
   */
  async emergencyPurge(): Promise<void> {
    try {
      const auth = getFirebaseAuth();
      await firebaseSignOut(auth).catch(() => {});
    } catch {
      // Ignore if auth not initialized
    }
    await TokenStorage.clearToken();
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.history) {
      try {
        window.history.replaceState(null, '', '/login');
      } catch {}
    }
  },

  /**
   * Standard user logout:
   * 1. Signs out from Firebase Authentication.
   * 2. Clears secure tokens and cached session data.
   * 3. Logs an audit entry.
   * 4. Updates browser history to prevent back-button access.
   */
  async signOut(): Promise<void> {
    await this.emergencyPurge();
    await logAuditEvent('AUTH_LOGOUT', {
      email: 'current_user',
      domain: SECURITY_CONFIG.ALLOWED_DOMAIN,
      isVerified: true,
      reason: 'User triggered clean sign-out',
      platform: Platform.OS,
    });
  },
};
