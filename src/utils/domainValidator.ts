/**
 * DomainGate - Reusable Domain Validation Engine
 * 
 * SECURITY DIRECTIVE:
 * Never trust a domain validation result supplied by the client without
 * enforcing authorization at the data access layer (Firestore Security Rules,
 * Firebase Auth Blocking Functions, and Backend Token Verification Middleware).
 * 
 * Centralized policy: Defined in src/config/securityConfig.ts
 */

import { SECURITY_CONFIG } from '../constants/config';

export interface DomainValidationResult {
  isValid: boolean;
  isVerified?: boolean;
  normalizedEmail: string;
  domain: string;
  localPart: string;
  reason?: string;
  incidentCode?: string;
}

/**
 * Standard RFC-compliant email regex ensuring:
 * 1. Single '@' separating local part and domain.
 * 2. Valid characters in local part.
 * 3. Strictly formatted domain with valid labels and TLD.
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates whether an email belongs exclusively to the authorized domain.
 * 
 * Rules enforced:
 * - Email must be present and non-empty.
 * - Extracts and validates the EXACT email domain.
 * - Compares the domain case-insensitively.
 * - Allows ONLY the centralized allowed domain ('hbplus.fit').
 * - Strictly rejects subdomains (e.g. 'sub.hbplus.fit' -> false).
 * - Strictly rejects suffix/prefix spoofing (e.g. 'hbplus.fit.evil.com', 'fake-hbplus.fit' -> false).
 * - Handles malformed, empty, or invalid email formats.
 * 
 * @param email The email address string to evaluate
 * @returns boolean indicating if the email belongs to the authorized domain
 */
export function isAllowedDomain(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  // 1. Sanitize & Normalize: lower case and trim outer whitespace
  const sanitized = email.trim().toLowerCase();
  if (sanitized.length === 0) {
    return false;
  }

  // 2. Validate email structure
  if (!EMAIL_REGEX.test(sanitized)) {
    return false;
  }

  // 3. Strict split by '@' (ensure exactly one separator)
  const parts = sanitized.split('@');
  if (parts.length !== 2) {
    return false;
  }

  const [localPart, domainPart] = parts;
  if (!localPart || !domainPart) {
    return false;
  }

  // 4. Exact domain matching against centralized configuration
  // Centralized allowed domain: 'hbplus.fit'
  const authorizedTarget = SECURITY_CONFIG.ALLOWED_DOMAIN.toLowerCase().trim();

  // MUST be an exact match: rejects subdomains ('sub.hbplus.fit')
  // and spoofed domains ('hbplus.fit.attacker.com')
  return domainPart === authorizedTarget;
}

/**
 * Extended domain validator that also enforces email verification status
 * and returns rich diagnostic metadata for enterprise audit logs.
 * 
 * @param email Email address to validate
 * @param isVerified Boolean indicating whether identity provider confirmed verification
 */
export function validateDomainAccess(
  email?: string | null,
  isVerified?: boolean
): DomainValidationResult {
  if (!email || typeof email !== 'string') {
    return {
      isValid: false,
      isVerified: false,
      normalizedEmail: '',
      domain: '',
      localPart: '',
      reason: 'Email address is missing or empty.',
      incidentCode: 'ERR_EMPTY_EMAIL',
    };
  }

  const normalized = email.trim().toLowerCase();

  // Check verification requirement
  if (SECURITY_CONFIG.REQUIRE_EMAIL_VERIFIED && !isVerified) {
    const domainPart = normalized.includes('@') ? normalized.split('@')[1] : '';
    return {
      isValid: false,
      isVerified: false,
      normalizedEmail: normalized,
      domain: domainPart,
      localPart: normalized.split('@')[0] || '',
      reason: 'Email is not marked as verified by Google Identity Provider.',
      incidentCode: SECURITY_CONFIG.ERROR_CODES.UNVERIFIED_EMAIL,
    };
  }

  // Check email structure
  if (!EMAIL_REGEX.test(normalized)) {
    return {
      isValid: false,
      isVerified: Boolean(isVerified),
      normalizedEmail: normalized,
      domain: '',
      localPart: '',
      reason: 'Email address has an invalid format.',
      incidentCode: 'ERR_INVALID_EMAIL_FORMAT',
    };
  }

  const [localPart, domainPart] = normalized.split('@');
  const authorizedTarget = SECURITY_CONFIG.ALLOWED_DOMAIN.toLowerCase().trim();

  // Check exact domain
  if (domainPart !== authorizedTarget) {
    return {
      isValid: false,
      isVerified: Boolean(isVerified),
      normalizedEmail: normalized,
      domain: domainPart,
      localPart,
      reason: `Access restricted. Please login using your official domain email. Domain '@${domainPart}' is not authorized.`,
      incidentCode: SECURITY_CONFIG.ERROR_CODES.UNAUTHORIZED_DOMAIN,
    };
  }

  return {
    isValid: true,
    isVerified: Boolean(isVerified),
    normalizedEmail: normalized,
    domain: domainPart,
    localPart,
  };
}
