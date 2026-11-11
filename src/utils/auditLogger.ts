import AsyncStorage from '@react-native-async-storage/async-storage';
import { SECURITY_CONFIG, generateIncidentId } from '../config/securityConfig';

export interface AuditEvent {
  id: string;
  timestamp: string;
  eventType: 'AUTH_SUCCESS' | 'AUTH_DENIED_UNAUTHORIZED_DOMAIN' | 'AUTH_DENIED_UNVERIFIED' | 'AUTH_LOGOUT' | 'SECURITY_VIOLATION_TRIGGER';
  email: string;
  domain: string;
  isVerified: boolean;
  platform: string;
  userAgent?: string;
  reason?: string;
  ipPlaceholder?: string;
}

export async function logAuditEvent(
  eventType: AuditEvent['eventType'],
  details: {
    email: string;
    domain: string;
    isVerified: boolean;
    reason?: string;
    platform?: string;
  }
): Promise<AuditEvent> {
  const event: AuditEvent = {
    id: generateIncidentId(),
    timestamp: new Date().toISOString(),
    eventType,
    email: details.email,
    domain: details.domain,
    isVerified: details.isVerified,
    platform: details.platform || 'universal',
    reason: details.reason,
  };

  try {
    const existingRaw = await AsyncStorage.getItem(SECURITY_CONFIG.STORAGE_KEYS.AUDIT_LOG);
    const logs: AuditEvent[] = existingRaw ? JSON.parse(existingRaw) : [];
    // Keep most recent 50 events
    logs.unshift(event);
    if (logs.length > 50) logs.pop();
    await AsyncStorage.setItem(SECURITY_CONFIG.STORAGE_KEYS.AUDIT_LOG, JSON.stringify(logs));
  } catch (err) {
    console.error('[AuditLogger] Failed to write audit event:', err);
  }

  return event;
}

export async function getAuditLogs(): Promise<AuditEvent[]> {
  try {
    const existingRaw = await AsyncStorage.getItem(SECURITY_CONFIG.STORAGE_KEYS.AUDIT_LOG);
    return existingRaw ? JSON.parse(existingRaw) : [];
  } catch {
    return [];
  }
}

