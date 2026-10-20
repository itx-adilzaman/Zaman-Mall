import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from './supabase';

type CloudinaryResourceType = 'image' | 'video';

interface CloudinarySignature {
  timestamp: number;
  signature: string;
  apiKey: string;
  cloudName: string;
}

async function getCloudinarySignature(
  resourceType: CloudinaryResourceType
): Promise<CloudinarySignature> {
  const { data, error } = await supabase.functions.invoke<CloudinarySignature>(
    'cloudinary-signature',
    { body: { resourceType } }
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

async function uploadToCloudinary(
  uri: string,
  resourceType: CloudinaryResourceType
): Promise<string> {
  const { timestamp, signature, apiKey, cloudName } =
    await getCloudinarySignature(resourceType);
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const extension = uri.split('.').pop()?.toLowerCase();
  const mimeType =
    resourceType === 'video'
      ? `video/${extension || 'mp4'}`
      : extension === 'jpg'
        ? 'image/jpeg'
        : `image/${extension || 'jpg'}`;
  const dataUri = `data:${mimeType};base64,${base64}`;
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        file: dataUri,
        api_key: apiKey,
        timestamp,
        signature,
      }),
    }
  );
  const data = await response.json();

  if (data.secure_url) return data.secure_url;
  throw new Error(data.error?.message || 'Cloudinary upload failed.');
}

export function uploadImageToCloudinary(uri: string): Promise<string> {
  return uploadToCloudinary(uri, 'image');
}

export function uploadVideoToCloudinary(uri: string): Promise<string> {
  return uploadToCloudinary(uri, 'video');
}
