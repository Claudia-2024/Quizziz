// Mobile/components/SyncStatus.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOffline } from '@/context/OfflineContext';

interface SyncStatusProps {
  showDetails?: boolean;
}

export default function SyncStatus({ showDetails = false }: SyncStatusProps) {
  const { isOnline, isSyncing, lastSyncTime } = useOffline();
  const [showInfo, setShowInfo] = useState(false);

  if (showInfo === false && !showDetails) {
    // Don't show anything by default when online and not syncing
    if (isOnline && !isSyncing && lastSyncTime) {
      return null;
    }
  }

  const getLastSyncText = () => {
    if (!lastSyncTime) return 'Never synced';

    const now = new Date();
    const diffMs = now.getTime() - lastSyncTime.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <TouchableOpacity
      onPress={() => setShowInfo(!showInfo)}
      activeOpacity={0.7}
      style={styles.container}
    >
      {isSyncing ? (
        <>
          <Ionicons name="sync" size={16} color="#3B82F6" style={styles.icon} />
          <Text style={styles.text}>Syncing...</Text>
        </>
      ) : !isOnline ? (
        <>
          <Ionicons name="cloud-offline" size={16} color="#EF4444" style={styles.icon} />
          <Text style={styles.text}>Offline Mode</Text>
        </>
      ) : (
        <>
          <Ionicons name="cloud-done" size={16} color="#10B981" style={styles.icon} />
          <Text style={styles.text}>Synced</Text>
        </>
      )}

      {showInfo && (
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Status: </Text>
          <Text style={styles.infoValue}>
            {isSyncing ? 'Syncing' : isOnline ? 'Online' : 'Offline'}
          </Text>
          <Text style={styles.infoLabel}>Last Sync: </Text>
          <Text style={styles.infoValue}>{getLastSyncText()}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    gap: 6,
  },
  icon: {
    marginRight: 2,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },
  infoBox: {
    position: 'absolute',
    bottom: -80,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 11,
    color: '#1F2937',
    marginBottom: 6,
  },
});

