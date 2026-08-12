import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Image, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import EmptyState from '@/components/EmptyState';
import { Text, View } from '@/components/Themed';
import { deleteGalleryPhotos, GalleryPhoto, getGalleryPhotos, subscribeGallery } from '@/lib/galleryStore';

const PADDING = 16;
const GAP = 8;
const COLUMNS = 3;

export default function GalleryScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [photos, setPhotos] = useState<GalleryPhoto[]>(getGalleryPhotos());
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const tileSize = Math.floor((width - PADDING * 2 - GAP * (COLUMNS - 1)) / COLUMNS);

  useEffect(() => {
    const unsubscribe = subscribeGallery(() => {
      const current = getGalleryPhotos();
      setPhotos([...current]);
      if (current.length === 0) {
        setIsSelecting(false);
        setSelectedIds(new Set());
      }
    });
    return unsubscribe;
  }, []);

  const toggleSelectMode = () => {
    if (isSelecting) {
      setIsSelecting(false);
      setSelectedIds(new Set());
    } else {
      setIsSelecting(true);
    }
  };

  const togglePhotoSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    Alert.alert(
      'Delete Photos',
      `Are you sure you want to delete ${selectedIds.size} photo${selectedIds.size > 1 ? 's' : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteGalleryPhotos(Array.from(selectedIds));
            setSelectedIds(new Set());
            setIsSelecting(false);
          },
        },
      ]
    );
  };

  const openViewer = (uri: string) => {
    router.push({
      pathname: '/viewer',
      params: { uri: encodeURIComponent(uri) },
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Gallery</Text>
        {photos.length > 0 ? (
          <TouchableOpacity onPress={toggleSelectMode} style={styles.selectButton}>
            <Text style={styles.selectButtonText}>{isSelecting ? 'Cancel' : 'Select'}</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {photos.length === 0 ? (
        <EmptyState
          title="No Cutouts Yet"
          message="Save a photo on the Create tab to see it here!"
        />
      ) : (
        <>
          <FlatList
            data={photos}
            keyExtractor={(item) => item.id}
            numColumns={COLUMNS}
            contentContainerStyle={styles.gridContainer}
            columnWrapperStyle={{ gap: GAP, marginBottom: GAP }}
            renderItem={({ item }) => {
              const isSelected = selectedIds.has(item.id);
              return (
                <TouchableOpacity
                  style={[styles.tile, { width: tileSize, height: tileSize }]}
                  onPress={() => {
                    if (isSelecting) {
                      togglePhotoSelection(item.id);
                    } else {
                      openViewer(item.uri);
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <Image source={{ uri: item.uri }} style={styles.thumbnail} resizeMode="cover" />
                  {isSelecting ? (
                    <View style={[styles.overlay, isSelected ? styles.selectedOverlay : null]}>
                      <Ionicons
                        name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                        size={24}
                        color={isSelected ? '#007AFF' : '#FFFFFF'}
                      />
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            }}
          />

          {isSelecting ? (
            <View style={styles.footerBar}>
              <TouchableOpacity
                style={[styles.deleteButton, selectedIds.size === 0 ? styles.deleteButtonDisabled : null]}
                onPress={handleDeleteSelected}
                disabled={selectedIds.size === 0}
              >
                <Ionicons name="trash-outline" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.deleteButtonText}>
                  Delete ({selectedIds.size})
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
    paddingHorizontal: PADDING,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  selectButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  selectButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  gridContainer: {
    paddingVertical: 8,
  },
  tile: {
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E5E5EA',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    padding: 6,
  },
  selectedOverlay: {
    backgroundColor: 'rgba(0, 122, 255, 0.25)',
  },
  footerBar: {
    position: 'absolute',
    bottom: 20,
    left: PADDING,
    right: PADDING,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3B30',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  deleteButtonDisabled: {
    backgroundColor: '#FF9992',
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
