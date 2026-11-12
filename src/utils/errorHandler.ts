/**
 * DomainGate - Enterprise Error Handling & Sanitization Engine
 * 
 * Maps internal Firebase, OAuth, network, and security exceptions to
 * clear, actionable, user-friendly messages.
 * 
 * SECURITY DIRECTIVE:
 * Never expose internal Firebase error codes, stack traces, project IDs,
 * or raw server diagnostics to users.
 */

export type DomainGateErrorCode =
  | 'AUTH_CANCELLED'
  | 'AUTH_FAILED'
  | 'INVALID_OAUTH_CONFIG'
  | 'UNAUTHORIZED_DOMAIN'
  | 'UNVERIFIED_EMAIL'
  | 'NETWORK_ERROR'
  | 'FIRESTORE_ERROR'
  | 'PROFILE_MISSING'
  | 'SESSION_EXPIRED'
  | 'LOGOUT_FAILED'
  | 'POPUP_BLOCKED'
  | 'UNKNOWN_ERROR';

export interface SanitizedError {
  code: DomainGateErrorCode;
  userMessage: string;
  isRecoverable: boolean;
}

/**
 * Normalizes any error object, string, or Firebase exception into a sanitized,
 * safe, and user-friendly DomainGate error structure.
 */
export function sanitizeAuthError(error: any): SanitizedError {
  if (!error) {
    return {
      code: 'UNKNOWN_ERROR',
      userMessage: 'An unexpected authentication error occurred. Please try again.',
      isRecoverable: true,
    };
  }

  const rawCode: string = (error.code || error.errorCode || '').toLowerCase();
  const rawMsg: string = (error.message || error.errorMessage || error.toString() || '').toLowerCase();

  // 1. Browser Popup Restrictions
  if (
    rawCode.includes('popup-blocked') ||
    rawMsg.includes('popup was blocked') ||
    rawMsg.includes('blocked popup')
  ) {
    return {
      code: 'POPUP_BLOCKED',
      userMessage: 'Sign-in popup was blocked by your browser. Please allow popups for this site and try again.',
      isRecoverable: true,
    };
  }

  // 2. Google Authentication Cancellation
  if (
    rawCode.includes('popup-closed-by-user') ||
    rawCode.includes('cancelled-popup-request') ||
    rawCode.includes('dismissed') ||
    rawCode.includes('auth_cancelled') ||
    rawMsg.includes('popup closed') ||
    rawMsg.includes('cancelled')
  ) {
    return {
      code: 'AUTH_CANCELLED',
      userMessage: 'Sign-in was cancelled before completion. Please try again when ready.',
      isRecoverable: true,
    };
  }

  // 3. Unauthorized Email Domain (Zero-Trust Violation)
  if (
    rawCode.includes('unauthorized_domain') ||
    rawCode.includes('err_unauthorized_domain') ||
    rawMsg.includes('official domain email') ||
    rawMsg.includes('unauthorized domain') ||
    rawMsg.includes('hbplus.fit')
  ) {
    return {
      code: 'UNAUTHORIZED_DOMAIN',
      userMessage: 'Access restricted. Please login using your official domain email.',
      isRecoverable: false,
    };
  }

  // 4. Unverified Email
  if (
    rawCode.includes('unverified_email') ||
    rawCode.includes('err_unverified_email') ||
    rawMsg.includes('unverified') ||
    rawMsg.includes('email is not verified')
  ) {
    return {
      code: 'UNVERIFIED_EMAIL',
      userMessage: 'Access restricted. Please verify your Google account email address before logging in.',
      isRecoverable: false,
    };
  }

  // 5. Invalid OAuth Configuration
  if (
    rawCode.includes('invalid-api-key') ||
    rawCode.includes('configuration-not-found') ||
    rawCode.includes('unauthorized-domain') || // Firebase Auth domain whitelist
    rawCode.includes('operation-not-allowed') ||
    rawCode.includes('invalid-app-credential') ||
    rawMsg.includes('configuration') ||
    rawMsg.includes('api key not valid')
  ) {
    return {
      code: 'INVALID_OAUTH_CONFIG',
      userMessage: 'Authentication service configuration error. Please contact your organization IT administrator.',
      isRecoverable: false,
    };
  }

  // 6. Firebase Network Errors
  if (
    rawCode.includes('network-request-failed') ||
    rawCode.includes('timeout') ||
    rawCode.includes('offline') ||
    rawMsg.includes('network error') ||
    rawMsg.includes('failed to fetch') ||
    rawMsg.includes('internet connection')
  ) {
    return {
      code: 'NETWORK_ERROR',
      userMessage: 'Network connectivity issue. Please check your internet connection and try again.',
      isRecoverable: true,
    };
  }

  // 7. Cloud Firestore Errors
  if (
    rawCode.includes('firestore') ||
    rawCode.includes('permission-denied') ||
    rawCode.includes('unavailable') ||
    rawCode.includes('resource-exhausted') ||
    rawMsg.includes('firestore')
  ) {
    return {
      code: 'FIRESTORE_ERROR',
      userMessage: 'Unable to sync organization data. Your account access permissions have been verified.',
      isRecoverable: true,
    };
  }

  // 8. Missing User Profile
  if (
    rawCode.includes('profile_missing') ||
    rawMsg.includes('profile could not be loaded') ||
    rawMsg.includes('missing user profile')
  ) {
    return {
      code: 'PROFILE_MISSING',
      userMessage: 'Your organization profile could not be loaded. Please sign in again or contact IT support.',
      isRecoverable: true,
    };
  }

  // 9. Session Expiration
  if (
    rawCode.includes('token-expired') ||
    rawCode.includes('session_expired') ||
    rawCode.includes('user-token-expired') ||
    rawMsg.includes('token has expired') ||
    rawMsg.includes('session expired')
  ) {
    return {
      code: 'SESSION_EXPIRED',
      userMessage: 'Your security session has expired. Please sign in again to continue.',
      isRecoverable: true,
    };
  }

  // 10. Logout Failure
  if (
    rawCode.includes('logout_failed') ||
    rawMsg.includes('logout') ||
    rawMsg.includes('signout')
  ) {
    return {
      code: 'LOGOUT_FAILED',
      userMessage: 'Sign-out encountered an issue, but your local session has been safely cleared.',
      isRecoverable: true,
    };
  }

  // 11. Google Authentication General Failure
  if (
    rawCode.includes('invalid-credential') ||
    rawCode.includes('user-disabled') ||
    rawCode.includes('account-exists-with-different-credential') ||
    rawCode.includes('auth/')
  ) {
    return {
      code: 'AUTH_FAILED',
      userMessage: 'Google authentication could not be completed. Please ensure you select an active organization account.',
      isRecoverable: true,
    };
  }

  // Default Sanitized Fallback
  return {
    code: 'UNKNOWN_ERROR',
    userMessage: 'An unexpected authentication error occurred. Please try again.',
    isRecoverable: true,
  };
}

