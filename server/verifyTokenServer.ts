/**
 * DomainGate - Enterprise Backend Token Verification Service
 * 
 * Demonstrates robust server-side token validation:
 * 1. Extracts Bearer token from HTTP Authorization header.
 * 2. Cryptographically verifies RS256 signature against Google / Firebase public keys.
 * 3. Enforces that email is verified and domain matches @hbplus.fit.
 * 4. Protects internal REST / GraphQL / RPC endpoints.
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import * as admin from 'firebase-admin';

const app = express();
app.use(cors());
app.use(express.json());

const ALLOWED_DOMAIN = 'hbplus.fit';

// Initialize Firebase Admin (in production, use GOOGLE_APPLICATION_CREDENTIALS)
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || 'domaingate-hbplus',
  });
}

export interface AuthenticatedRequest extends Request {
  user?: admin.auth.DecodedIdToken;
}

/**
 * Enterprise Security Middleware
 * Performs zero-trust domain & cryptographic token inspection.
 */
export async function requireHBPlusDomainAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'UNAUTHORIZED',
      code: 'ERR_MISSING_BEARER_TOKEN',
      message: 'Authorization header with Bearer token is required.',
    });
    return;
  }

  const idToken = authHeader.split('Bearer ')[1].trim();

  try {
    // 1. Verify token signature with Firebase Admin / Google Identity Service
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    // 2. Security Check: Email must be verified
    if (!decodedToken.email_verified) {
      res.status(403).json({
        error: 'FORBIDDEN',
        code: 'ERR_UNVERIFIED_EMAIL',
        message: 'Security policy requires a verified Google email address.',
      });
      return;
    }

    // 3. Security Check: Strict Domain Enforcement
    const email = decodedToken.email?.toLowerCase().trim();
    if (!email || !email.endsWith(`@${ALLOWED_DOMAIN}`)) {
      console.warn(`[Security Incident] Blocked API access attempt from: ${email}`);
      res.status(403).json({
        error: 'FORBIDDEN',
        code: 'ERR_UNAUTHORIZED_DOMAIN',
        message: `Access denied. Email '${email}' does not belong to authorized domain '@${ALLOWED_DOMAIN}'.`,
        incidentId: `SEC-API-${Date.now().toString(36).toUpperCase()}`,
      });
      return;
    }

    // 4. Attach verified user claims to request
    req.user = decodedToken;
    next();
  } catch (error: any) {
    console.error('[TokenVerificationError]', error);
    res.status(401).json({
      error: 'INVALID_TOKEN',
      code: 'ERR_TOKEN_VERIFICATION_FAILED',
      message: 'Failed to verify cryptographic token signature or token expired.',
    });
  }
}

// Protected Corporate Route Example
app.get('/api/corporate/workspace', requireHBPlusDomainAuth, (req: AuthenticatedRequest, res: Response) => {
  res.json({
    status: 'SUCCESS',
    authorizedUser: req.user?.email,
    workspace: {
      id: 'ws_hbplus_enterprise_01',
      name: 'HBPlus Global Health & Fitness Workspace',
      domain: ALLOWED_DOMAIN,
      resources: [
        { id: 'res_1', title: 'Internal Health Metrics API', clearance: 'HBPLUS_VERIFIED' },
        { id: 'res_2', title: 'Corporate Member Directory', clearance: 'HBPLUS_VERIFIED' },
        { id: 'res_3', title: 'Executive Fitness Analytics', clearance: 'HBPLUS_VERIFIED' },
      ],
      serverTimestamp: new Date().toISOString(),
    },
  });
});

const PORT = process.env.PORT || 4001;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[DomainGate Security Service] Running on port ${PORT}`);
    console.log(`[DomainGate Security Service] Enforcing domain: @${ALLOWED_DOMAIN}`);
  });
}

