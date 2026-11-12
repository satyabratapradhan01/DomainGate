/**
 * DomainGate - Authentication & Authorization Type Definitions
 * 
 * Centralized TypeScript types for user profiles, roles, security claims,
 * session states, and Firestore user schemas.
 */

export type UserRole = 'ADMIN' | 'USER';

export type AuthorizationStatus = 
  | 'IDLE' 
  | 'CHECKING' 
  | 'AUTHORIZED' 
  | 'UNAUTHORIZED' 
  | 'ERROR';

export type AuthState = 
  | 'IDLE'
  | 'AUTHENTICATING'
  | 'VERIFYING_DOMAIN'
  | 'AUTHORIZED'
  | 'ACCESS_DENIED'
  | 'ERROR';

export interface DecodedTokenClaims {
  iss?: string;
  sub?: string;
  aud?: string;
  exp?: number;
  iat?: number;
  email?: string;
  email_verified?: boolean;
  hd?: string; // Google Hosted Domain claim
  name?: string;
  picture?: string;
  role?: string;
  admin?: boolean;
  auth_time?: number;
  [key: string]: any;
}

export interface SecurityIncident {
  incidentId: string;
  attemptedEmail: string;
  attemptedDomain: string;
  errorCode: string;
  errorMessage: string;
  timestamp: string;
}

export interface AuthenticatedUser {
  uid: string;
  email: string;
  displayName: string | null | undefined;
  photoURL: string | null | undefined;
  emailVerified: boolean;
  domain: string;
  role: UserRole;
  organization: string;
  hostedDomainClaim?: string;
  idToken?: string;
  claims?: DecodedTokenClaims;
  authMethod: 'GOOGLE_OAUTH_LIVE' | 'ENTERPRISE_TEST_RIG';
  authenticatedAt: string;
}

export interface UserProfileDocument {
  uid: string;
  name: string;
  email: string;
  photoURL: string | null | undefined;
  role: UserRole;
  organization: string;
  createdAt: string;
  lastLoginAt: string;
  emailVerified?: boolean;
  domain?: string;
}

export interface UserProfile extends AuthenticatedUser {
  firestoreProfile?: UserProfileDocument;
}

export interface AuthSecurityResult {
  success: boolean;
  user?: UserProfile;
  errorCode?: string;
  errorMessage?: string;
  incidentId?: string;
  attemptedEmail?: string;
  attemptedDomain?: string;
}
