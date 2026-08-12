import React, { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

import { Text, View } from '@/components/Themed';

const RESOLUTIONS = [
  { size: 512, label: '512', hint: 'fastest' },
  { size: 768, label: '768', hint: 'balanced' },
  { size: 1024, label: '1024', hint: 'best' },
];

export default function SettingsScreen() {
  const [resolution, setResolution] = useState<number>(1024);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Settings</Text>

        {/* Model Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Model</Text>
            <View style={styles.badgeReady}>
              <Text style={styles.badgeText}>ready ✓</Text>
            </View>
          </View>
          <Text style={styles.modelName}>RMBG-1.4 · 176 MB weights</Text>
          <Text style={styles.modelNote}>176 MB total with runtime files included.</Text>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Status</Text>
            <Text style={styles.rowValue}>Ready on device</Text>
          </View>
        </View>

        {/* Working Resolution Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Working Resolution</Text>
          <Text style={styles.modelNote}>
            The resolution size the model operates on. Higher resolution provides finer edge details.
          </Text>

          <View style={styles.segmentedContainer}>
            {RESOLUTIONS.map((item) => {
              const active = resolution === item.size;
              return (
                <TouchableOpacity
                  key={item.size}
                  style={[styles.segmentButton, active ? styles.segmentActive : null]}
                  onPress={() => setResolution(item.size)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.segmentText, active ? styles.segmentTextActive : null]}>
                    {item.label}
                  </Text>
                  <Text style={[styles.segmentHint, active ? styles.segmentHintActive : null]}>
                    {item.hint}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Engine Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Engine</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>State</Text>
            <Text style={[styles.rowValue, { color: '#34C759' }]}>ready</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Backend</Text>
            <Text style={styles.rowValue}>WASM / WebGPU</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Last Inference</Text>
            <Text style={styles.rowValue}>—</Text>
          </View>
        </View>

        {/* About & Privacy Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>About</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Version</Text>
            <Text style={styles.rowValue}>1.0.0</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Expo SDK</Text>
            <Text style={styles.rowValue}>54.0.0</Text>
          </View>
          <View style={styles.divider} />
          <Text style={styles.privacyText}>
            All processing happens locally on your device. Images never leave your phone — there is no server, account, or analytics tracking.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 40,
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  card: {
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
  },
  badgeReady: {
    backgroundColor: '#34C75920',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#34C759',
    fontSize: 12,
    fontWeight: '600',
  },
  modelName: {
    fontSize: 15,
    fontWeight: '500',
    marginTop: 4,
  },
  modelNote: {
    fontSize: 13,
    color: '#666666',
    marginTop: 4,
    marginBottom: 8,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    marginVertical: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
    backgroundColor: 'transparent',
  },
  rowLabel: {
    fontSize: 14,
    color: '#666666',
  },
  rowValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 12,
    padding: 4,
    marginTop: 10,
  },
  segmentButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  segmentActive: {
    backgroundColor: '#007AFF',
  },
  segmentText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333333',
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
  segmentHint: {
    fontSize: 11,
    color: '#888888',
    marginTop: 2,
  },
  segmentHintActive: {
    color: '#E5F0FF',
  },
  privacyText: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
    marginTop: 4,
  },
});
