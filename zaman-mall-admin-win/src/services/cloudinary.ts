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

async function uploadFileToCloudinary(
  file: File,
  resourceType: CloudinaryResourceType
): Promise<string> {
  const { timestamp, signature, apiKey, cloudName } =
    await getCloudinarySignature(resourceType);
  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', apiKey);
  formData.append('timestamp', String(timestamp));
  formData.append('signature', signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
    { method: 'POST', body: formData }
  );
  const data = await response.json();

  if (data.secure_url) return data.secure_url;
  throw new Error(data.error?.message || 'Cloudinary upload failed.');
}

export const uploadToCloudinary = (file: File): Promise<string> =>
  uploadFileToCloudinary(file, 'image');

export const uploadVideoToCloudinary = (file: File): Promise<string> =>
  uploadFileToCloudinary(file, 'video');
