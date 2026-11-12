import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SECURITY_CONFIG } from '../config/securityConfig';
import { base64UrlDecode } from '../utils/base64';

export interface DecodedTokenClaims {
  iss?: string;
  sub?: string;
  aud?: string;
  exp?: number;
  iat?: number;
  email?: string;
  email_verified?: boolean;
  hd?: string; // Hosted Domain (Google OAuth)
  name?: string;
  picture?: string;
  auth_time?: number;
  [key: string]: any;
}

/**
 * Parses and decodes a JWT token without requiring external unsafe dependencies.
 */
export function decodeJwtClaims(token: string): DecodedTokenClaims | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const jsonString = base64UrlDecode(parts[1]);
    return JSON.parse(jsonString);
  } catch (err) {
    console.warn('[TokenService] Failed to decode JWT:', err);
    return null;
  }
}

/**
 * Checks whether token is expired based on claims `exp` field
 */
export function isTokenExpired(claims: DecodedTokenClaims): boolean {
  if (!claims.exp) return false;
  const now = Math.floor(Date.now() / 1000);
  return claims.exp < now;
}

/**
 * Platform-safe secure storage for cryptographic auth tokens.
 * Uses Keychain/Keystore via expo-secure-store on Native, AsyncStorage on Web.
 */
export const TokenStorage = {
  async saveToken(token: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        await AsyncStorage.setItem(SECURITY_CONFIG.STORAGE_KEYS.AUTH_TOKEN, token);
      } else {
        await SecureStore.setItemAsync(SECURITY_CONFIG.STORAGE_KEYS.AUTH_TOKEN, token, {
          keychainAccessible: SecureStore.WHEN_UNLOCKED,
        });
      }
    } catch (err) {
      console.error('[TokenStorage] Error saving token:', err);
    }
  },

  async getToken(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return await AsyncStorage.getItem(SECURITY_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
      } else {
        return await SecureStore.getItemAsync(SECURITY_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
      }
    } catch (err) {
      console.error('[TokenStorage] Error getting token:', err);
      return null;
    }
  },

  async clearToken(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        await AsyncStorage.multiRemove([
          SECURITY_CONFIG.STORAGE_KEYS.AUTH_TOKEN,
          SECURITY_CONFIG.STORAGE_KEYS.USER_PROFILE,
        ]);
        if (typeof window !== 'undefined') {
          try {
            window.sessionStorage?.clear();
            window.localStorage?.removeItem(SECURITY_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
            window.localStorage?.removeItem(SECURITY_CONFIG.STORAGE_KEYS.USER_PROFILE);
          } catch {}
        }
      } else {
        await SecureStore.deleteItemAsync(SECURITY_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
        await SecureStore.deleteItemAsync(SECURITY_CONFIG.STORAGE_KEYS.USER_PROFILE);
      }
    } catch (err) {
      console.error('[TokenStorage] Error clearing token:', err);
    }
  },
};
