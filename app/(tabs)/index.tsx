import React, { useState } from 'react';
import { Image, StyleSheet, TouchableOpacity } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import { Text, View } from '@/components/Themed';
import { addGalleryPhoto } from '@/lib/galleryStore';

export default function CreateScreen() {
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const pickImage = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      setErrorMessage('Permission to access photo library was denied. Please enable it in your device settings.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setSelectedImageUri(result.assets[0].uri);
    }
  };

  const handleSaveToGallery = () => {
    if (!selectedImageUri) return;
    const { isNew } = addGalleryPhoto(selectedImageUri);
    if (isNew) {
      setSuccessMessage('Saved to Gallery!');
    } else {
      setSuccessMessage('Already in Gallery!');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create</Text>

      <TouchableOpacity style={styles.button} onPress={pickImage} activeOpacity={0.8}>
        <Text style={styles.buttonText}>Select Photo</Text>
      </TouchableOpacity>

      {errorMessage ? (
        <Text style={styles.errorText}>{errorMessage}</Text>
      ) : null}

      {successMessage ? (
        <Text style={styles.successText}>{successMessage}</Text>
      ) : null}

      {selectedImageUri ? (
        <View style={styles.previewSection}>
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: selectedImageUri }} style={styles.imagePreview} resizeMode="contain" />
          </View>
          <TouchableOpacity style={styles.saveButton} onPress={handleSaveToGallery} activeOpacity={0.8}>
            <Text style={styles.saveButtonText}>Save to Gallery</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    textAlign: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
  },
  successText: {
    color: '#34C759',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  previewSection: {
    alignItems: 'center',
    width: '100%',
  },
  imagePreviewContainer: {
    marginTop: 10,
    width: 280,
    height: 280,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  saveButton: {
    backgroundColor: '#34C759',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginTop: 16,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
