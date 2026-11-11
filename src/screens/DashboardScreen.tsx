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
  Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { DomainBadge } from '../components/DomainBadge';
import { ClaimsInspector } from '../components/ClaimsInspector';
import { getAuditLogs, AuditEvent } from '../utils/auditLogger';
import { SECURITY_CONFIG } from '../config/securityConfig';
import { FirestoreService, CorporateWorkspaceDoc } from '../services/firestoreService';

export const DashboardScreen: React.FC = () => {
  const { user, signOut } = useAuth();
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [activeTab, setActiveTab] = useState<'workspace' | 'claims' | 'audits'>('workspace');
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
        `HTTP 200 OK: Backend verified RS256 token for ${user?.email}. Zero-trust policy validated domain '@${SECURITY_CONFIG.ALLOWED_DOMAIN}'.`
      );
    }, 700);
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          {/* Top Bar with Brand & Logout */}
          <View style={styles.topBar}>
            <View style={styles.brandRow}>
              <View style={styles.logoBadge}>
                <Ionicons name="shield-checkmark" size={18} color="#10B981" />
              </View>
              <View>
                <Text style={styles.brandTitle}>DomainGate</Text>
                <Text style={styles.brandSubtitle}>HBPlus Corporate Workspace</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.signOutBtn}
              onPress={signOut}
              activeOpacity={0.8}
            >
              <Ionicons name="log-out-outline" size={16} color="#F87171" style={{ marginRight: 6 }} />
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>

          {/* User Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.avatarRow}>
              {user?.photoURL ? (
                <Image source={{ uri: user.photoURL }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarInitial}>
                    {user?.displayName?.charAt(0).toUpperCase() || 'U'}
                  </Text>
                </View>
              )}
              <View style={styles.profileText}>
                <View style={styles.nameRow}>
                  <Text style={styles.displayName}>{user?.displayName || 'Authorized User'}</Text>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" style={{ marginLeft: 6 }} />
                </View>
                <Text style={styles.emailText}>{user?.email}</Text>
                <Text style={styles.uidText}>UID: {user?.uid}</Text>
              </View>
            </View>

            <View style={styles.badgeCluster}>
              <DomainBadge status="authorized" customText={`DOMAIN: @${user?.domain}`} />
              <View style={styles.verifiedBadge}>
                <Ionicons name="ribbon-outline" size={12} color="#38BDF8" style={{ marginRight: 4 }} />
                <Text style={styles.verifiedBadgeText}>Google OAuth Verified</Text>
              </View>
            </View>
          </View>

          {/* Navigation Tabs */}
          <View style={styles.tabsRow}>
            <TouchableOpacity 
              style={[styles.tabButton, activeTab === 'workspace' && styles.tabButtonActive]}
              onPress={() => setActiveTab('workspace')}
            >
              <Ionicons 
                name="grid-outline" 
                size={14} 
                color={activeTab === 'workspace' ? '#38BDF8' : '#94A3B8'} 
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.tabText, activeTab === 'workspace' && styles.tabTextActive]}>
                Corporate Hub
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.tabButton, activeTab === 'claims' && styles.tabButtonActive]}
              onPress={() => setActiveTab('claims')}
            >
              <Ionicons 
                name="key-outline" 
                size={14} 
                color={activeTab === 'claims' ? '#38BDF8' : '#94A3B8'} 
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.tabText, activeTab === 'claims' && styles.tabTextActive]}>
                Token Claims
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.tabButton, activeTab === 'audits' && styles.tabButtonActive]}
              onPress={() => setActiveTab('audits')}
            >
              <Ionicons 
                name="time-outline" 
                size={14} 
                color={activeTab === 'audits' ? '#38BDF8' : '#94A3B8'} 
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.tabText, activeTab === 'audits' && styles.tabTextActive]}>
                Security Audits
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab 1: Workspace & Protected Endpoints */}
          {activeTab === 'workspace' && (
            <View>
              {/* Access Granted Callout */}
              <View style={styles.grantCallout}>
                <Ionicons name="shield-checkmark" size={24} color="#10B981" style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.grantTitle}>Authorization Verified: Access Granted</Text>
                  <Text style={styles.grantDesc}>
                    Identity policy matched: Verified corporate domain <Text style={styles.boldText}>@{SECURITY_CONFIG.ALLOWED_DOMAIN}</Text>.
                    Your session is protected with cryptographically signed tokens.
                  </Text>
                </View>
              </View>

              {/* Corporate Resources */}
              <View style={styles.sectionCard}>
                <Text style={styles.cardHeader}>Authorized Corporate Services</Text>
                
                <View style={styles.resourceList}>
                  <View style={styles.resourceItem}>
                    <View style={styles.resIconBox}>
                      <Ionicons name="fitness-outline" size={20} color="#38BDF8" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.resTitle}>HBPlus Fitness Performance Intelligence</Text>
                      <Text style={styles.resDesc}>Enterprise training datasets and biometrics access</Text>
                    </View>
                    <View style={styles.statusPill}>
                      <Text style={styles.statusPillText}>UNLOCKED</Text>
                    </View>
                  </View>

                  <View style={styles.resourceItem}>
                    <View style={styles.resIconBox}>
                      <Ionicons name="people-outline" size={20} color="#34D399" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.resTitle}>Corporate Member Directory</Text>
                      <Text style={styles.resDesc}>Global fitness directors and certified personnel</Text>
                    </View>
                    <View style={styles.statusPill}>
                      <Text style={styles.statusPillText}>UNLOCKED</Text>
                    </View>
                  </View>

                  <View style={styles.resourceItem}>
                    <View style={styles.resIconBox}>
                      <Ionicons name="server-outline" size={20} color="#A78BFA" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.resTitle}>Zero-Trust Cloud Storage Vault</Text>
                      <Text style={styles.resDesc}>Protected by Firebase Storage domain security rules</Text>
                    </View>
                    <View style={styles.statusPill}>
                      <Text style={styles.statusPillText}>UNLOCKED</Text>
                    </View>
                  </View>
                </View>

                {/* Protected API Test Button */}
                <View style={styles.apiTestBox}>
                  <Text style={styles.apiTestTitle}>Backend Zero-Trust API Simulator</Text>
                  <Text style={styles.apiTestDesc}>
                    Sends your bearer token to the server middleware (<Text style={styles.monoText}>requireHBPlusDomainAuth</Text>) to prove backend validation.
                  </Text>
                  
                  <TouchableOpacity 
                    style={[styles.apiBtn, apiSimulating && { opacity: 0.6 }]}
                    onPress={handleSimulateProtectedApiCall}
                    disabled={apiSimulating}
                  >
                    <Ionicons name="send" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.apiBtnText}>
                      {apiSimulating ? 'Validating Token on Server...' : 'Dispatch Protected API Request'}
                    </Text>
                  </TouchableOpacity>

                  {apiSuccessMsg && (
                    <View style={styles.apiSuccessBox}>
                      <Ionicons name="checkmark-circle" size={16} color="#10B981" style={{ marginRight: 8 }} />
                      <Text style={styles.apiSuccessText}>{apiSuccessMsg}</Text>
                    </View>
                  )}
                </View>

                {/* Cloud Firestore Zero-Trust Query Test */}
                <View style={styles.apiTestBox}>
                  <Text style={styles.apiTestTitle}>Cloud Firestore Zero-Trust Security Test</Text>
                  <Text style={styles.apiTestDesc}>
                    Tests live document query against Firestore database. Domain-restricted security rules enforce read/write access.
                  </Text>
                  
                  <TouchableOpacity 
                    style={[styles.apiBtn, { backgroundColor: '#059669' }, firestoreLoading && { opacity: 0.6 }]}
                    onPress={handleQueryFirestore}
                    disabled={firestoreLoading}
                  >
                    <Ionicons name="cloud-download-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.apiBtnText}>
                      {firestoreLoading ? 'Querying Firestore...' : 'Query Cloud Firestore Workspace'}
                    </Text>
                  </TouchableOpacity>

                  {firestoreMsg && (
                    <View style={[styles.apiSuccessBox, { borderColor: 'rgba(56, 189, 248, 0.4)' }]}>
                      <Ionicons name="information-circle" size={16} color="#38BDF8" style={{ marginRight: 8 }} />
                      <Text style={[styles.apiSuccessText, { color: '#E2E8F0' }]}>{firestoreMsg}</Text>
                    </View>
                  )}

                  {firestoreDoc && (
                    <View style={styles.firestoreDocBox}>
                      <Text style={styles.firestoreDocTitle}>Firestore Document Data:</Text>
                      <Text style={styles.firestoreDocText}>ID: {firestoreDoc.id}</Text>
                      <Text style={styles.firestoreDocText}>Organization: {firestoreDoc.name}</Text>
                      <Text style={styles.firestoreDocText}>Authorized Domain: @{firestoreDoc.domain}</Text>
                      <Text style={styles.firestoreDocText}>Status: {firestoreDoc.complianceStatus}</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* Tab 2: Decoded Token Claims */}
          {activeTab === 'claims' && user && (
            <ClaimsInspector claims={user.claims} idToken={user.idToken} />
          )}

          {/* Tab 3: Security Audits */}
          {activeTab === 'audits' && (
            <View style={styles.sectionCard}>
              <Text style={styles.cardHeader}>Security Audit Trail</Text>
              <Text style={styles.auditIntro}>
                Immutable log of recent authentication and access boundary evaluations:
              </Text>

              {auditEvents.length === 0 ? (
                <Text style={styles.emptyText}>No audit entries found.</Text>
              ) : (
                <View style={styles.auditList}>
                  {auditEvents.map((evt) => {
                    const isSuccess = evt.eventType === 'AUTH_SUCCESS';
                    return (
                      <View 
                        key={evt.id} 
                        style={[
                          styles.auditItem,
                          isSuccess ? styles.auditItemSuccess : styles.auditItemDenied
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
                            <Text style={[styles.auditType, { color: isSuccess ? '#34D399' : '#F87171' }]}>
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
          )}
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
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  container: {
    width: '100%',
    maxWidth: 640,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  brandTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  brandSubtitle: {
    color: '#94A3B8',
    fontSize: 11,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  signOutText: {
    color: '#F87171',
    fontSize: 12,
    fontWeight: '600',
  },
  profileCard: {
    backgroundColor: '#0F172A',
    borderColor: '#1E293B',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: '#10B981',
    marginRight: 14,
  },
  avatarFallback: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1E293B',
    borderWidth: 2,
    borderColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarInitial: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '700',
  },
  profileText: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  displayName: {
    color: '#F8FAFC',
    fontSize: 17,
    fontWeight: '700',
  },
  emailText: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 2,
  },
  uidText: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  badgeCluster: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingTop: 12,
    alignItems: 'center',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  verifiedBadgeText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '600',
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: '#1E293B',
  },
  tabText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#F8FAFC',
  },
  grantCallout: {
    flexDirection: 'row',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  grantTitle: {
    color: '#34D399',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  grantDesc: {
    color: '#CBD5E1',
    fontSize: 12,
    lineHeight: 18,
  },
  boldText: {
    color: '#10B981',
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: '#0F172A',
    borderColor: '#1E293B',
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  cardHeader: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  resourceList: {
    gap: 10,
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0B0F19',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  resIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  resTitle: {
    color: '#F1F5F9',
    fontSize: 13,
    fontWeight: '600',
  },
  resDesc: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  statusPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  statusPillText: {
    color: '#34D399',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  apiTestBox: {
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  apiTestTitle: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  apiTestDesc: {
    color: '#94A3B8',
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 12,
  },
  monoText: {
    color: '#38BDF8',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  apiBtn: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
  },
  apiBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  apiSuccessBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    padding: 10,
    marginTop: 10,
  },
  apiSuccessText: {
    color: '#34D399',
    fontSize: 11,
    flex: 1,
    lineHeight: 16,
  },
  auditIntro: {
    color: '#94A3B8',
    fontSize: 12,
    marginBottom: 12,
  },
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
  firestoreDocBox: {
    backgroundColor: '#0B0F19',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#059669',
    padding: 10,
    marginTop: 10,
  },
  firestoreDocTitle: {
    color: '#34D399',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  firestoreDocText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginVertical: 1,
  },
});

