import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView, 
  Image,
  Platform,
  useWindowDimensions 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { DomainBadge } from '../components/DomainBadge';
import { ClaimsInspector } from '../components/ClaimsInspector';
import { getAuditLogs, AuditEvent } from '../utils/auditLogger';
import { SECURITY_CONFIG } from '../config/securityConfig';
import { FirestoreService, CorporateWorkspaceDoc } from '../services/firestoreService';

type DashboardTab = 'overview' | 'members' | 'firestore' | 'claims' | 'audits';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'User';
  department: string;
  status: 'Active' | 'On Leave';
  avatarSeed: string;
}

const CORPORATE_MEMBERS: TeamMember[] = [
  { id: '1', name: 'Satya Nadella', email: 'satya@hbplus.fit', role: 'Admin', department: 'Executive Leadership', status: 'Active', avatarSeed: 'Satya' },
  { id: '2', name: 'Dr. Sarah Lin', email: 'sarah.lin@hbplus.fit', role: 'Admin', department: 'Biometric Analytics', status: 'Active', avatarSeed: 'Sarah' },
  { id: '3', name: 'Marcus Vance', email: 'marcus.v@hbplus.fit', role: 'User', department: 'Enterprise Performance', status: 'Active', avatarSeed: 'Marcus' },
  { id: '4', name: 'Elena Rostova', email: 'elena.r@hbplus.fit', role: 'User', department: 'Corporate Wellbeing', status: 'Active', avatarSeed: 'Elena' },
  { id: '5', name: 'David Kim', email: 'david.kim@hbplus.fit', role: 'User', department: 'Platform Engineering', status: 'Active', avatarSeed: 'David' },
];

