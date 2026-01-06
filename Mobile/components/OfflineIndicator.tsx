// Mobile/components/OfflineIndicator.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface OfflineIndicatorProps {
  isOnline: boolean;
  isAvailableOffline?: boolean;
  size?: 'small' | 'large';
}

export default function OfflineIndicator({
  isOnline,
  isAvailableOffline = false,
  size = 'small',
}: OfflineIndicatorProps) {
  if (isOnline) {
    return null; // No indicator when online
  }

  const isSmall = size === 'small';

  if (isAvailableOffline) {
    return (
      <View style={[styles.container, isSmall && styles.containerSmall]}>
        <Ionicons
          size={isSmall ? 14 : 18}
          color="#fff"
          style={styles.icon}
        />
        <Text style={[styles.text, isSmall && styles.textSmall]}>Offline Available</Text>
      </View>
    );
  }

  return (
    <View style={[styles.containerError, isSmall && styles.containerSmall]}>
      <Ionicons
        name="cloud-offline"
        size={isSmall ? 14 : 18}
        color="#fff"
        style={styles.icon}
      />
      <Text style={[styles.text, isSmall && styles.textSmall]}>Offline</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  containerSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  containerError: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  icon: {
    marginRight: 2,
  },
  text: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  textSmall: {
    fontSize: 11,
    fontWeight: '500',
  },
});

