import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SECURITY_CONFIG } from '../config/securityConfig';

interface DomainBadgeProps {
  status?: 'authorized' | 'denied' | 'neutral';
  customText?: string;
}

export const DomainBadge: React.FC<DomainBadgeProps> = ({ 
  status = 'neutral',
  customText,
}) => {
  const getBadgeStyle = () => {
    switch (status) {
      case 'authorized':
        return {
          bg: '#064E3B',
          border: '#059669',
          text: '#34D399',
          icon: 'shield-checkmark' as const,
        };
      case 'denied':
        return {
          bg: '#4C0519',
          border: '#E11D48',
          text: '#FDA4AF',
          icon: 'shield-outline' as const,
        };
      default:
        return {
          bg: '#1E293B',
          border: '#334155',
          text: '#93C5FD',
          icon: 'lock-closed' as const,
        };
    }
  };

  const styleConfig = getBadgeStyle();

  return (
    <View style={[styles.container, { backgroundColor: styleConfig.bg, borderColor: styleConfig.border }]}>
      <Ionicons name={styleConfig.icon} size={14} color={styleConfig.text} style={styles.icon} />
      <Text style={[styles.text, { color: styleConfig.text }]}>
        {customText || `@${SECURITY_CONFIG.ALLOWED_DOMAIN} ONLY`}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'center',
  },
  icon: {
    marginRight: 6,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});

