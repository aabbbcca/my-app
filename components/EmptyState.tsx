import React from 'react';
import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Text, View } from '@/components/Themed';

interface EmptyStateProps {
  title?: string;
  message?: string;
  iconName?: React.ComponentProps<typeof Ionicons>['name'];
}

export default function EmptyState({
  title = 'No Cutouts Yet',
  message = 'Photos you process on the Create tab will show up here.',
  iconName = 'images-outline',
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Ionicons name={iconName} size={48} color="#8E8E93" style={styles.icon} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    marginVertical: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
  },
  icon: {
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
});
