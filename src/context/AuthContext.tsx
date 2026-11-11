import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { 
  AuthService, 
  AuthenticatedUser, 
  AuthSecurityResult 
} from '../services/authService';
import { TokenStorage, decodeJwtClaims } from '../services/tokenService';
import { validateDomain } from '../config/securityConfig';

export type AuthState = 
  | 'IDLE'
  | 'AUTHENTICATING'
  | 'VERIFYING_DOMAIN'
  | 'AUTHORIZED'
  | 'ACCESS_DENIED'
  | 'ERROR';

export interface SecurityIncident {
  incidentId: string;
  attemptedEmail: string;
  attemptedDomain: string;
  errorCode: string;
  errorMessage: string;
  timestamp: string;
}

interface AuthContextType {
  state: AuthState;
  user: AuthenticatedUser | null;
  incident: SecurityIncident | null;
  errorMessage: string | null;
  signInWithGoogle: () => Promise<void>;
  simulateSignIn: (email: string, displayName?: string, isVerified?: boolean) => Promise<void>;
  signOut: () => Promise<void>;
  clearIncident: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>('IDLE');
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [incident, setIncident] = useState<SecurityIncident | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check existing session token on startup
  useEffect(() => {
    async function restoreSession() {
      try {
        const token = await TokenStorage.getToken();
        if (token) {
          const claims = decodeJwtClaims(token);
          if (claims && claims.email) {
            const check = validateDomain(claims.email);
            if (check.isValid && claims.email_verified) {
              setUser({
                uid: claims.sub || 'restored_user',
                email: claims.email,
                displayName: claims.name || claims.email.split('@')[0],
                photoURL: claims.picture,
                emailVerified: Boolean(claims.email_verified),
                domain: check.domain,
                hostedDomainClaim: claims.hd,
                idToken: token,
                claims,
                authMethod: 'ENTERPRISE_TEST_RIG',
                authenticatedAt: new Date().toISOString(),
              });
              setState('AUTHORIZED');
              return;
            }
          }
          // If token was invalid or domain mismatch, wipe it
          await TokenStorage.clearToken();
        }
      } catch (err) {
        console.warn('Failed to restore session:', err);
      } finally {
        setState((current) => (current === 'AUTHORIZED' ? 'AUTHORIZED' : 'IDLE'));
      }
    }
    restoreSession();
  }, []);

  const handleSecurityResult = (result: AuthSecurityResult) => {
    if (result.success && result.user) {
      setUser(result.user);
      setIncident(null);
      setErrorMessage(null);
      setState('AUTHORIZED');
    } else {
      setUser(null);
      if (result.incidentId && result.attemptedEmail) {
        setIncident({
          incidentId: result.incidentId,
          attemptedEmail: result.attemptedEmail,
          attemptedDomain: result.attemptedDomain || result.attemptedEmail.split('@')[1] || '',
          errorCode: result.errorCode || 'ERR_UNAUTHORIZED',
          errorMessage: result.errorMessage || 'Access denied by security policy.',
          timestamp: new Date().toISOString(),
        });
        setState('ACCESS_DENIED');
      } else {
        setErrorMessage(result.errorMessage || 'Authentication failed.');
        setState('ERROR');
      }
    }
  };

  const signInWithGoogle = async () => {
    setState('AUTHENTICATING');
    setErrorMessage(null);
    try {
      setState('VERIFYING_DOMAIN');
      const result = await AuthService.signInWithGoogleLive();
      handleSecurityResult(result);
    } catch (err: any) {
      setState('ERROR');
      setErrorMessage(err.message || 'Unexpected authentication failure.');
    }
  };

  const simulateSignIn = async (email: string, displayName = 'Simulated User', isVerified = true) => {
    setState('AUTHENTICATING');
    setErrorMessage(null);
    // Give brief delay to show security verification state
    setTimeout(async () => {
      try {
        setState('VERIFYING_DOMAIN');
        const result = await AuthService.simulateDomainSignIn(email, displayName, isVerified);
        handleSecurityResult(result);
      } catch (err: any) {
        setState('ERROR');
        setErrorMessage(err.message || 'Simulation error.');
      }
    }, 400);
  };

  const signOut = async () => {
    setState('AUTHENTICATING');
    await AuthService.signOut();
    setUser(null);
    setIncident(null);
    setErrorMessage(null);
    setState('IDLE');
  };

  const clearIncident = () => {
    setIncident(null);
    setErrorMessage(null);
    setState('IDLE');
  };

  const value = useMemo(
    () => ({
      state,
      user,
      incident,
      errorMessage,
      signInWithGoogle,
      simulateSignIn,
      signOut,
      clearIncident,
    }),
    [state, user, incident, errorMessage]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

