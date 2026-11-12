import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView, 
  Image, 
  Platform, 
  useWindowDimensions,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { DomainBadge } from '../components/DomainBadge';
import { ClaimsInspector } from '../components/ClaimsInspector';
import { SECURITY_CONFIG } from '../config/securityConfig';

export const DashboardScreen: React.FC = () => {
  const { user, signOut, isLoading } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;

  const [showTokenClaims, setShowTokenClaims] = useState(false);

  const isAdmin = user?.role === 'ADMIN';
  const userInitials = user?.displayName
    ? user.displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'U';

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.layoutRoot, isDesktop && styles.desktopLayout]}>
        
        {/* ================= DESKTOP SIDEBAR ================= */}
        {isDesktop && (
          <View style={styles.sidebar}>
            {/* Sidebar Brand Header */}
            <View style={styles.sidebarHeader}>
              <View style={styles.brandIconBox}>
                <Ionicons name="shield-checkmark" size={22} color="#3B82F6" />
              </View>
              <View style={styles.brandCol}>
                <Text style={styles.brandTitle}>DomainGate</Text>
                <Text style={styles.brandSubtitle}>Corporate Portal</Text>
              </View>
            </View>

            {/* Sidebar Org Info */}
            <View style={styles.sidebarOrgBadge}>
              <Text style={styles.sidebarOrgLabel}>ORGANIZATION</Text>
              <Text style={styles.sidebarOrgName} numberOfLines={2}>
                {user?.organization || 'HBPlus Health & Fitness Global Inc.'}
              </Text>
              <View style={styles.sidebarDomainRow}>
                <View style={styles.activeDot} />
                <Text style={styles.sidebarDomainText}>@{SECURITY_CONFIG.ALLOWED_DOMAIN}</Text>
              </View>
            </View>

            {/* Sidebar Navigation Items */}
            <View style={styles.sidebarNav}>
              <View style={[styles.navItem, styles.navItemActive]}>
                <Ionicons name="grid-outline" size={18} color="#3B82F6" />
                <Text style={[styles.navItemLabel, styles.navItemLabelActive]}>Workspace Overview</Text>
              </View>

              <TouchableOpacity 
                style={styles.navItem}
                onPress={() => setShowTokenClaims(!showTokenClaims)}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name={showTokenClaims ? "key" : "key-outline"} 
                  size={18} 
                  color="#94A3B8" 
                />
                <Text style={styles.navItemLabel}>
                  {showTokenClaims ? 'Hide Token Claims' : 'Inspect JWT Claims'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Sidebar Bottom Profile & Logout */}
            <View style={styles.sidebarFooter}>
              <View style={styles.sidebarUserRow}>
                {user?.photoURL ? (
                  <Image source={{ uri: user.photoURL }} style={styles.sidebarAvatar} />
                ) : (
                  <View style={styles.avatarFallbackSmall}>
                    <Text style={styles.avatarFallbackTextSmall}>{userInitials}</Text>
                  </View>
                )}
                <View style={styles.sidebarUserMeta}>
                  <Text style={styles.sidebarUserName} numberOfLines={1}>
                    {user?.displayName || 'Authorized User'}
                  </Text>
                  <Text style={styles.sidebarUserEmail} numberOfLines={1}>
                    {user?.email}
                  </Text>
                </View>
              </View>

              {/* Logout Action */}
              <TouchableOpacity 
                style={styles.logoutButton}
                onPress={signOut}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#F87171" style={{ marginRight: 8 }} />
                ) : (
                  <Ionicons name="log-out-outline" size={18} color="#F87171" style={{ marginRight: 8 }} />
                )}
                <Text style={styles.logoutButtonText}>
                  {isLoading ? 'Signing out...' : 'Logout'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ================= MAIN CONTENT VIEWPORT ================= */}
        <View style={styles.mainViewport}>
          
          {/* Top Header (Visible on Mobile & Desktop) */}
          <View style={styles.topHeader}>
            <View style={styles.topHeaderLeft}>
              {!isDesktop && (
                <View style={styles.mobileBrandRow}>
                  <View style={styles.mobileBrandIcon}>
                    <Ionicons name="shield-checkmark" size={18} color="#3B82F6" />
                  </View>
                  <Text style={styles.mobileBrandTitle}>DomainGate</Text>
                </View>
              )}
              {isDesktop && (
                <Text style={styles.topHeaderDate}>{currentDate}</Text>
              )}
            </View>

            <View style={styles.topHeaderRight}>
              <View style={styles.statusPill}>
                <View style={styles.greenPulseDot} />
                <Text style={styles.statusPillText}>Session Active</Text>
              </View>

              {!isDesktop && (
                <TouchableOpacity 
                  style={styles.mobileLogoutBtn}
                  onPress={signOut}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#F87171" />
                  ) : (
                    <Ionicons name="log-out-outline" size={18} color="#F87171" />
                  )}
                  <Text style={styles.mobileLogoutBtnText}>
                    {isLoading ? '...' : 'Logout'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Scrollable Dashboard Body */}
          <ScrollView 
            contentContainerStyle={styles.scrollBody}
            showsVerticalScrollIndicator={false}
          >
            {/* 1. WELCOME SECTION */}
            <View style={styles.welcomeSection}>
              <View style={styles.welcomeTextCluster}>
                <Text style={styles.welcomeGreeting}>
                  Welcome, {user?.displayName || 'Team Member'}
                </Text>
                <Text style={styles.welcomeSubtitle}>
                  Authorized internal corporate workspace for {user?.organization || 'HBPlus Health & Fitness Global Inc.'}
                </Text>
              </View>

              <View style={styles.welcomeBadges}>
                <DomainBadge 
                  status="authorized" 
                  customText={`@${SECURITY_CONFIG.ALLOWED_DOMAIN} VERIFIED`} 
                />
              </View>
            </View>

            {/* 2. MODERN DASHBOARD CARDS GRID */}
            <View style={[styles.cardsGrid, isDesktop && styles.desktopGrid]}>
              
              {/* CARD 1: PROFILE CARD */}
              <View style={[styles.card, isDesktop && styles.gridCard]}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderTitleRow}>
                    <Ionicons name="person-circle-outline" size={20} color="#3B82F6" />
                    <Text style={styles.cardHeaderTitle}>Profile Card</Text>
                  </View>
                  <View style={styles.verifiedTag}>
                    <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                    <Text style={styles.verifiedTagText}>Verified</Text>
                  </View>
                </View>

                <View style={styles.profileBody}>
                  {user?.photoURL ? (
                    <Image source={{ uri: user.photoURL }} style={styles.profilePhoto} />
                  ) : (
                    <View style={styles.avatarFallbackLarge}>
                      <Text style={styles.avatarFallbackTextLarge}>{userInitials}</Text>
                    </View>
                  )}

                  <View style={styles.profileDetails}>
                    <Text style={styles.profileFullName}>{user?.displayName || 'Authorized User'}</Text>
                    <Text style={styles.profileEmail}>{user?.email}</Text>

                    <View style={styles.profileMetaRow}>
                      <View style={styles.authBadgePill}>
                        <Ionicons name="logo-google" size={12} color="#EA4335" style={{ marginRight: 5 }} />
                        <Text style={styles.authBadgePillText}>Google OAuth 2.0</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>

              {/* CARD 2: ROLE INDICATOR CARD */}
              <View style={[styles.card, isDesktop && styles.gridCard]}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderTitleRow}>
                    <Ionicons name="shield-outline" size={20} color="#3B82F6" />
                    <Text style={styles.cardHeaderTitle}>Role & Access Indicator</Text>
                  </View>
                </View>

                <View style={styles.roleCardBody}>
                  <View style={styles.roleBadgeWrapper}>
                    <View style={[styles.roleBadge, isAdmin ? styles.roleBadgeAdmin : styles.roleBadgeUser]}>
                      <Ionicons 
                        name={isAdmin ? "key" : "person"} 
                        size={16} 
                        color={isAdmin ? "#A78BFA" : "#60A5FA"} 
                        style={{ marginRight: 6 }} 
                      />
                      <Text style={[styles.roleBadgeText, isAdmin ? styles.roleTextAdmin : styles.roleTextUser]}>
                        ROLE: {user?.role || 'USER'}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.roleDescription}>
                    {isAdmin
                      ? 'Executive Administrative Clearance: Authorized to review security audit logs, manage organization directory, and supervise domain firewall policies.'
                      : 'Standard Organization Member: Access granted to internal company resources, directory, and workspace data.'}
                  </Text>

                  <View style={styles.roleInfoRow}>
                    <Text style={styles.roleInfoLabel}>Escalation Guard:</Text>
                    <Text style={styles.roleInfoValue}>Firestore Rules Immutability Enforced</Text>
                  </View>
                </View>
              </View>

              {/* CARD 3: ACCOUNT INFORMATION CARD */}
              <View style={[styles.card, isDesktop && styles.gridCard]}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderTitleRow}>
                    <Ionicons name="finger-print-outline" size={20} color="#3B82F6" />
                    <Text style={styles.cardHeaderTitle}>Account Information</Text>
                  </View>
                </View>

                <View style={styles.infoList}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>User ID (UID)</Text>
                    <Text style={styles.infoValueMono} numberOfLines={1}>
                      {user?.uid || 'Not available'}
                    </Text>
                  </View>

                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Identity Provider</Text>
                    <Text style={styles.infoValue}>Google Firebase Authentication</Text>
                  </View>

                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Email Verification Status</Text>
                    <View style={styles.verifiedInlineRow}>
                      <Ionicons name="checkmark-circle" size={14} color="#10B981" style={{ marginRight: 4 }} />
                      <Text style={styles.verifiedInlineText}>Verified by Google Identity</Text>
                    </View>
                  </View>

                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Hosted Domain Claim (hd)</Text>
                    <Text style={styles.infoValueMono}>
                      {user?.hostedDomainClaim || SECURITY_CONFIG.ALLOWED_DOMAIN}
                    </Text>
                  </View>
                </View>
              </View>

              {/* CARD 4: ORGANIZATION INFORMATION CARD */}
              <View style={[styles.card, isDesktop && styles.gridCard]}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderTitleRow}>
                    <Ionicons name="business-outline" size={20} color="#3B82F6" />
                    <Text style={styles.cardHeaderTitle}>Organization Information</Text>
                  </View>
                </View>

                <View style={styles.infoList}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Organization Name</Text>
                    <Text style={styles.infoValueBold}>
                      {user?.organization || 'HBPlus Health & Fitness Global Inc.'}
                    </Text>
                  </View>

                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Authorized Domain</Text>
                    <Text style={styles.infoValueHighlight}>@{SECURITY_CONFIG.ALLOWED_DOMAIN}</Text>
                  </View>

                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Security Policy</Text>
                    <Text style={styles.infoValue}>Zero-Trust Domain Firewall (Strict)</Text>
                  </View>

                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Data Access Protocol</Text>
                    <Text style={styles.infoValue}>Cloud Firestore Rules Layer 4</Text>
                  </View>
                </View>
              </View>

            </View>

            {/* Optional Collapsible JWT Inspector */}
            {showTokenClaims && user?.claims && (
              <View style={styles.claimsWrapper}>
                <View style={styles.claimsHeader}>
                  <Ionicons name="key" size={18} color="#60A5FA" style={{ marginRight: 8 }} />
                  <Text style={styles.claimsTitle}>Cryptographic Token & Decoded RS256 Claims</Text>
                </View>
                <ClaimsInspector 
                  claims={user.claims} 
                  idToken={user?.idToken} 
                />
              </View>
            )}

            {/* Mobile Bottom Logout Button */}
            {!isDesktop && (
              <View style={styles.mobileBottomLogoutWrapper}>
                <TouchableOpacity 
                  style={styles.mobileFullLogoutBtn}
                  onPress={signOut}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#F87171" style={{ marginRight: 8 }} />
                  ) : (
                    <Ionicons name="log-out-outline" size={20} color="#F87171" style={{ marginRight: 8 }} />
                  )}
                  <Text style={styles.mobileFullLogoutText}>
                    {isLoading ? 'Signing Out...' : 'Log Out of DomainGate'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

          </ScrollView>
        </View>

      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#080D1A', // Deep Navy background
  },
  layoutRoot: {
    flex: 1,
  },
  desktopLayout: {
    flexDirection: 'row',
  },

  /* ================= DESKTOP SIDEBAR ================= */
  sidebar: {
    width: 270,
    backgroundColor: '#0B132B',
    borderRightWidth: 1,
    borderRightColor: '#1E293B',
    paddingVertical: 24,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  brandIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  brandCol: {
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  brandSubtitle: {
    fontSize: 11,
    color: '#60A5FA',
    fontWeight: '500',
  },
  sidebarOrgBadge: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  sidebarOrgLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  sidebarOrgName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F8FAFC',
    lineHeight: 16,
    marginBottom: 6,
  },
  sidebarDomainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  sidebarDomainText: {
    fontSize: 11,
    color: '#93C5FD',
    fontWeight: '500',
  },
  sidebarNav: {
    flex: 1,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 6,
    gap: 10,
  },
  navItemActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.25)',
  },
  navItemLabel: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
  },
  navItemLabelActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  sidebarFooter: {
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingTop: 16,
  },
  sidebarUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  sidebarAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: '#3B82F6',
  },
  avatarFallbackSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E293B',
    borderWidth: 1.5,
    borderColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarFallbackTextSmall: {
    fontSize: 13,
    fontWeight: '700',
    color: '#93C5FD',
  },
  sidebarUserMeta: {
    flex: 1,
  },
  sidebarUserName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sidebarUserEmail: {
    fontSize: 11,
    color: '#94A3B8',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  logoutButtonText: {
    color: '#F87171',
    fontSize: 13,
    fontWeight: '600',
  },

  /* ================= MAIN VIEWPORT ================= */
  mainViewport: {
    flex: 1,
    backgroundColor: '#080D1A',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: '#0B132B',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  topHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mobileBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mobileBrandIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  mobileBrandTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  topHeaderDate: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  topHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  greenPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  statusPillText: {
    fontSize: 11,
    color: '#34D399',
    fontWeight: '600',
  },
  mobileLogoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 9,
    gap: 4,
  },
  mobileLogoutBtnText: {
    color: '#F87171',
    fontSize: 11,
    fontWeight: '600',
  },

  /* ================= BODY SCROLL ================= */
  scrollBody: {
    paddingVertical: 24,
    paddingHorizontal: 24,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  welcomeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  welcomeTextCluster: {
    flex: 1,
    minWidth: 260,
  },
  welcomeGreeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 18,
  },
  welcomeBadges: {
    alignItems: 'flex-end',
  },

  /* ================= CARDS GRID ================= */
  cardsGrid: {
    gap: 20,
  },
  desktopGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridCard: {
    width: '48.5%',
  },
  card: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 20,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -2px rgba(0, 0, 0, 0.2)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 3,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  cardHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardHeaderTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 12,
    paddingVertical: 2,
    paddingHorizontal: 8,
    gap: 4,
  },
  verifiedTagText: {
    color: '#34D399',
    fontSize: 11,
    fontWeight: '600',
  },

  /* Profile Card Body */
  profileBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  profilePhoto: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  avatarFallbackLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1E293B',
    borderWidth: 2,
    borderColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackTextLarge: {
    fontSize: 22,
    fontWeight: '700',
    color: '#93C5FD',
  },
  profileDetails: {
    flex: 1,
  },
  profileFullName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 8,
  },
  profileMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  authBadgePillText: {
    fontSize: 11,
    color: '#CBD5E1',
    fontWeight: '500',
  },

  /* Role Card Body */
  roleCardBody: {
    paddingTop: 4,
  },
  roleBadgeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  roleBadgeAdmin: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderColor: '#8B5CF6',
  },
  roleBadgeUser: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: '#3B82F6',
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  roleTextAdmin: {
    color: '#C4B5FD',
  },
  roleTextUser: {
    color: '#93C5FD',
  },
  roleDescription: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 18,
    marginBottom: 12,
  },
  roleInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  roleInfoLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  roleInfoValue: {
    fontSize: 11,
    color: '#CBD5E1',
    fontWeight: '600',
  },

  /* Account & Organization Info Lists */
  infoList: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  infoLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  infoValue: {
    fontSize: 12,
    color: '#F8FAFC',
    fontWeight: '500',
  },
  infoValueBold: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  infoValueHighlight: {
    fontSize: 12,
    color: '#60A5FA',
    fontWeight: '600',
  },
  infoValueMono: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#CBD5E1',
    maxWidth: 180,
  },
  verifiedInlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedInlineText: {
    fontSize: 12,
    color: '#34D399',
    fontWeight: '500',
  },

  /* Claims Section */
  claimsWrapper: {
    marginTop: 24,
    backgroundColor: '#0F172A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 20,
  },
  claimsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  claimsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  /* Mobile Bottom Logout */
  mobileBottomLogoutWrapper: {
    marginTop: 24,
    marginBottom: 16,
  },
  mobileFullLogoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  mobileFullLogoutText: {
    color: '#F87171',
    fontSize: 14,
    fontWeight: '600',
  },
});
