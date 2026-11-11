/**
 * DomainGate Security Policy Configuration
 * 
 * Defines enterprise access control policies, authorized domains,
 * security error codes, and audit requirements.
 */

export const SECURITY_CONFIG = {
  // The strictly authorized email domain for all users
  ALLOWED_DOMAIN: 'hbplus.fit',
  
  // Security Enforcement Mode
  ENFORCEMENT_MODE: 'STRICT_BLOCKING', // 'STRICT_BLOCKING' | 'MONITORING'
  
  // Require cryptographically verified email from Google OAuth
  REQUIRE_EMAIL_VERIFIED: true,
  
  // Security Reason / Error Codes
  ERROR_CODES: {
    UNAUTHORIZED_DOMAIN: 'ERR_UNAUTHORIZED_DOMAIN',
    UNVERIFIED_EMAIL: 'ERR_UNVERIFIED_EMAIL',
    TOKEN_SIGNATURE_INVALID: 'ERR_TOKEN_SIGNATURE_INVALID',
    BLOCKING_RULE_REJECTION: 'ERR_FIREBASE_BLOCKING_REJECTION',
    MALFORMED_CLAIMS: 'ERR_MALFORMED_CLAIMS',
    SESSION_EXPIRED: 'ERR_SESSION_EXPIRED',
  } as const,
  
  // Storage Keys for Secure Store / Local Persistence
  STORAGE_KEYS: {
    AUTH_TOKEN: 'domaingate_secure_token',
    USER_PROFILE: 'domaingate_user_profile',
    AUDIT_LOG: 'domaingate_security_audit',
  } as const,
};

/**
 * Validates whether an email string strictly belongs to the authorized domain
 * and is normalized to prevent Unicode/homograph or case-bypass attacks.
 */
export function validateDomain(email?: string | null): {
  isValid: boolean;
  normalizedEmail: string;
  domain: string;
  reason?: string;
} {
  if (!email || typeof email !== 'string') {
    return {
      isValid: false,
      normalizedEmail: '',
      domain: '',
      reason: 'Missing or empty email address',
    };
  }

  // Normalize: lower case and trim spaces
  const normalized = email.trim().toLowerCase();
  
  // Strict regex splitting local part from domain
  const parts = normalized.split('@');
  if (parts.length !== 2) {
    return {
      isValid: false,
      normalizedEmail: normalized,
      domain: '',
      reason: 'Malformed email structure',
    };
  }

  const [localPart, domainPart] = parts;
  if (!localPart || !domainPart) {
    return {
      isValid: false,
      normalizedEmail: normalized,
      domain: domainPart || '',
      reason: 'Empty user or domain component',
    };
  }

  // Ensure exact match against allowed domain
  const targetDomain = SECURITY_CONFIG.ALLOWED_DOMAIN.toLowerCase();
  const isValid = domainPart === targetDomain;

  return {
    isValid,
    normalizedEmail: normalized,
    domain: domainPart,
    reason: isValid 
      ? undefined 
      : `Domain '@${domainPart}' is not authorized. Access is restricted exclusively to '@${targetDomain}'.`,
  };
}

/**
 * Generates an enterprise security incident trace ID for audit logging
 */
export function generateIncidentId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `SEC-INC-${timestamp}-${randomPart}`;
}

