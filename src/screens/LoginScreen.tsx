import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  SafeAreaView, 
  Platform,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { DomainBadge } from '../components/DomainBadge';
import { GoogleButton } from '../components/GoogleButton';
import { SecurityNotice } from '../components/SecurityNotice';
import { SecurityTestRig } from '../components/SecurityTestRig';
import { SECURITY_CONFIG } from '../config/securityConfig';

export const LoginScreen: React.FC = () => {
  const { signInWithGoogle, state, errorMessage } = useAuth();

  const isAuthenticating = state === 'AUTHENTICATING';
  const isVerifying = state === 'VERIFYING_DOMAIN';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          {/* Top Brand Header */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Ionicons name="shield-half" size={36} color="#38BDF8" />
            </View>
            <Text style={styles.appTitle}>DomainGate</Text>
            <Text style={styles.appSubtitle}>Enterprise OAuth & Zero-Trust Domain Firewall</Text>
            
            <View style={styles.badgeWrapper}>
              <DomainBadge status="neutral" customText={`AUTHORIZED DOMAIN: @${SECURITY_CONFIG.ALLOWED_DOMAIN}`} />
            </View>
          </View>

          {/* Verification Banner if loading */}
          {isVerifying && (
            <View style={styles.verifyingBanner}>
              <ActivityIndicator size="small" color="#38BDF8" style={{ marginRight: 10 }} />
              <View>
                <Text style={styles.verifyingTitle}>Verifying Domain & Cryptographic Claims...</Text>
                <Text style={styles.verifyingSubtitle}>Inspecting RS256 token payload against @{SECURITY_CONFIG.ALLOWED_DOMAIN}</Text>
              </View>
            </View>
          )}

          {/* Error Message if present */}
          {errorMessage && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color="#EF4444" style={{ marginRight: 8 }} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {/* Authentication Actions */}
          <View style={styles.authSection}>
            <Text style={styles.sectionHeader}>Single Sign-On</Text>
            <GoogleButton 
              onPress={signInWithGoogle}
              isLoading={isAuthenticating}
              label="Sign in with Google"
              subLabel="Google Workspace & OAuth 2.0"
            />
            <Text style={styles.disclaimerText}>
              By signing in, Google identity claims and hosted domain will be evaluated against corporate authorization rules.
            </Text>
          </View>

          {/* Test Rig & Requirement Validation */}
          <SecurityTestRig />

          {/* Defense-in-Depth Architectural Overview */}
          <SecurityNotice />

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.securitySeal}>
              <Ionicons name="lock-closed" size={12} color="#64748B" />
              <Text style={styles.footerText}>
                DomainGate Multi-Layer Security Architecture • Cross-Platform (Android/iOS/Web)
              </Text>
            </View>
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
    maxWidth: 520,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0F172A',
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
    textAlign: 'center',
  },
  badgeWrapper: {
    marginTop: 14,
  },
  verifyingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#38BDF8',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  verifyingTitle: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '600',
  },
  verifyingSubtitle: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 1,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 12,
    flex: 1,
  },
  authSection: {
    backgroundColor: '#0F172A',
    borderColor: '#1E293B',
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    marginBottom: 10,
  },
  sectionHeader: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  disclaimerText: {
    color: '#64748B',
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 12,
  },
  footer: {
    marginTop: 20,
    alignItems: 'center',
  },
  securitySeal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    color: '#64748B',
    fontSize: 11,
    textAlign: 'center',
  },
});

