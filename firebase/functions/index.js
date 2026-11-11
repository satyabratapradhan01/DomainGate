/**
 * DomainGate - Firebase Authentication Blocking Functions & Security API
 * 
 * Architecture Role: Firebase Architect & Application Security Engineer
 * 
 * SECURITY SPECIFICATION:
 * Rather than relying solely on client-side routing checks, this module implements
 * Google Cloud Identity Platform / Firebase Auth Blocking Functions.
 * 
 * 1. `beforeUserCreated`: Runs server-side synchronously BEFORE an account is registered.
 *    If email is not verified or domain is not @hbplus.fit, authentication is halted
 *    at the identity provider level, preventing account creation and token issuance.
 * 
 * 2. `beforeUserSignedIn`: Runs before every token refresh or sign-in. Validates domain
 *    and stamps cryptographic Custom Claims into the Firebase ID token.
 * 
 * 3. `verifyDomainAccess`: Callable HTTPS function for backend API services to verify
 *    caller tokens and return sensitive workspace payload.
 */

const { beforeUserCreated, beforeUserSignedIn, HttpsError } = require('firebase-functions/v2/identity');
const { onCall } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');

admin.initializeApp();

const ALLOWED_DOMAIN = 'hbplus.fit';

/**
 * Validates domain and verification status against strict corporate criteria.
 */
function evaluateDomainAccess(user) {
  const email = user?.email;
  const isEmailVerified = user?.emailVerified;

  if (!email) {
    throw new HttpsError(
      'invalid-argument',
      'DomainGate Security: An email address is required for authentication.'
    );
  }

  // Ensure email was verified by Google OAuth IdP
  if (!isEmailVerified) {
    throw new HttpsError(
      'unauthenticated',
      'DomainGate Security: Email is not verified by Google. Unverified emails are rejected.'
    );
  }

  const normalized = email.toLowerCase().trim();
  const domain = normalized.split('@')[1];

  if (domain !== ALLOWED_DOMAIN) {
    console.warn(`[Security Alert] Blocked registration/sign-in attempt for unauthorized domain: ${domain} (email: ${email})`);
    throw new HttpsError(
      'permission-denied',
      `Access Denied: Domain '@${domain}' is unauthorized. Only verified '@${ALLOWED_DOMAIN}' corporate accounts may access DomainGate.`
    );
  }

  return { email: normalized, domain };
}

/**
 * BLOCKING FUNCTION 1: Intercepts account creation
 * Halts account creation at the Google Cloud Identity layer before an ID token is created.
 */
exports.beforeUserCreated = beforeUserCreated((event) => {
  const user = event.data;
  console.log(`[DomainGate Security] Checking new user creation: ${user.email}`);

  const { domain } = evaluateDomainAccess(user);

  // Issue custom claims embedded inside the cryptographically signed JWT
  return {
    customClaims: {
      authorizedDomain: domain,
      hbplusVerified: true,
      role: 'member',
      securityLevel: 'RESTRICTED_CORPORATE',
    },
  };
});

/**
 * BLOCKING FUNCTION 2: Intercepts subsequent user sign-ins
 * Prevents account hijacking or domain revocation bypasses.
 */
exports.beforeUserSignedIn = beforeUserSignedIn((event) => {
  const user = event.data;
  console.log(`[DomainGate Security] Checking sign-in: ${user.email}`);

  const { domain } = evaluateDomainAccess(user);

  return {
    customClaims: {
      authorizedDomain: domain,
      hbplusVerified: true,
      lastAuthAudit: Date.now(),
    },
  };
});

/**
 * CALLABLE FUNCTION: Secure Backend Gateway
 * Allows client apps or microservices to exchange their Firebase ID token
 * for protected corporate workspace data.
 */
exports.verifyHBPlusAccess = onCall(async (request) => {
  // 1. Verify caller is authenticated
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Request lacks valid authentication credentials.');
  }

  const token = request.auth.token;
  const email = token.email;

  // 2. Server-side validation of token claims
  if (!email || !token.email_verified || !email.toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`)) {
    throw new HttpsError(
      'permission-denied',
      `Security Policy Violation: Account '${email}' does not belong to authorized domain '@${ALLOWED_DOMAIN}'.`
    );
  }

  // 3. Return protected corporate workspace payload
  return {
    status: 'AUTHORIZED',
    message: `Secure session confirmed for ${email}`,
    workspace: {
      organization: 'HBPlus Corporate Fitness',
      authorizedDomain: ALLOWED_DOMAIN,
      tier: 'ENTERPRISE_CORE',
      accessGrantedAt: new Date().toISOString(),
      permissions: ['read:workspace', 'write:records', 'audit:logs'],
    },
  };
});

