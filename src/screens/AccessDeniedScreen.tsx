import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView,
  Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { SECURITY_CONFIG } from '../config/securityConfig';

export const AccessDeniedScreen: React.FC = () => {
  const { incident, clearIncident, simulateSignIn } = useAuth();
  const [copied, setCopied] = useState(false);

  const handleCopyIncident = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          {/* Crimson Security Alert Header */}
          <View style={styles.iconCircle}>
            <Ionicons name="shield-outline" size={44} color="#EF4444" />
            <View style={styles.crossPill}>
              <Ionicons name="close" size={14} color="#FFFFFF" />
            </View>
          </View>

          <Text style={styles.title}>Access Denied</Text>
          <Text style={styles.subtitle}>Domain Authorization Firewall Triggered</Text>

          {/* Account Breakdown Card */}
          <View style={styles.detailsCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="finger-print-outline" size={16} color="#F87171" style={{ marginRight: 6 }} />
              <Text style={styles.cardTitle}>Identity & Incident Inspection</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.label}>Attempted Email:</Text>
              <Text style={[styles.value, styles.deniedEmail]}>
                {incident?.attemptedEmail || 'Unknown'}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.label}>Detected Domain:</Text>
              <Text style={[styles.value, styles.deniedDomain]}>
                @{incident?.attemptedDomain || 'unauthorized'}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.label}>Authorized Domain:</Text>
              <Text style={[styles.value, styles.allowedDomain]}>
                @{SECURITY_CONFIG.ALLOWED_DOMAIN}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.label}>Security Rule:</Text>
              <Text style={styles.value}>
                {incident?.errorCode || SECURITY_CONFIG.ERROR_CODES.UNAUTHORIZED_DOMAIN}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.label}>Incident Reference:</Text>
              <TouchableOpacity onPress={handleCopyIncident} style={styles.incidentRow}>
                <Text style={styles.incidentCode}>{incident?.incidentId || 'SEC-INC-LOCAL'}</Text>
                <Ionicons 
                  name={copied ? 'checkmark' : 'copy-outline'} 
                  size={12} 
                  color={copied ? '#10B981' : '#94A3B8'} 
                  style={{ marginLeft: 4 }} 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Security Policy Explanation */}
          <View style={styles.explanationBox}>
            <Ionicons name="information-circle-outline" size={18} color="#FBBF24" style={styles.infoIcon} />
            <View style={{ flex: 1 }}>
              <Text style={styles.explanationTitle}>Why was access denied?</Text>
              <Text style={styles.explanationText}>
                DomainGate strictly enforces that only Google OAuth accounts whose verified email matches{' '}
                <Text style={styles.boldText}>@{SECURITY_CONFIG.ALLOWED_DOMAIN}</Text> can access the system.
                Tokens for consumer accounts (Gmail, Yahoo) or non-corporate domains are rejected at the gate.
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonGroup}>
            <TouchableOpacity 
              style={styles.retryAllowedBtn}
              onPress={() => simulateSignIn('satya@hbplus.fit', 'Satya Nadella')}
              activeOpacity={0.8}
            >
              <Ionicons name="key" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.retryAllowedText}>Test Authorized Account (satya@hbplus.fit)</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.backButton}
              onPress={clearIncident}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back" size={16} color="#94A3B8" style={{ marginRight: 8 }} />
              <Text style={styles.backButtonText}>Return to Authentication Gate</Text>
            </TouchableOpacity>
          </View>

          {/* Atomic Teardown Notice */}
          <View style={styles.quarantineFooter}>
            <Ionicons name="lock-closed" size={12} color="#EF4444" />
            <Text style={styles.quarantineText}>
              Emergency session purge executed: No tokens or session cookies retained.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#030712',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  container: {
    width: '100%',
    maxWidth: 500,
    alignItems: 'center',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 2,
    borderColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    position: 'relative',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 8,
  },
  crossPill: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#030712',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#EF4444',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
    marginBottom: 20,
    textAlign: 'center',
  },
  detailsCard: {
    width: '100%',
    backgroundColor: '#0F172A',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    paddingBottom: 8,
  },
  cardTitle: {
    color: '#F87171',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  label: {
    color: '#94A3B8',
    fontSize: 12,
  },
  value: {
    color: '#F1F5F9',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  deniedEmail: {
    color: '#EF4444',
  },
  deniedDomain: {
    color: '#F87171',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  allowedDomain: {
    color: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  incidentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  incidentCode: {
    color: '#38BDF8',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  explanationBox: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  infoIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  explanationTitle: {
    color: '#FCD34D',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  explanationText: {
    color: '#CBD5E1',
    fontSize: 12,
    lineHeight: 18,
  },
  boldText: {
    color: '#34D399',
    fontWeight: '700',
  },
  buttonGroup: {
    width: '100%',
    gap: 10,
  },
  retryAllowedBtn: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  retryAllowedText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  backButton: {
    backgroundColor: '#1E293B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  backButtonText: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '600',
  },
  quarantineFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    gap: 6,
  },
  quarantineText: {
    color: '#64748B',
    fontSize: 11,
    textAlign: 'center',
  },
});

