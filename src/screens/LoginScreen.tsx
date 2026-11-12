import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  SafeAreaView, 
  Platform,
  ActivityIndicator,
  TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { DomainBadge } from '../components/DomainBadge';
import { GoogleButton } from '../components/GoogleButton';
import { SecurityTestRig } from '../components/SecurityTestRig';
import { SECURITY_CONFIG } from '../config/securityConfig';
import { useGoogleAuth } from '../hooks/useGoogleAuth';

export const LoginScreen: React.FC = () => {
  const { state, errorMessage } = useAuth();
  const { startGoogleSignIn } = useGoogleAuth();
  const [showTestScenarios, setShowTestScenarios] = useState(false);

  const isAuthenticating = state === 'AUTHENTICATING';
  const isVerifying = state === 'VERIFYING_DOMAIN';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.cardContainer}>
          {/* Main Elevated Card */}
          <View style={styles.card}>
            {/* Top Brand Logo */}
            <View style={styles.logoRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="shield-checkmark" size={32} color="#3B82F6" />
              </View>
              <View style={styles.brandTitleCol}>
                <Text style={styles.brandName}>DomainGate</Text>
                <Text style={styles.brandTag}>Zero-Trust Identity Portal</Text>
              </View>
            </View>

            {/* Headings */}
            <View style={styles.headingSection}>
              <Text style={styles.welcomeHeading}>Welcome to DomainGate</Text>
              <Text style={styles.subtitleText}>
                Secure access for authorized organization members.
              </Text>
            </View>

            {/* Authorized Domain Indicator */}
            <View style={styles.domainPillWrapper}>
              <DomainBadge 
                status="neutral" 
                customText={`Authorized Domain: @${SECURITY_CONFIG.ALLOWED_DOMAIN}`} 
              />
            </View>

            {/* Verification State Banner */}
            {isVerifying && (
              <View style={styles.verifyingBanner}>
                <ActivityIndicator size="small" color="#3B82F6" style={{ marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.verifyingTitle}>Verifying Domain Credentials...</Text>
                  <Text style={styles.verifyingSubtitle}>
                    Inspecting Google OAuth token claims for @{SECURITY_CONFIG.ALLOWED_DOMAIN}
                  </Text>
                </View>
              </View>
            )}

            {/* Error Message Banner */}
            {errorMessage && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={20} color="#EF4444" style={{ marginRight: 10 }} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            {/* Authentication Action Section */}
            <View style={styles.authSection}>
              <GoogleButton 
                onPress={startGoogleSignIn}
                isLoading={isAuthenticating}
                label="Sign in with Google"
                subLabel={`Use your @${SECURITY_CONFIG.ALLOWED_DOMAIN} account`}
              />
              <Text style={styles.ssoNote}>
                By signing in, your Google verified identity and email domain will be authorized against corporate security policy.
              </Text>
            </View>

            {/* Clean Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ENTERPRISE VERIFICATION</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Collapsible Test Scenarios Toggle (Clean & Uncluttered) */}
            <TouchableOpacity 
              style={styles.scenarioToggleBtn}
              onPress={() => setShowTestScenarios(!showTestScenarios)}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={showTestScenarios ? "chevron-up-circle-outline" : "options-outline"} 
                size={16} 
                color="#60A5FA" 
              />
              <Text style={styles.scenarioToggleText}>
                {showTestScenarios ? 'Hide Test Scenarios & Simulators' : 'Quick Test Scenarios (satya@hbplus.fit, gmail, etc.)'}
              </Text>
            </TouchableOpacity>

            {showTestScenarios && (
              <View style={styles.testRigContainer}>
                <SecurityTestRig />
              </View>
            )}
          </View>

          {/* Minimal Clean Footer */}
          <View style={styles.footer}>
            <Ionicons name="lock-closed-outline" size={13} color="#64748B" style={{ marginRight: 6 }} />
            <Text style={styles.footerText}>
              DomainGate Enterprise Authentication • Google OAuth 2.0 • Zero-Trust
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
    backgroundColor: '#080D1A', // Deep Navy Canvas
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 16,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 480,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: '#0F172A', // Slate / Navy Card
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1E293B',
    paddingHorizontal: 28,
    paddingVertical: 32,
    ...Platform.select({
      web: {
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.4)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.35,
        shadowRadius: 18,
        elevation: 8,
      },
    }),
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#1E293B',
    borderWidth: 1.5,
    borderColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  brandTitleCol: {
    justifyContent: 'center',
  },
  brandName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  brandTag: {
    fontSize: 11,
    color: '#60A5FA',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  headingSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  welcomeHeading: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  subtitleText: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 8,
  },
  domainPillWrapper: {
    alignItems: 'center',
    marginBottom: 22,
  },
  verifyingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    borderWidth: 1,
    borderColor: '#2563EB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  verifyingTitle: {
    color: '#60A5FA',
    fontSize: 13,
    fontWeight: '600',
  },
  verifyingSubtitle: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
    fontWeight: '500',
  },
  authSection: {
    marginBottom: 16,
  },
  ssoNote: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 14,
    paddingHorizontal: 10,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#1E293B',
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
    letterSpacing: 1,
    paddingHorizontal: 10,
  },
  scenarioToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 12,
    gap: 8,
  },
  scenarioToggleText: {
    color: '#93C5FD',
    fontSize: 12,
    fontWeight: '600',
  },
  testRigContainer: {
    marginTop: 14,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingHorizontal: 16,
  },
  footerText: {
    color: '#64748B',
    fontSize: 11,
    textAlign: 'center',
  },
});
