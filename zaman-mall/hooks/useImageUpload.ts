import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { supabase } from '@/lib/supabase';

interface CloudinarySignature {
  timestamp: number;
  signature: string;
  apiKey: string;
  cloudName: string;
}

async function getCloudinarySignature(): Promise<CloudinarySignature> {
  const { data, error } = await supabase.functions.invoke<CloudinarySignature>(
    'cloudinary-signature',
    { body: { resourceType: 'image' } }
  );

  if (error) throw error;
  if (
    !data ||
    typeof data.timestamp !== 'number' ||
    !data.signature ||
    !data.apiKey ||
    !data.cloudName
  ) {
    throw new Error('Cloudinary signing service returned an invalid response.');
  }

  return data;
}

export const useImageUpload = () => {
  const [uploading, setUploading] = useState(false);

  const pickImage = async (options?: ImagePicker.ImagePickerOptions) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: true,
      ...options,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      return result.assets[0];
    }
    return null;
  };

  const uploadImage = async (imageUri: string, base64Data?: string | null) => {
    setUploading(true);
    try {
      let base64Image = base64Data;
      if (!base64Image) {
        base64Image = await FileSystem.readAsStringAsync(imageUri, {
          encoding: 'base64',
        });
      }

      const base64WithPrefix = base64Image.startsWith('data:')
        ? base64Image
        : `data:image/jpeg;base64,${base64Image}`;
      const { timestamp, signature, apiKey, cloudName } =
        await getCloudinarySignature();
      const formData = new FormData();
      formData.append('file', base64WithPrefix);
      formData.append('api_key', apiKey);
      formData.append('timestamp', String(timestamp));
      formData.append('signature', signature);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: 'POST', body: formData }
      );
      const data = await response.json();

      if (data.secure_url) return data.secure_url;
      throw new Error(data.error?.message || 'Failed to upload to Cloudinary');
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
