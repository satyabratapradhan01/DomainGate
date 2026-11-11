/**
 * DomainGate - Security Boundary & Domain Firewall Unit Tests
 * 
 * Verifies strict domain boundary enforcement, edge-case rejection,
 * homograph/subdomain bypass mitigation, and JWT claims inspection.
 */

import { validateDomain, SECURITY_CONFIG } from '../config/securityConfig';
import { decodeJwtClaims, isTokenExpired } from '../services/tokenService';
import { base64UrlEncode, base64UrlDecode } from '../utils/base64';

export function runSecurityTestSuite(): {
  total: number;
  passed: number;
  failed: number;
  results: Array<{ name: string; passed: boolean; details?: string }>;
} {
  const tests: Array<{ name: string; fn: () => void }> = [];
  const results: Array<{ name: string; passed: boolean; details?: string }> = [];

  const addTest = (name: string, fn: () => void) => {
    tests.push({ name, fn });
  };

  // 1. Core Specification Cases
  addTest('Spec Case 1: satya@hbplus.fit should be GRANTED', () => {
    const res = validateDomain('satya@hbplus.fit');
    if (!res.isValid || res.domain !== 'hbplus.fit') {
      throw new Error(`Expected valid domain for satya@hbplus.fit, got: ${JSON.stringify(res)}`);
    }
  });

  addTest('Spec Case 2: example@gmail.com should be DENIED', () => {
    const res = validateDomain('example@gmail.com');
    if (res.isValid || res.domain !== 'gmail.com') {
      throw new Error(`Expected invalid domain for example@gmail.com, got: ${JSON.stringify(res)}`);
    }
  });

  addTest('Spec Case 3: example@yahoo.com should be DENIED', () => {
    const res = validateDomain('example@yahoo.com');
    if (res.isValid || res.domain !== 'yahoo.com') {
      throw new Error(`Expected invalid domain for example@yahoo.com, got: ${JSON.stringify(res)}`);
    }
  });

  addTest('Spec Case 4: example@anothercompany.com should be DENIED', () => {
    const res = validateDomain('example@anothercompany.com');
    if (res.isValid || res.domain !== 'anothercompany.com') {
      throw new Error(`Expected invalid domain for example@anothercompany.com, got: ${JSON.stringify(res)}`);
    }
  });

  // 2. Security Bypass & Edge-Case Attacks
  addTest('Security Test: Subdomain spoofing (satya@sub.hbplus.fit) must be DENIED', () => {
    const res = validateDomain('satya@sub.hbplus.fit');
    if (res.isValid) {
      throw new Error('Subdomain spoofing was not blocked!');
    }
  });

  addTest('Security Test: Suffix spoofing (satya@hbplus.fit.attacker.com) must be DENIED', () => {
    const res = validateDomain('satya@hbplus.fit.attacker.com');
    if (res.isValid) {
      throw new Error('Suffix spoofing was not blocked!');
    }
  });

  addTest('Security Test: Prefix spoofing (satya@fake-hbplus.fit) must be DENIED', () => {
    const res = validateDomain('satya@fake-hbplus.fit');
    if (res.isValid) {
      throw new Error('Prefix spoofing was not blocked!');
    }
  });

  addTest('Security Test: Case-insensitivity normalization (SATYA@HBPLUS.FIT) must be GRANTED', () => {
    const res = validateDomain('SATYA@HBPLUS.FIT');
    if (!res.isValid || res.normalizedEmail !== 'satya@hbplus.fit') {
      throw new Error(`Failed to normalize uppercase corporate email: ${JSON.stringify(res)}`);
    }
  });

  addTest('Security Test: Whitespace trim normalization (  satya@hbplus.fit  ) must be GRANTED', () => {
    const res = validateDomain('  satya@hbplus.fit  ');
    if (!res.isValid || res.normalizedEmail !== 'satya@hbplus.fit') {
      throw new Error(`Failed to trim whitespace: ${JSON.stringify(res)}`);
    }
  });

  addTest('Security Test: Malformed email structure (no @ or double @) must be DENIED', () => {
    if (validateDomain('invalid-email').isValid) throw new Error('Missing @ was permitted');
    if (validateDomain('user@@hbplus.fit').isValid) throw new Error('Double @ was permitted');
    if (validateDomain('@hbplus.fit').isValid) throw new Error('Empty user was permitted');
    if (validateDomain('user@').isValid) throw new Error('Empty domain was permitted');
  });

  // 3. Cryptographic Token & Base64url Engine Tests
  addTest('Crypto Engine: Base64url encode and decode fidelity', () => {
    const original = JSON.stringify({ email: 'satya@hbplus.fit', role: 'admin', ts: 1718000000 });
    const encoded = base64UrlEncode(original);
    const decoded = base64UrlDecode(encoded);
    if (decoded !== original) {
      throw new Error(`Base64url mismatch: expected "${original}", got "${decoded}"`);
    }
  });

  addTest('JWT Parser: Extracts claims and evaluates expiration', () => {
    const now = Math.floor(Date.now() / 1000);
    const mockPayload = {
      iss: 'https://securetoken.google.com/domaingate-hbplus',
      aud: 'domaingate-hbplus',
      email: 'satya@hbplus.fit',
      email_verified: true,
      exp: now + 3600,
    };
    const mockToken = `header.${base64UrlEncode(JSON.stringify(mockPayload))}.signature`;
    const parsed = decodeJwtClaims(mockToken);
    if (!parsed || parsed.email !== 'satya@hbplus.fit') {
      throw new Error('Failed to parse simulated JWT token');
    }
    if (isTokenExpired(parsed)) {
      throw new Error('Valid token reported as expired');
    }
  });

  // Execute suite
  let passedCount = 0;
  for (const test of tests) {
    try {
      test.fn();
      passedCount++;
      results.push({ name: test.name, passed: true });
    } catch (err: any) {
      results.push({ name: test.name, passed: false, details: err.message });
    }
  }

  return {
    total: tests.length,
    passed: passedCount,
    failed: tests.length - passedCount,
    results,
  };
}
