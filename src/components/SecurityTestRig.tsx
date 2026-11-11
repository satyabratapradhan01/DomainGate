import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

export const SecurityTestRig: React.FC = () => {
  const { simulateSignIn, state } = useAuth();
  const [customEmail, setCustomEmail] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);

  const testCases = [
    {
      email: 'satya@hbplus.fit',
      name: 'Satya Nadella',
      expected: 'GRANTED' as const,
      description: 'Authorized corporate domain user',
    },
    {
      email: 'example@gmail.com',
      name: 'John Public',
      expected: 'DENIED' as const,
      description: 'Generic Google webmail account',
    },
    {
      email: 'example@yahoo.com',
      name: 'Jane Doe',
      expected: 'DENIED' as const,
      description: 'External non-corporate webmail',
    },
    {
      email: 'example@anothercompany.com',
      name: 'Corp Partner',
      expected: 'DENIED' as const,
      description: 'Unauthorized foreign corporate domain',
    },
  ];

  const handleCustomTest = () => {
    if (!customEmail || !customEmail.includes('@')) return;
    simulateSignIn(customEmail.trim(), 'Custom Evaluator');
  };

  const isBusy = state === 'AUTHENTICATING' || state === 'VERIFYING_DOMAIN';

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.toggleBar} 
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        <View style={styles.titleContainer}>
          <Ionicons name="flask-outline" size={16} color="#F59E0B" style={styles.flaskIcon} />
          <Text style={styles.title}>Specification Test Suite & Simulation</Text>
        </View>
        <Ionicons 
          name={isExpanded ? 'chevron-up' : 'chevron-down'} 
          size={16} 
          color="#94A3B8" 
        />
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.content}>
          <Text style={styles.description}>
            Instant verification of the prompt's exact security requirement test cases:
          </Text>

          <View style={styles.casesList}>
            {testCases.map((tc) => {
              const isGranted = tc.expected === 'GRANTED';
              return (
                <TouchableOpacity
                  key={tc.email}
                  style={[
                    styles.caseItem,
                    isGranted ? styles.caseItemGranted : styles.caseItemDenied,
                  ]}
                  onPress={() => simulateSignIn(tc.email, tc.name)}
                  disabled={isBusy}
                  activeOpacity={0.8}
                >
                  <View style={styles.caseHeader}>
                    <View style={styles.emailRow}>
                      <Ionicons
                        name={isGranted ? 'checkmark-circle' : 'close-circle'}
                        size={16}
                        color={isGranted ? '#10B981' : '#EF4444'}
                        style={styles.caseIcon}
                      />
                      <Text style={styles.caseEmail}>{tc.email}</Text>
                    </View>
                    <View
                      style={[
                        styles.badge,
                        isGranted ? styles.badgeGranted : styles.badgeDenied,
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          isGranted ? styles.badgeTextGranted : styles.badgeTextDenied,
                        ]}
                      >
                        {tc.expected}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.caseDesc}>{tc.description}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Custom Email Input */}
          <View style={styles.customBox}>
            <Text style={styles.customLabel}>Test Custom Email Address:</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="e.g. alex@hbplus.fit or alex@test.com"
                placeholderTextColor="#64748B"
                value={customEmail}
                onChangeText={setCustomEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!isBusy}
              />
              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  (!customEmail || isBusy) && styles.submitBtnDisabled,
                ]}
                onPress={handleCustomTest}
                disabled={!customEmail || isBusy}
              >
                <Text style={styles.submitBtnText}>Verify</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0B1120',
    borderColor: '#1E293B',
    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 14,
  },
  toggleBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#0F172A',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flaskIcon: {
    marginRight: 8,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
  },
  content: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  description: {
    color: '#94A3B8',
    fontSize: 12,
    marginBottom: 10,
  },
  casesList: {
    gap: 8,
  },
  caseItem: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  caseItemGranted: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  caseItemDenied: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  caseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  caseIcon: {
    marginRight: 6,
  },
  caseEmail: {
    color: '#F1F5F9',
    fontSize: 13,
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeGranted: {
    backgroundColor: '#064E3B',
  },
  badgeDenied: {
    backgroundColor: '#4C0519',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  badgeTextGranted: {
    color: '#34D399',
  },
  badgeTextDenied: {
    color: '#F87171',
  },
  caseDesc: {
    color: '#64748B',
    fontSize: 11,
    marginLeft: 22,
  },
  customBox: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  customLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#1E293B',
    color: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  submitBtn: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnDisabled: {
    backgroundColor: '#334155',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});

