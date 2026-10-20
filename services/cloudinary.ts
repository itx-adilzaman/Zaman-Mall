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

export const base64ToFile = (
  base64String: string,
  filename: string = 'image.jpg'
): File => {
  const arr = base64String.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

export const isBase64 = (str: string): boolean => str.startsWith('data:');

export const ensureCloudinaryUrl = async (
  imageOrUrl: string,
  filename?: string
): Promise<string> => {
  if (!imageOrUrl) return '';
  if (!isBase64(imageOrUrl)) return imageOrUrl;

  try {
    const file = base64ToFile(imageOrUrl, filename);
    return await uploadToCloudinary(file);
  } catch (error) {
    console.error('Failed to upload base64 image to Cloudinary:', error);
    return imageOrUrl;
  }
};
