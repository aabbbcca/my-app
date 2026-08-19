import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useEngine } from '@/src/lib/engine';
import { formatBytes, formatDate, formatMs } from '@/src/lib/format';
import { TOTAL_EXPECTED_BYTES } from '@/src/lib/manifest';
import { RESOLUTIONS } from '@/src/lib/types';

const RESOLUTION_OPTIONS = [
  { size: 512, label: '512', hint: 'fastest' },
  { size: 768, label: '768', hint: 'balanced' },
  { size: 1024, label: '1024', hint: 'best' },
] as const;

export default function SettingsScreen() {
  const engine = useEngine();
  const [deleting, setDeleting] = useState(false);

  const { refreshModelStatus } = engine;
  useFocusEffect(
    useCallback(() => {
      void refreshModelStatus();
    }, [refreshModelStatus])
  );

  const status = engine.modelStatus;
  const isDownloading = engine.state === 'downloading';
  const isReady = status?.phase === 'ready';
  const isPartial = status?.phase === 'partial';

  const download = engine.download;
  const ratio =
    download && download.bytesTotal > 0
      ? download.bytesDownloaded / download.bytesTotal
      : null;
  const percent = ratio !== null ? Math.round(ratio * 100) : 0;

  const handleConfirmDelete = () => {
    if (engine.state === 'processing') {
      Alert.alert('Busy', 'Finish the cutout in progress before deleting the model.');
      return;
    }
    Alert.alert(
      'Delete Model',
      `Frees ${formatBytes(status?.bytesOnDisk ?? 0)}. You will need an internet connection to re-download it.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await engine.deleteModel();
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Settings</Text>

        {/* Model Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Model</Text>
            {isReady ? (
              <View style={styles.badgeReady}>
                <Text style={styles.badgeReadyText}>ready ✓</Text>
              </View>
            ) : isDownloading ? (
              <View style={styles.badgeDownloading}>
                <Text style={styles.badgeDownloadingText}>downloading</Text>
              </View>
            ) : isPartial ? (
              <View style={styles.badgePartial}>
                <Text style={styles.badgePartialText}>incomplete</Text>
              </View>
            ) : (
              <View style={styles.badgeAbsent}>
                <Text style={styles.badgeAbsentText}>not downloaded</Text>
              </View>
            )}
          </View>

          <Text style={styles.modelName}>RMBG-1.4 · AI Background Remover</Text>
          <Text style={styles.modelNote}>
            {formatBytes(TOTAL_EXPECTED_BYTES)} total with runtime files included.
          </Text>

          <View style={styles.divider} />

          {isDownloading ? (
            <View style={styles.downloadContainer}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${percent}%` }]} />
              </View>

              <View style={styles.progressRow}>
                <Text style={styles.progressText}>
                  {download
                    ? `${formatBytes(download.bytesDownloaded)} / ${formatBytes(download.bytesTotal)}`
                    : 'Starting download...'}
                </Text>
                <Text style={styles.percentText}>{percent}%</Text>
              </View>

              {download?.currentFile ? (
                <Text style={styles.currentFileText}>Fetching {download.currentFile}</Text>
              ) : null}

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={engine.cancelDownload}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>Cancel Download</Text>
              </TouchableOpacity>
            </View>
          ) : isReady ? (
            <View style={styles.infoSection}>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Status</Text>
                <Text style={styles.rowValue}>Ready on device</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.row}>
                <Text style={styles.rowLabel}>On disk</Text>
                <Text style={styles.rowValue}>{formatBytes(status?.bytesOnDisk ?? 0)}</Text>
              </View>
              {status?.completedAt ? (
                <>
                  <View style={styles.divider} />
                  <View style={styles.row}>
                    <Text style={styles.rowLabel}>Downloaded</Text>
                    <Text style={styles.rowValue}>{formatDate(status.completedAt)}</Text>
                  </View>
                </>
              ) : null}

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleConfirmDelete}
                disabled={deleting}
                activeOpacity={0.8}
              >
                {deleting ? (
                  <ActivityIndicator color="#FF3B30" size="small" />
                ) : (
                  <Text style={styles.deleteButtonText}>Delete Model</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.downloadSection}>
              {isPartial ? (
                <Text style={styles.resumeNote}>
                  {formatBytes(status?.bytesOnDisk ?? 0)} downloaded so far. Resuming will pick up where it left off.
                </Text>
              ) : (
                <Text style={styles.resumeNote}>
                  Download the model once to perform background removals fully offline on your device.
                </Text>
              )}

              <TouchableOpacity
                style={styles.downloadButton}
                onPress={engine.startDownload}
                activeOpacity={0.85}
              >
                <Text style={styles.downloadButtonText}>
                  {isPartial ? 'Resume Download' : 'Download Model'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Working Resolution Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Working Resolution</Text>
          <Text style={styles.modelNote}>
            The resolution size the model operates on. Higher resolution provides finer edge details.
          </Text>

          <View style={styles.segmentedContainer}>
            {RESOLUTION_OPTIONS.map((item) => {
              const active = engine.resolution === item.size;
              return (
                <TouchableOpacity
                  key={item.size}
                  style={[styles.segmentButton, active ? styles.segmentActive : null]}
                  onPress={() => engine.setResolution(item.size)}
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
            <Text style={[styles.rowValue, { color: stateColor(engine.state) }]}>
              {engine.state}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Backend</Text>
            <Text style={styles.rowValue}>{engine.backend ?? 'Not initialized'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Last Inference</Text>
            <Text style={styles.rowValue}>
              {engine.lastInferenceMs !== null ? formatMs(engine.lastInferenceMs) : '—'}
            </Text>
          </View>

          {engine.error ? (
            <Text style={styles.errorBanner}>{engine.error.message}</Text>
          ) : null}

          <TouchableOpacity
            style={styles.restartButton}
            onPress={() => engine.restartEngine('settings')}
            activeOpacity={0.8}
          >
            <Text style={styles.restartButtonText}>Restart Engine</Text>
          </TouchableOpacity>
        </View>

        {/* About Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>About</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Version</Text>
            <Text style={styles.rowValue}>1.0.0</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Expo SDK</Text>
            <Text style={styles.rowValue}>54</Text>
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

function stateColor(state: string): string {
  switch (state) {
    case 'ready':
      return '#34C759';
    case 'processing':
    case 'downloading':
    case 'warming':
    case 'initializing':
      return '#007AFF';
    case 'download_failed':
    case 'engine_failed':
    case 'inference_failed':
    case 'inference_timeout':
      return '#FF3B30';
    default:
      return '#8E8E93';
  }
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
  badgeReadyText: {
    color: '#34C759',
    fontSize: 12,
    fontWeight: '600',
  },
  badgeDownloading: {
    backgroundColor: '#007AFF20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeDownloadingText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '600',
  },
  badgePartial: {
    backgroundColor: '#FF950020',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgePartialText: {
    color: '#FF9500',
    fontSize: 12,
    fontWeight: '600',
  },
  badgeAbsent: {
    backgroundColor: '#8E8E9320',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeAbsentText: {
    color: '#8E8E93',
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
  downloadContainer: {
    marginTop: 6,
    backgroundColor: 'transparent',
  },
  progressTrack: {
    height: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    backgroundColor: 'transparent',
  },
  progressText: {
    fontSize: 13,
    color: '#333333',
    fontWeight: '500',
  },
  percentText: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '600',
  },
  currentFileText: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 12,
  },
  cancelButton: {
    marginTop: 8,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '600',
  },
  downloadSection: {
    marginTop: 6,
    backgroundColor: 'transparent',
  },
  resumeNote: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 12,
    lineHeight: 18,
  },
  downloadButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  downloadButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  infoSection: {
    backgroundColor: 'transparent',
  },
  deleteButton: {
    marginTop: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#FF3B3015',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '600',
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
  errorBanner: {
    color: '#FF3B30',
    fontSize: 13,
    marginTop: 8,
  },
  restartButton: {
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
  },
  restartButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  privacyText: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
    marginTop: 4,
  },
});
