// Cloudinary Configuration
const CLOUD_NAME = "dkdzuyjc4";
const API_KEY = "564326378191971";
const API_SECRET = "u1nMvE6mYBeJu7PWRbMUQCeFiQA";
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
const CLOUDINARY_VIDEO_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`;

/**
 * Generate SHA1 hash for Cloudinary signature
 * @param str - String to hash
 * @returns SHA1 hash
 */
async function generateSHA1(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Upload an image to Cloudinary
 * @param file - The file to upload
 * @returns The secure URL of the uploaded image
 */
export const uploadToCloudinary = async (file: File): Promise<string> => {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000).toString();
    
    // Generate signature for signed upload
    const stringToSign = `timestamp=${timestamp}${API_SECRET}`;
    const signature = await generateSHA1(stringToSign);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', API_KEY);
    formData.append('timestamp', timestamp);
    formData.append('signature', signature);

    console.log('Uploading to Cloudinary...', { fileName: file.name, fileSize: file.size });

    const response = await fetch(CLOUDINARY_URL, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    console.log('Cloudinary response:', data);

    if (data.secure_url) {
      console.log('Successfully uploaded to Cloudinary:', data.secure_url);
      return data.secure_url;
    } else {
      throw new Error(data.error?.message || 'Failed to upload to Cloudinary');
    }
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
};

/**
 * Upload a video to Cloudinary
 * @param file - The video file to upload
 * @returns The secure URL of the uploaded video
 */
export const uploadVideoToCloudinary = async (file: File): Promise<string> => {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000).toString();
    
    // Generate signature for signed upload
    const stringToSign = `timestamp=${timestamp}${API_SECRET}`;
    const signature = await generateSHA1(stringToSign);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', API_KEY);
    formData.append('timestamp', timestamp);
    formData.append('signature', signature);

    const response = await fetch(CLOUDINARY_VIDEO_URL, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (data.secure_url) {
      return data.secure_url;
    } else {
      throw new Error(data.error?.message || 'Failed to upload video to Cloudinary');
    }
  } catch (error) {
    console.error('Error uploading video to Cloudinary:', error);
    throw error;
  }
};

/**
 * Convert a base64 string to a File object
 * @param base64String - The base64 string
 * @param filename - The filename for the file
 * @returns A File object
 */
export const base64ToFile = (base64String: string, filename: string = 'image.jpg'): File => {
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

/**
 * Check if a string is a base64 data URL
 * @param str - The string to check
 * @returns True if the string is a base64 data URL
 */
export const isBase64 = (str: string): boolean => {
  return str.startsWith('data:');
};

/**
 * Upload an image to Cloudinary if it's base64, otherwise return the URL
 * @param imageOrUrl - Either a base64 string or a URL
 * @param filename - Optional filename for the upload
 * @returns The Cloudinary URL or the original URL
 */
export const ensureCloudinaryUrl = async (imageOrUrl: string, filename?: string): Promise<string> => {
  if (!imageOrUrl) return '';
  
  // If it's already a URL (not base64), return as is
  if (!isBase64(imageOrUrl)) {
    return imageOrUrl;
  }
  
  // If it's base64, upload to Cloudinary
  try {
    const file = base64ToFile(imageOrUrl, filename);
    return await uploadToCloudinary(file);
  } catch (error) {
    console.error('Failed to upload base64 image to Cloudinary:', error);
    // Return original base64 as fallback
    return imageOrUrl;
  }
};
