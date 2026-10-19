const CLOUD_NAME = 'dkdzuyjc4';
const API_KEY = '564326378191971';
const API_SECRET = 'u1nMvE6mYBeJu7PWRbMUQCeFiQA';
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
const CLOUDINARY_VIDEO_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`;

async function generateSHA1(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export const uploadToCloudinary = async (file: File): Promise<string> => {
  const timestamp = Math.round(new Date().getTime() / 1000).toString();
  const stringToSign = `timestamp=${timestamp}${API_SECRET}`;
  const signature = await generateSHA1(stringToSign);

  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', API_KEY);
  formData.append('timestamp', timestamp);
  formData.append('signature', signature);

  const response = await fetch(CLOUDINARY_URL, { method: 'POST', body: formData });
  const data = await response.json();

  if (data.secure_url) return data.secure_url;
  throw new Error(data.error?.message || 'Failed to upload to Cloudinary');
};

export const uploadVideoToCloudinary = async (file: File): Promise<string> => {
  const timestamp = Math.round(new Date().getTime() / 1000).toString();
  const stringToSign = `timestamp=${timestamp}${API_SECRET}`;
  const signature = await generateSHA1(stringToSign);

  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', API_KEY);
  formData.append('timestamp', timestamp);
  formData.append('signature', signature);

  const response = await fetch(CLOUDINARY_VIDEO_URL, { method: 'POST', body: formData });
  const data = await response.json();

  if (data.secure_url) return data.secure_url;
  throw new Error(data.error?.message || 'Failed to upload video');
};
