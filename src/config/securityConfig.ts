/**
 * DomainGate Security Policy Configuration
 * 
 * Re-exports centralized settings from src/constants/config.ts
 * and provides domain validation helper functions.
 */

import { APP_CONFIG, SECURITY_CONFIG } from '../constants/config';
import { isAllowedDomain, validateDomainAccess } from '../utils/domainValidator';

export { APP_CONFIG, SECURITY_CONFIG, isAllowedDomain, validateDomainAccess };

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
