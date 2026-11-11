/**
 * DomainGate Security Policy Configuration
 * 
 * Defines enterprise access control policies, authorized domains,
 * security error codes, and audit requirements.
 */

import { isAllowedDomain, validateDomainAccess } from '../utils/domainValidator';

export const SECURITY_CONFIG = {
  // Centralized allowed email domain for all users
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

export { isAllowedDomain, validateDomainAccess };

/**
 * Validates whether an email string strictly belongs to the authorized domain.
 * Integrates directly with src/utils/domainValidator.ts.
 */
export function validateDomain(email?: string | null): {
  isValid: boolean;
  normalizedEmail: string;
  domain: string;
  reason?: string;
} {
  const result = validateDomainAccess(email, true);
  return {
    isValid: result.isValid,
    normalizedEmail: result.normalizedEmail,
    domain: result.domain,
    reason: result.reason,
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

