import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SECURITY_CONFIG } from '../config/securityConfig';

export const SecurityNotice: React.FC = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.card}>
      <TouchableOpacity 
        style={styles.headerRow} 
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.titleRow}>
          <Ionicons name="shield-checkmark-outline" size={18} color="#38BDF8" style={styles.icon} />
          <Text style={styles.title}>Defense-in-Depth Security Policy</Text>
        </View>
        <Ionicons 
          name={expanded ? 'chevron-up' : 'chevron-down'} 
          size={16} 
          color="#94A3B8" 
        />
      </TouchableOpacity>

      <Text style={styles.summary}>
        DomainGate enforces a zero-trust boundary. Only authenticated Google accounts belonging to{' '}
        <Text style={styles.highlight}>@{SECURITY_CONFIG.ALLOWED_DOMAIN}</Text> with verified status are admitted.
      </Text>

      {expanded && (
        <View style={styles.detailsContainer}>
          <View style={styles.layerItem}>
            <View style={styles.layerNumber}><Text style={styles.layerNumberText}>1</Text></View>
            <View style={styles.layerContent}>
              <Text style={styles.layerTitle}>Firebase Auth Blocking Functions</Text>
              <Text style={styles.layerDescription}>
                Server-side triggers (<Text style={styles.code}>beforeUserCreated</Text>) halt unapproved accounts before an ID token or account record is minted.
              </Text>
            </View>
          </View>

          <View style={styles.layerItem}>
            <View style={styles.layerNumber}><Text style={styles.layerNumberText}>2</Text></View>
            <View style={styles.layerContent}>
              <Text style={styles.layerTitle}>Zero-Trust Firestore & Storage Rules</Text>
              <Text style={styles.layerDescription}>
                Data access strictly checks <Text style={styles.code}>request.auth.token.email.matches('.*@hbplus[.]fit$')</Text>.
              </Text>
            </View>
          </View>

          <View style={styles.layerItem}>
            <View style={styles.layerNumber}><Text style={styles.layerNumberText}>3</Text></View>
            <View style={styles.layerContent}>
              <Text style={styles.layerTitle}>Cryptographic Token Verification</Text>
              <Text style={styles.layerDescription}>
                RS256 JWT signatures and email_verified claims verified on all backend API calls.
              </Text>
            </View>
          </View>

          <View style={styles.layerItem}>
            <View style={styles.layerNumber}><Text style={styles.layerNumberText}>4</Text></View>
            <View style={styles.layerContent}>
              <Text style={styles.layerTitle}>Immediate Atomic Session Eviction</Text>
              <Text style={styles.layerDescription}>
                Any unapproved session is instantly torn down, wiped from SecureStore, and logged in security audits.
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0F172A',
    borderColor: '#1E293B',
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginVertical: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 8,
  },
  title: {
    color: '#F1F5F9',
    fontSize: 14,
    fontWeight: '700',
  },
  summary: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 19,
  },
  highlight: {
    color: '#38BDF8',
    fontWeight: '600',
  },
  detailsContainer: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingTop: 12,
  },
  layerItem: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  layerNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 1,
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  layerNumberText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
  },
  layerContent: {
    flex: 1,
  },
  layerTitle: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  layerDescription: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 17,
  },
  code: {
    color: '#F472B6',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 11,
  },
});
