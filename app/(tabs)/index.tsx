import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

import { Checkerboard } from '@/components/Checkerboard';
import { Text, View } from '@/components/Themed';
import { addGalleryPhoto } from '@/lib/galleryStore';
import { ProcessResult, useEngine } from '@/src/lib/engine';
import { formatMs } from '@/src/lib/format';
import {
  PermissionDenied,
  pickFromCamera,
  pickFromLibrary,
  prepareForInference,
  PickedImage,
} from '@/src/lib/imagePrep';

export default function CreateScreen() {
  const engine = useEngine();
  const router = useRouter();

  const [picked, setPicked] = useState<PickedImage | null>(null);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [resultUri, setResultUri] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const runningRef = useRef(false);
  const processing = engine.state === 'processing';
  const modelMissing = engine.modelStatus ? engine.modelStatus.phase !== 'ready' : false;
  const canProcess = engine.state === 'ready' && !!picked && !preparing && !processing;
  const statusHint = getEngineStatusHint(engine.state, engine.modelStatus?.phase);

  const { refreshModelStatus } = engine;
  useFocusEffect(
    useCallback(() => {
      void refreshModelStatus();
    }, [refreshModelStatus])
  );

  const reset = () => {
    setPicked(null);
    setResult(null);
    setResultUri(null);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handlePickImage = async (source: 'library' | 'camera') => {
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const image = source === 'library' ? await pickFromLibrary() : await pickFromCamera();
      if (!image) return;
      setPicked(image);
      setResult(null);
      setResultUri(null);
    } catch (e) {
      setErrorMessage(e instanceof PermissionDenied ? e.message : 'Could not open photo.');
    }
  };

  const handleRemoveBackground = async () => {
    if (!picked || runningRef.current) return;
    runningRef.current = true;
    setErrorMessage(null);
    setSuccessMessage(null);

    if (modelMissing) {
      setErrorMessage('The model is not downloaded on this device yet.');
      router.push('/settings');
      runningRef.current = false;
      return;
    }

    try {
      setPreparing(true);
      const prepared = await prepareForInference(picked);
      setPreparing(false);

      const outcome = await engine.process(prepared.base64, prepared.mimeType);

      const dataUri = `data:image/png;base64,${outcome.pngBase64}`;
      setResult(outcome);
      setResultUri(dataUri);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setErrorMessage(msg || 'Background removal failed.');
    } finally {
      setPreparing(false);
      runningRef.current = false;
    }
  };

  const handleSaveToGallery = () => {
    const targetUri = resultUri || picked?.uri;
    if (!targetUri) return;

    const { isNew } = addGalleryPhoto(targetUri);
    if (isNew) {
      setSuccessMessage('Cutout saved to Gallery!');
    } else {
      setSuccessMessage('Already saved in Gallery!');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Create</Text>

        {modelMissing ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Model Required</Text>
            <Text style={styles.cardText}>
              Background removal runs offline on your device, but requires downloading the model first (~176 MB).
            </Text>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => router.push('/settings')}
              activeOpacity={0.8}
            >
              <Text style={styles.settingsButtonText}>Go to Settings to Download</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : null}

        {successMessage ? (
          <Text style={styles.successText}>{successMessage}</Text>
        ) : null}

        {!picked ? (
          <View style={styles.pickerSection}>
            <Text style={styles.pickerTitle}>Choose an Image</Text>
            <Text style={styles.pickerSubtitle}>
              Select a photo from your library or take a new one to remove its background.
            </Text>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => handlePickImage('library')}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryButtonText}>Select Photo from Library</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => handlePickImage('camera')}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>Take Photo with Camera</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.workSection}>
            {result && resultUri ? (
              /* Result view with Checkerboard */
              <View style={styles.canvasContainer}>
                <Checkerboard style={styles.canvas}>
                  <Image source={{ uri: resultUri }} style={styles.imagePreview} resizeMode="contain" />
                </Checkerboard>
              </View>
            ) : (
              /* Input photo preview view */
              <View style={styles.canvasContainer}>
                <View style={styles.canvas}>
                  <Image source={{ uri: picked.uri }} style={styles.imagePreview} resizeMode="contain" />

                  {(processing || preparing) ? (
                    <View style={styles.processingOverlay}>
                      <ActivityIndicator size="large" color="#FFFFFF" />
                      <Text style={styles.processingTitle}>
                        {preparing ? 'Preparing image...' : 'Removing background...'}
                      </Text>
                      <Text style={styles.processingSubtitle}>
                        Usually takes ~8 seconds on device
                      </Text>
                      {engine.progress ? (
                        <Text style={styles.stageText}>
                          {engine.progress.stage}
                          {engine.progress.detail ? ` · ${engine.progress.detail}` : ''}
                        </Text>
                      ) : null}
                    </View>
                  ) : null}
                </View>
              </View>
            )}

            {/* Controls and Stats */}
            {result ? (
              <View style={styles.resultDetails}>
                <Text style={styles.metricsHeader}>Background Removed!</Text>
                <Text style={styles.metricText}>
                  Inference time: {formatMs(result.inferenceMs)} ({result.backend})
                </Text>
                <Text style={styles.metricSubtext}>
                  Total time: {formatMs(result.totalMs)} · {result.width}×{result.height}px
                </Text>

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.primaryButton, { flex: 1, marginRight: 8 }]}
                    onPress={handleSaveToGallery}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.primaryButtonText}>Save to Gallery</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.secondaryButton, { flex: 1, marginLeft: 8 }]}
                    onPress={reset}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.secondaryButtonText}>New Photo</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.actionSection}>
                <TouchableOpacity
                  style={[styles.primaryButton, !canProcess ? styles.disabledButton : null]}
                  onPress={() => {
                    if (!canProcess) {
                      if (modelMissing || engine.state === 'cold' || engine.state.endsWith('_failed')) {
                        router.push('/settings');
                      }
                      return;
                    }
                    handleRemoveBackground();
                  }}
                  activeOpacity={canProcess ? 0.85 : 0.9}
                >
                  {processing || preparing ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Remove Background</Text>
                  )}
                </TouchableOpacity>

                {statusHint ? (
                  <TouchableOpacity
                    style={styles.statusHintContainer}
                    onPress={() => {
                      if (modelMissing || engine.state === 'cold' || engine.state.endsWith('_failed')) {
                        router.push('/settings');
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.statusHintText}>{statusHint}</Text>
                  </TouchableOpacity>
                ) : null}

                <TouchableOpacity
                  style={styles.textButton}
                  onPress={reset}
                  disabled={processing || preparing}
                  activeOpacity={0.7}
                >
                  <Text style={styles.textButtonText}>Pick a Different Photo</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function getEngineStatusHint(state: string, modelPhase?: string): string | null {
  if (modelPhase === 'absent' || modelPhase === 'partial') {
    return 'model not downloaded — go to Settings';
  }
  switch (state) {
    case 'downloading':
      return 'downloading model…';
    case 'initializing':
      return 'starting engine…';
    case 'warming':
      return 'engine warming up…';
    case 'processing':
      return 'already working…';
    case 'download_failed':
      return 'download failed — go to Settings';
    case 'engine_failed':
    case 'inference_failed':
    case 'inference_timeout':
      return 'engine needs restart — go to Settings';
    case 'cold':
      return 'model not downloaded — go to Settings';
    case 'ready':
      return null;
    default:
      return 'engine not ready';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  card: {
    backgroundColor: 'rgba(255, 149, 0, 0.08)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.2)',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF9500',
    marginBottom: 4,
  },
  cardText: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
    marginBottom: 12,
  },
  settingsButton: {
    backgroundColor: '#FF9500',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  settingsButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  pickerSection: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 30,
  },
  pickerTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  pickerSubtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 10,
    lineHeight: 20,
  },
  workSection: {
    width: '100%',
    alignItems: 'center',
  },
  canvasContainer: {
    width: 300,
    height: 300,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    marginBottom: 20,
  },
  canvas: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  processingTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  processingSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginTop: 4,
  },
  stageText: {
    color: '#007AFF',
    fontSize: 12,
    marginTop: 10,
    fontWeight: '500',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  statusHintContainer: {
    marginTop: -4,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  statusHintText: {
    color: '#FF9500',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  textButton: {
    paddingVertical: 10,
  },
  textButtonText: {
    color: '#666666',
    fontSize: 14,
  },
  resultDetails: {
    width: '100%',
    alignItems: 'center',
  },
  metricsHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: '#34C759',
    marginBottom: 6,
  },
  metricText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 2,
  },
  metricSubtext: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 20,
  },
  actionRow: {
    flexDirection: 'row',
    width: '100%',
  },
  actionSection: {
    width: '100%',
    alignItems: 'center',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  successText: {
    color: '#34C759',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
});
