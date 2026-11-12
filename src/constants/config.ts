/**
 * DomainGate - Application & Security Configuration Constants
 * 
 * Centralized settings for authorized corporate domains, error codes,
 * local storage keys, and authentication parameters.
 */

export const APP_CONFIG = {
  APP_NAME: 'DomainGate',
  ORGANIZATION_NAME: 'HBPlus Health & Fitness Global Inc.',
  ALLOWED_DOMAIN: 'hbplus.fit',
  DEFAULT_ROLE: 'USER' as const,
  PORTAL_SUBTITLE: 'Authorized Internal Corporate Workspace',
  
  // Security Enforcement Mode
  ENFORCEMENT_MODE: 'STRICT_BLOCKING' as const,
  REQUIRE_EMAIL_VERIFIED: true,

  // Standardized Error Codes
  ERROR_CODES: {
    UNAUTHORIZED_DOMAIN: 'ERR_UNAUTHORIZED_DOMAIN',
    UNVERIFIED_EMAIL: 'ERR_UNVERIFIED_EMAIL',
    TOKEN_SIGNATURE_INVALID: 'ERR_TOKEN_SIGNATURE_INVALID',
    BLOCKING_RULE_REJECTION: 'ERR_FIREBASE_BLOCKING_REJECTION',
    MALFORMED_CLAIMS: 'ERR_MALFORMED_CLAIMS',
    SESSION_EXPIRED: 'ERR_SESSION_EXPIRED',
    UNAUTHORIZED_ROLE_MODIFICATION: 'ERR_UNAUTHORIZED_ROLE_MODIFICATION',
  } as const,

  // Storage Keys for Secure Store & AsyncStorage
  STORAGE_KEYS: {
    AUTH_TOKEN: 'domaingate_secure_token',
    USER_PROFILE: 'domaingate_user_profile',
    AUDIT_LOG: 'domaingate_security_audit',
  } as const,

  // Deep Linking URL Prefixes
  LINKING_PREFIXES: [
    'domaingate://',
    'https://domaingate.netlify.app',
    'http://localhost:8081',
    'http://localhost:19006',
  ],
};

export const SECURITY_CONFIG = APP_CONFIG;