export const DashboardScreen: React.FC = () => {
  const { user, signOut } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;

  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [apiSimulating, setApiSimulating] = useState(false);
  const [apiSuccessMsg, setApiSuccessMsg] = useState<string | null>(null);
  const [firestoreLoading, setFirestoreLoading] = useState(false);
  const [firestoreDoc, setFirestoreDoc] = useState<CorporateWorkspaceDoc | null>(null);
  const [firestoreMsg, setFirestoreMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadLogs() {
      const logs = await getAuditLogs();
      setAuditEvents(logs);
    }
    loadLogs();
  }, []);

  const handleSimulateProtectedApiCall = () => {
    setApiSimulating(true);
    setApiSuccessMsg(null);
    setTimeout(() => {
      setApiSimulating(false);
      setApiSuccessMsg(
        `HTTP 200 OK: Backend verified RS256 token for ${user?.email}. Zero-trust policy confirmed domain '@${SECURITY_CONFIG.ALLOWED_DOMAIN}'.`
      );
    }, 600);
  };

  const handleQueryFirestore = async () => {
    setFirestoreLoading(true);
    setFirestoreMsg(null);
    try {
      const docData = await FirestoreService.getCorporateWorkspace();
      setFirestoreDoc(docData);
      setFirestoreMsg(`Cloud Firestore query succeeded: Document 'workspaces/hbplus_corporate_hq' fetched for ${user?.email}.`);
    } catch (err: any) {
      setFirestoreMsg(err.message || 'Firestore query error');
    } finally {
      setFirestoreLoading(false);
    }
  };

  const navItems: Array<{ id: DashboardTab; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
    { id: 'overview', label: 'Overview', icon: 'grid-outline' },
    { id: 'members', label: 'Organization Members', icon: 'people-outline' },
    { id: 'firestore', label: 'Cloud Firestore', icon: 'server-outline' },
    { id: 'claims', label: 'Token & Claims', icon: 'key-outline' },
    { id: 'audits', label: 'Security Audits', icon: 'shield-checkmark-outline' },
  ];

  /* ---------------- DESKTOP SIDEBAR ---------------- */
  const renderSidebar = () => (
    <View style={styles.sidebar}>
      {/* Brand Header */}
      <View style={styles.sidebarHeader}>
        <View style={styles.brandIconBox}>
          <Ionicons name="shield-checkmark" size={20} color="#10B981" />
        </View>
        <View style={styles.brandTextCol}>
          <Text style={styles.sidebarBrandTitle}>HBPlus Portal</Text>
          <Text style={styles.sidebarBrandSubtitle}>DomainGate Zero-Trust</Text>
        </View>
      </View>

      {/* Navigation Links */}
      <View style={styles.sidebarNav}>
        <Text style={styles.navSectionHeading}>PORTAL NAVIGATION</Text>
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.sidebarNavItem, isActive && styles.sidebarNavItemActive]}
              onPress={() => setActiveTab(item.id)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={item.icon}
                size={18}
                color={isActive ? '#38BDF8' : '#94A3B8'}
                style={styles.navItemIcon}
              />
              <Text style={[styles.navItemLabel, isActive && styles.navItemLabelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Bottom User Card in Sidebar */}
      <View style={styles.sidebarFooter}>
        <View style={styles.sidebarUserRow}>
          {user?.photoURL ? (
            <Image source={{ uri: user.photoURL }} style={styles.sidebarAvatar} />
          ) : (
            <View style={styles.sidebarAvatarFallback}>
              <Text style={styles.sidebarAvatarText}>
                {user?.displayName?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
          )}
          <View style={styles.sidebarUserInfo}>
            <Text style={styles.sidebarUserName} numberOfLines={1}>
              {user?.displayName || 'Authorized User'}
            </Text>
            <Text style={styles.sidebarUserEmail} numberOfLines={1}>
              {user?.email}
            </Text>
            <View style={styles.roleRow}>
              <View style={[styles.roleBadge, user?.role === 'Admin' ? styles.roleBadgeAdmin : styles.roleBadgeUser]}>
                <Text style={styles.roleBadgeText}>ROLE: {user?.role || 'User'}</Text>
              </View>
            </View>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.sidebarLogoutBtn} 
          onPress={signOut}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={16} color="#F87171" style={{ marginRight: 6 }} />
          <Text style={styles.sidebarLogoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  /* ---------------- MAIN CONTENT AREA ---------------- */
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.layoutRoot, isDesktop && styles.desktopLayout]}>
        {/* Sidebar on Desktop */}
        {isDesktop && renderSidebar()}

        {/* Content Container */}
        <View style={styles.mainViewport}>
          {/* Top Enterprise Navigation Header */}
          <View style={styles.topHeader}>
            <View style={styles.orgHeaderCol}>
              <View style={styles.orgTitleRow}>
                {!isDesktop && (
                  <View style={styles.mobileLogoBox}>
                    <Ionicons name="shield-checkmark" size={16} color="#10B981" />
                  </View>
                )}
                <Text style={styles.orgNameText}>{user?.organization || 'HBPlus Health & Fitness Global Inc.'}</Text>
              </View>
              <Text style={styles.portalSubText}>Authorized Internal Corporate Workspace</Text>
            </View>

            <View style={styles.headerRightCluster}>
              <View style={styles.authStatusPill}>
                <View style={styles.onlineDot} />
                <Text style={styles.authStatusText}>Authenticated (Active)</Text>
              </View>

              {!isDesktop && (
                <TouchableOpacity 
                  style={styles.mobileLogoutBtn}
                  onPress={signOut}
                  activeOpacity={0.8}
                >
                  <Ionicons name="log-out-outline" size={16} color="#F87171" />
                  <Text style={styles.mobileLogoutText}>Logout</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Mobile Tabs */}
          {!isDesktop && (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.mobileTabsScroll}
              contentContainerStyle={styles.mobileTabsContainer}
            >
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.mobileTabButton, isActive && styles.mobileTabButtonActive]}
                    onPress={() => setActiveTab(item.id)}
                  >
                    <Ionicons
                      name={item.icon}
                      size={14}
                      color={isActive ? '#38BDF8' : '#94A3B8'}
                      style={{ marginRight: 6 }}
                    />
                    <Text style={[styles.mobileTabText, isActive && styles.mobileTabTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {/* Main Scrollable Content */}
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Welcome Banner */}
            <View style={styles.welcomeBanner}>
              <View style={styles.welcomeLeft}>
                {user?.photoURL ? (
                  <Image source={{ uri: user.photoURL }} style={styles.welcomeAvatar} />
                ) : (
                  <View style={styles.welcomeAvatarFallback}>
                    <Text style={styles.welcomeAvatarText}>
                      {user?.displayName?.charAt(0).toUpperCase() || 'U'}
                    </Text>
                  </View>
                )}
                <View style={styles.welcomeTextCol}>
                  <View style={styles.nameRow}>
                    <Text style={styles.welcomeGreeting}>Welcome back, {user?.displayName}</Text>
                    <Ionicons name="checkmark-circle" size={18} color="#10B981" style={{ marginLeft: 6 }} />
                  </View>
                  <Text style={styles.welcomeEmail}>{user?.email}</Text>
                  <View style={styles.welcomePillsRow}>
                    <DomainBadge status="authorized" customText={`DOMAIN: @${user?.domain}`} />
                    <View style={[styles.roleBadge, user?.role === 'Admin' ? styles.roleBadgeAdmin : styles.roleBadgeUser]}>
                      <Text style={styles.roleBadgeText}>ROLE: {user?.role || 'User'}</Text>
                    </View>
                    <View style={styles.sessionPill}>
                      <Ionicons name="shield-checkmark" size={12} color="#38BDF8" style={{ marginRight: 4 }} />
                      <Text style={styles.sessionPillText}>OAuth 2.0 Verified</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* KPI Metric Cards */}
            <View style={styles.kpiGrid}>
              <View style={styles.kpiCard}>
                <View style={styles.kpiHeader}>
                  <Text style={styles.kpiLabel}>ORGANIZATION</Text>
                  <Ionicons name="business-outline" size={16} color="#38BDF8" />
                </View>
                <Text style={styles.kpiValue} numberOfLines={1}>{user?.organization || 'HBPlus Fitness'}</Text>
                <Text style={styles.kpiSub}>Corporate Domain: @{user?.domain}</Text>
              </View>

              <View style={styles.kpiCard}>
                <View style={styles.kpiHeader}>
                  <Text style={styles.kpiLabel}>AUTH STATUS</Text>
                  <Ionicons name="shield-checkmark" size={16} color="#10B981" />
                </View>
                <Text style={[styles.kpiValue, { color: '#34D399' }]}>Active Zero-Trust</Text>
                <Text style={styles.kpiSub}>Google Identity Confirmed</Text>
              </View>

              <View style={styles.kpiCard}>
                <View style={styles.kpiHeader}>
                  <Text style={styles.kpiLabel}>ASSIGNED ROLE</Text>
                  <Ionicons name="ribbon-outline" size={16} color="#A78BFA" />
                </View>
                <Text style={[styles.kpiValue, { color: user?.role === 'Admin' ? '#F59E0B' : '#38BDF8' }]}>
                  {user?.role || 'User'}
                </Text>
                <Text style={styles.kpiSub}>Security Clearance: Core</Text>
              </View>

              <View style={styles.kpiCard}>
                <View style={styles.kpiHeader}>
                  <Text style={styles.kpiLabel}>SESSION TOKEN</Text>
                  <Ionicons name="key-outline" size={16} color="#F472B6" />
                </View>
                <Text style={styles.kpiValue}>RS256 JWT</Text>
                <Text style={styles.kpiSub}>Expires in 1 Hour</Text>
              </View>
            </View>

            {/* TAB 1: OVERVIEW */}
            {activeTab === 'overview' && (
              <View style={styles.tabContent}>
                {/* Enterprise Corporate Services */}
                <View style={styles.panelCard}>
                  <Text style={styles.panelTitle}>Authorized Corporate Services</Text>
                  <Text style={styles.panelSubtitle}>
                    Internal business services unlocked exclusively for @{SECURITY_CONFIG.ALLOWED_DOMAIN} personnel:
                  </Text>

                  <View style={styles.resourceGrid}>
                    <View style={styles.serviceItem}>
                      <View style={[styles.serviceIcon, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                        <Ionicons name="bar-chart-outline" size={22} color="#38BDF8" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.serviceName}>HBPlus Executive Fitness Analytics</Text>
                        <Text style={styles.serviceDesc}>
                          Real-time biometric data pipelines and enterprise member health reports.
                        </Text>
                      </View>
                      <View style={styles.accessBadge}>
                        <Text style={styles.accessBadgeText}>UNLOCKED</Text>
                      </View>
                    </View>

                    <View style={styles.serviceItem}>
                      <View style={[styles.serviceIcon, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                        <Ionicons name="people-outline" size={22} color="#10B981" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.serviceName}>Corporate Member Directory</Text>
                        <Text style={styles.serviceDesc}>
                          Global verified directory of HBPlus certified fitness personnel and directors.
                        </Text>
                      </View>
                      <View style={styles.accessBadge}>
                        <Text style={styles.accessBadgeText}>UNLOCKED</Text>
                      </View>
                    </View>

                    <View style={styles.serviceItem}>
                      <View style={[styles.serviceIcon, { backgroundColor: 'rgba(167, 139, 250, 0.15)' }]}>
                        <Ionicons name="lock-closed-outline" size={22} color="#A78BFA" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.serviceName}>Zero-Trust Cloud Storage Vault</Text>
                        <Text style={styles.serviceDesc}>
                          Protected by Firebase Storage security rules restricting access to verified tokens.
                        </Text>
                      </View>
                      <View style={styles.accessBadge}>
                        <Text style={styles.accessBadgeText}>UNLOCKED</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Backend API Simulator */}
                <View style={styles.panelCard}>
                  <Text style={styles.panelTitle}>Zero-Trust Backend API Verification</Text>
                  <Text style={styles.panelSubtitle}>
                    Simulates dispatching an HTTP request with your Bearer token to the server middleware (<Text style={styles.monoText}>requireHBPlusDomainAuth</Text>):
                  </Text>

                  <TouchableOpacity
                    style={[styles.primaryActionBtn, apiSimulating && { opacity: 0.6 }]}
                    onPress={handleSimulateProtectedApiCall}
                    disabled={apiSimulating}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="send" size={15} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.primaryActionBtnText}>
                      {apiSimulating ? 'Validating Token on Server...' : 'Dispatch Protected Bearer Token Request'}
                    </Text>
                  </TouchableOpacity>

                  {apiSuccessMsg && (
                    <View style={styles.apiResultBox}>
                      <Ionicons name="checkmark-circle" size={16} color="#10B981" style={{ marginRight: 8 }} />
                      <Text style={styles.apiResultText}>{apiSuccessMsg}</Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* TAB 2: MEMBERS */}
            {activeTab === 'members' && (
              <View style={styles.tabContent}>
                <View style={styles.panelCard}>
                  <View style={styles.cardHeaderFlex}>
                    <View>
                      <Text style={styles.panelTitle}>HBPlus Organization Members</Text>
                      <Text style={styles.panelSubtitle}>
                        Directory of verified employees permitted through DomainGate firewall:
                      </Text>
                    </View>
                    <View style={styles.memberCountBadge}>
                      <Text style={styles.memberCountText}>{CORPORATE_MEMBERS.length} Active</Text>
                    </View>
                  </View>

                  <View style={styles.membersTable}>
                    {CORPORATE_MEMBERS.map((member) => (
                      <View key={member.id} style={styles.memberRow}>
                        <Image
                          source={{ uri: `https://api.dicebear.com/7.x/initials/png?seed=${encodeURIComponent(member.avatarSeed)}` }}
                          style={styles.memberAvatar}
                        />
                        <View style={{ flex: 1 }}>
                          <View style={styles.memberNameRow}>
                            <Text style={styles.memberName}>{member.name}</Text>
                            <View style={[styles.roleBadgeSmall, member.role === 'Admin' ? styles.roleBadgeAdmin : styles.roleBadgeUser]}>
                              <Text style={styles.roleBadgeSmallText}>{member.role}</Text>
                            </View>
                          </View>
                          <Text style={styles.memberEmail}>{member.email}</Text>
                          <Text style={styles.memberDept}>{member.department}</Text>
                        </View>
                        <View style={styles.memberStatusPill}>
                          <View style={styles.memberOnlineDot} />
                          <Text style={styles.memberStatusText}>{member.status}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {/* TAB 3: FIRESTORE */}
            {activeTab === 'firestore' && (
              <View style={styles.tabContent}>
                <View style={styles.panelCard}>
                  <Text style={styles.panelTitle}>Cloud Firestore Zero-Trust Integration</Text>
                  <Text style={styles.panelSubtitle}>
                    All read and write queries to the database layer are governed by strict security rules requiring{' '}
                    <Text style={styles.monoText}>request.auth.token.email.matches('.*@hbplus[.]fit$')</Text>.
                  </Text>

                  <TouchableOpacity
                    style={[styles.primaryActionBtn, { backgroundColor: '#059669' }, firestoreLoading && { opacity: 0.6 }]}
                    onPress={handleQueryFirestore}
                    disabled={firestoreLoading}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="cloud-download-outline" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.primaryActionBtnText}>
                      {firestoreLoading ? 'Querying Firestore...' : 'Query Cloud Firestore Workspace Document'}
                    </Text>
                  </TouchableOpacity>

                  {firestoreMsg && (
                    <View style={[styles.apiResultBox, { borderColor: 'rgba(56, 189, 248, 0.3)' }]}>
                      <Ionicons name="information-circle" size={16} color="#38BDF8" style={{ marginRight: 8 }} />
                      <Text style={[styles.apiResultText, { color: '#E2E8F0' }]}>{firestoreMsg}</Text>
                    </View>
                  )}

                  {firestoreDoc && (
                    <View style={styles.firestoreDocContainer}>
                      <Text style={styles.firestoreDocHeader}>Firestore Document Payload (workspaces/hbplus_corporate_hq):</Text>
                      <View style={styles.firestoreJsonGrid}>
                        <View style={styles.docRow}>
                          <Text style={styles.docKey}>document_id:</Text>
                          <Text style={styles.docVal}>{firestoreDoc.id}</Text>
                        </View>
                        <View style={styles.docRow}>
                          <Text style={styles.docKey}>organization:</Text>
                          <Text style={styles.docVal}>{firestoreDoc.name}</Text>
                        </View>
                        <View style={styles.docRow}>
                          <Text style={styles.docKey}>authorized_domain:</Text>
                          <Text style={[styles.docVal, { color: '#38BDF8' }]}>@{firestoreDoc.domain}</Text>
                        </View>
                        <View style={styles.docRow}>
                          <Text style={styles.docKey}>tier:</Text>
                          <Text style={styles.docVal}>{firestoreDoc.tier}</Text>
                        </View>
                        <View style={styles.docRow}>
                          <Text style={styles.docKey}>compliance_status:</Text>
                          <Text style={[styles.docVal, { color: '#34D399' }]}>{firestoreDoc.complianceStatus}</Text>
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* TAB 4: CLAIMS INSPECTOR */}
            {activeTab === 'claims' && user && (
              <View style={styles.tabContent}>
                <ClaimsInspector claims={user.claims} idToken={user.idToken} />
              </View>
            )}

            {/* TAB 5: AUDITS */}
            {activeTab === 'audits' && (
              <View style={styles.tabContent}>
                <View style={styles.panelCard}>
                  <Text style={styles.panelTitle}>Enterprise Security Audit Trail</Text>
                  <Text style={styles.panelSubtitle}>
                    Real-time immutable audit records of all authentication requests and boundary checks:
                  </Text>

                  {auditEvents.length === 0 ? (
                    <Text style={styles.emptyText}>No recent audit records found.</Text>
                  ) : (
                    <View style={styles.auditList}>
                      {auditEvents.map((evt) => {
                        const isSuccess = evt.eventType === 'AUTH_SUCCESS';
                        return (
                          <View
                            key={evt.id}
                            style={[
                              styles.auditItem,
                              isSuccess ? styles.auditItemSuccess : styles.auditItemDenied,
                            ]}
                          >
                            <View style={styles.auditHeader}>
                              <View style={styles.auditTypeRow}>
                                <Ionicons
                                  name={isSuccess ? 'shield-checkmark' : 'shield-outline'}
                                  size={14}
                                  color={isSuccess ? '#10B981' : '#EF4444'}
                                  style={{ marginRight: 6 }}
                                />
                                <Text
                                  style={[
                                    styles.auditType,
                                    { color: isSuccess ? '#34D399' : '#F87171' },
                                  ]}
                                >
                                  {evt.eventType}
                                </Text>
                              </View>
                              <Text style={styles.auditTime}>
                                {new Date(evt.timestamp).toLocaleTimeString()}
                              </Text>
                            </View>
                            <Text style={styles.auditEmail}>Subject: {evt.email}</Text>
                            {evt.reason && <Text style={styles.auditReason}>{evt.reason}</Text>}
                            <Text style={styles.auditId}>ID: {evt.id} • Platform: {evt.platform}</Text>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
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
    backgroundColor: '#050914',
  },
  layoutRoot: {
    flex: 1,
    backgroundColor: '#050914',
  },
  desktopLayout: {
    flexDirection: 'row',
  },

  /* ---------------- SIDEBAR (DESKTOP) ---------------- */
  sidebar: {
    width: 270,
    backgroundColor: '#090D1A',
    borderRightWidth: 1,
    borderRightColor: '#1E293B',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  brandIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  brandTextCol: {
    flex: 1,
  },
  sidebarBrandTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sidebarBrandSubtitle: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '600',
  },
  sidebarNav: {
    paddingHorizontal: 12,
    paddingTop: 20,
    flex: 1,
  },
  navSectionHeading: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  sidebarNavItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  sidebarNavItemActive: {
    backgroundColor: '#1E293B',
  },
  navItemIcon: {
    marginRight: 12,
  },
  navItemLabel: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  navItemLabelActive: {
    color: '#F8FAFC',
  },
  sidebarFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    backgroundColor: '#070B16',
  },
  sidebarUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  sidebarAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#10B981',
    marginRight: 10,
  },
  sidebarAvatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E293B',
    borderWidth: 2,
    borderColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  sidebarAvatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  sidebarUserInfo: {
    flex: 1,
  },
  sidebarUserName: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
  },
  sidebarUserEmail: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 1,
  },
  roleRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roleBadgeAdmin: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  roleBadgeUser: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  roleBadgeText: {
    color: '#F8FAFC',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sidebarLogoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 8,
    paddingVertical: 10,
  },
  sidebarLogoutText: {
    color: '#F87171',
    fontSize: 13,
    fontWeight: '700',
  },

  /* ---------------- MAIN VIEWPORT ---------------- */
  mainViewport: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#090D1A',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  orgHeaderCol: {
    flex: 1,
  },
  orgTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mobileLogoBox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  orgNameText: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  portalSubText: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  headerRightCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  authStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  authStatusText: {
    color: '#34D399',
    fontSize: 11,
    fontWeight: '700',
  },
  mobileLogoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  mobileLogoutText: {
    color: '#F87171',
    fontSize: 11,
    fontWeight: '700',
  },

  /* ---------------- MOBILE TABS ---------------- */
  mobileTabsScroll: {
    backgroundColor: '#0B0F1E',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    maxHeight: 46,
  },
  mobileTabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  mobileTabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#1E293B',
  },
  mobileTabButtonActive: {
    backgroundColor: '#2563EB',
  },
  mobileTabText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  mobileTabTextActive: {
    color: '#FFFFFF',
  },

  /* ---------------- SCROLL CONTENT ---------------- */
  scrollContent: {
    padding: 20,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },

  /* ---------------- WELCOME BANNER ---------------- */
  welcomeBanner: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  welcomeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  welcomeAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#10B981',
    marginRight: 16,
  },
  welcomeAvatarFallback: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1E293B',
    borderWidth: 2,
    borderColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  welcomeAvatarText: {
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '800',
  },
  welcomeTextCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  welcomeGreeting: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  welcomeEmail: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 2,
  },
  welcomePillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  sessionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 14,
  },
  sessionPillText: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '700',
  },

  /* ---------------- KPI GRID ---------------- */
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  kpiCard: {
    flex: 1,
    minWidth: 160,
    backgroundColor: '#0F172A',
    borderColor: '#1E293B',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  kpiLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  kpiValue: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  kpiSub: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 4,
  },

  /* ---------------- TAB CONTENT ---------------- */
  tabContent: {
    gap: 16,
  },
  panelCard: {
    backgroundColor: '#0F172A',
    borderColor: '#1E293B',
    borderWidth: 1,
    borderRadius: 14,
    padding: 20,
  },
  panelTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  panelSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 18,
  },
  resourceGrid: {
    gap: 10,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#090D18',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  serviceIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  serviceName: {
    color: '#F1F5F9',
    fontSize: 14,
    fontWeight: '600',
  },
  serviceDesc: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  accessBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  accessBadgeText: {
    color: '#34D399',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  primaryActionBtn: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    marginTop: 6,
  },
  primaryActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  apiResultBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    padding: 12,
    marginTop: 12,
  },
  apiResultText: {
    color: '#34D399',
    fontSize: 11,
    flex: 1,
    lineHeight: 16,
  },
  monoText: {
    color: '#38BDF8',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },

  /* ---------------- MEMBERS TAB ---------------- */
  cardHeaderFlex: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  memberCountBadge: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  memberCountText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
  },
  membersTable: {
    gap: 8,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#090D18',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#334155',
    marginRight: 12,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberName: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
  },
  roleBadgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 6,
  },
  roleBadgeSmallText: {
    color: '#F8FAFC',
    fontSize: 9,
    fontWeight: '800',
  },
  memberEmail: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 1,
  },
  memberDept: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 2,
  },
  memberStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  memberOnlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 4,
  },
  memberStatusText: {
    color: '#34D399',
    fontSize: 10,
    fontWeight: '600',
  },

  /* ---------------- FIRESTORE TAB ---------------- */
  firestoreDocContainer: {
    backgroundColor: '#080C16',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#059669',
    marginTop: 14,
  },
  firestoreDocHeader: {
    color: '#34D399',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  firestoreJsonGrid: {
    gap: 4,
  },
  docRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  docKey: {
    color: '#94A3B8',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  docVal: {
    color: '#F1F5F9',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '600',
  },

  /* ---------------- AUDITS TAB ---------------- */
  auditList: {
    gap: 8,
  },
  auditItem: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  auditItemSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  auditItemDenied: {
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  auditHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  auditTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  auditType: {
    fontSize: 11,
    fontWeight: '700',
  },
  auditTime: {
    color: '#64748B',
    fontSize: 10,
  },
  auditEmail: {
    color: '#F1F5F9',
    fontSize: 12,
    fontWeight: '600',
  },
  auditReason: {
    color: '#F87171',
    fontSize: 11,
    marginTop: 2,
  },
  auditId: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 12,
    fontStyle: 'italic',
  },
});
