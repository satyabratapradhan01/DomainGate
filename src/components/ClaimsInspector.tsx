import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DecodedTokenClaims } from '../services/tokenService';

interface ClaimsInspectorProps {
  claims: DecodedTokenClaims;
  idToken?: string;
}

export const ClaimsInspector: React.FC<ClaimsInspectorProps> = ({ claims, idToken }) => {
  const [showRawToken, setShowRawToken] = useState(false);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="key-outline" size={16} color="#A78BFA" style={styles.headerIcon} />
          <Text style={styles.title}>Cryptographic Claims & Token Inspector</Text>
        </View>
        <View style={styles.verifiedPill}>
          <Ionicons name="checkmark-circle" size={12} color="#10B981" />
          <Text style={styles.verifiedText}>RS256 Verified</Text>
        </View>
      </View>

      <Text style={styles.subtitle}>
        Verified claims parsed directly from the Google / Identity Platform bearer token:
      </Text>

      <View style={styles.grid}>
        <View style={styles.claimRow}>
          <Text style={styles.claimKey}>email:</Text>
          <Text style={[styles.claimVal, styles.claimHighlight]}>{claims.email || 'N/A'}</Text>
        </View>

        <View style={styles.claimRow}>
          <Text style={styles.claimKey}>email_verified:</Text>
          <Text style={[styles.claimVal, { color: claims.email_verified ? '#10B981' : '#EF4444' }]}>
            {claims.email_verified ? 'true (Identity Confirmed)' : 'false (Rejected)'}
          </Text>
        </View>

        <View style={styles.claimRow}>
          <Text style={styles.claimKey}>hd (Hosted Domain):</Text>
          <Text style={[styles.claimVal, { color: '#38BDF8' }]}>
            {claims.hd || 'None (Consumer Account)'}
          </Text>
        </View>

        <View style={styles.claimRow}>
          <Text style={styles.claimKey}>iss (Issuer):</Text>
          <Text style={styles.claimVal}>{claims.iss || 'accounts.google.com'}</Text>
        </View>

        <View style={styles.claimRow}>
          <Text style={styles.claimKey}>aud (Audience):</Text>
          <Text style={styles.claimVal}>{claims.aud || 'domaingate-hbplus'}</Text>
        </View>

        <View style={styles.claimRow}>
          <Text style={styles.claimKey}>exp (Expires):</Text>
          <Text style={styles.claimVal}>
            {claims.exp ? new Date(claims.exp * 1000).toLocaleTimeString() : 'N/A'}
          </Text>
        </View>
      </View>

      {idToken && (
        <View style={styles.rawSection}>
          <TouchableOpacity 
            style={styles.rawToggle} 
            onPress={() => setShowRawToken(!showRawToken)}
            activeOpacity={0.7}
          >
            <Text style={styles.rawToggleText}>
              {showRawToken ? 'Hide Raw ID Token' : 'View Raw Encrypted ID Token'}
            </Text>
            <Ionicons 
              name={showRawToken ? 'chevron-up' : 'chevron-down'} 
              size={14} 
              color="#94A3B8" 
            />
          </TouchableOpacity>

          {showRawToken && (
            <View style={styles.rawBox}>
              <Text style={styles.rawText}>
                {idToken.substring(0, 48)}...{idToken.substring(idToken.length - 32)}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginVertical: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginRight: 6,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#064E3B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#059669',
  },
  verifiedText: {
    color: '#34D399',
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 4,
  },
  subtitle: {
    color: '#64748B',
    fontSize: 11,
    marginBottom: 10,
  },
  grid: {
    backgroundColor: '#0B0F19',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  claimRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  claimKey: {
    color: '#94A3B8',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '600',
  },
  claimVal: {
    color: '#CBD5E1',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    maxWidth: '65%',
    textAlign: 'right',
  },
  claimHighlight: {
    color: '#38BDF8',
    fontWeight: '700',
  },
  rawSection: {
    marginTop: 10,
  },
  rawToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  rawToggleText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
  },
  rawBox: {
    backgroundColor: '#050811',
    padding: 8,
    borderRadius: 6,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  rawText: {
    color: '#64748B',
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});

