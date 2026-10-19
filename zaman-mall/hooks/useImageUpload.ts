import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import CryptoJS from 'crypto-js';

// Cloudinary Credentials
const CLOUD_NAME = "dkdzuyjc4";
const API_KEY = "564326378191971";
const API_SECRET = "u1nMvE6mYBeJu7PWRbMUQCeFiQA";
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

export const useImageUpload = () => {
  const [uploading, setUploading] = useState(false);

  const pickImage = async (options?: ImagePicker.ImagePickerOptions) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: true, // We keep base64 true to easily send to Cloudinary
      ...options,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      return result.assets[0];
    }
    return null;
  };

  const uploadImage = async (imageUri: string, base64Data?: string | null) => {
    try {
      setUploading(true);
      
      let base64Image = base64Data;
      if (!base64Image) {
        base64Image = await FileSystem.readAsStringAsync(imageUri, {
          encoding: 'base64',
        });
      }

      // Add the data URI prefix if it's missing
      const base64WithPrefix = base64Image?.startsWith('data:') 
        ? base64Image 
        : `data:image/jpeg;base64,${base64Image}`;

      const timestamp = Math.round(new Date().getTime() / 1000).toString();
      
      // Generate Cloudinary signature for signed upload
      const stringToSign = `timestamp=${timestamp}${API_SECRET}`;
      const signature = CryptoJS.SHA1(stringToSign).toString();

      const formData = new FormData();
      formData.append('file', base64WithPrefix);
      formData.append('api_key', API_KEY);
      formData.append('timestamp', timestamp);
      formData.append('signature', signature);

      const response = await fetch(CLOUDINARY_URL, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.secure_url) {
        return data.secure_url;
      } else {
        throw new Error(data.error?.message || 'Failed to upload to Cloudinary');
      }
    } catch (error) {
      console.error('Error uploading image to Cloudinary:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  return {
    pickImage,
    uploadImage,
    uploading,
  };
};
