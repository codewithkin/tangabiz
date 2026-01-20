// File Utilities for Tangabiz
// Handles file picking, image picking, and file uploads

import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

// Types
export interface PickedFile {
  uri: string;
  name: string;
  type: string;
  size: number;
}

export interface PickedImage {
  uri: string;
  width: number;
  height: number;
  type: string;
  fileName?: string;
  fileSize?: number;
  base64?: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

// Document Picker
export const pickDocument = async (options?: {
  type?: string[];
  multiple?: boolean;
}): Promise<PickedFile[] | null> => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: options?.type || ['*/*'],
      multiple: options?.multiple || false,
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      return null;
    }

    return result.assets.map((asset) => ({
      uri: asset.uri,
      name: asset.name,
      type: asset.mimeType || 'application/octet-stream',
      size: asset.size || 0,
    }));
  } catch (error) {
    console.error('Error picking document:', error);
    return null;
  }
};

// Image Picker - From Library
export const pickImage = async (options?: {
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
  base64?: boolean;
  multiple?: boolean;
}): Promise<PickedImage[] | null> => {
  try {
    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Media library permission denied');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: options?.allowsEditing ?? false,
      aspect: options?.aspect,
      quality: options?.quality ?? 0.8,
      base64: options?.base64 ?? false,
      allowsMultipleSelection: options?.multiple ?? false,
    });

    if (result.canceled) {
      return null;
    }

    return result.assets.map((asset) => ({
      uri: asset.uri,
      width: asset.width,
      height: asset.height,
      type: asset.mimeType || 'image/jpeg',
      fileName: asset.fileName,
      fileSize: asset.fileSize,
      base64: asset.base64,
    }));
  } catch (error) {
    console.error('Error picking image:', error);
    return null;
  }
};

// Image Picker - From Camera
export const takePhoto = async (options?: {
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
  base64?: boolean;
}): Promise<PickedImage | null> => {
  try {
    // Request camera permissions
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Camera permission denied');
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: options?.allowsEditing ?? false,
      aspect: options?.aspect,
      quality: options?.quality ?? 0.8,
      base64: options?.base64 ?? false,
    });

    if (result.canceled) {
      return null;
    }

    const asset = result.assets[0];
    return {
      uri: asset.uri,
      width: asset.width,
      height: asset.height,
      type: asset.mimeType || 'image/jpeg',
      fileName: asset.fileName,
      fileSize: asset.fileSize,
      base64: asset.base64,
    };
  } catch (error) {
    console.error('Error taking photo:', error);
    return null;
  }
};

// File System Utilities
export const FileUtils = {
  // Get file info
  getInfo: async (uri: string) => {
    try {
      const info = await FileSystem.getInfoAsync(uri);
      return info;
    } catch (error) {
      console.error('Error getting file info:', error);
      return null;
    }
  },

  // Read file as string
  readAsString: async (uri: string, encoding?: FileSystem.EncodingType) => {
    try {
      const content = await FileSystem.readAsStringAsync(uri, {
        encoding: encoding || FileSystem.EncodingType.UTF8,
      });
      return content;
    } catch (error) {
      console.error('Error reading file:', error);
      return null;
    }
  },

  // Write string to file
  writeString: async (uri: string, content: string) => {
    try {
      await FileSystem.writeAsStringAsync(uri, content);
      return true;
    } catch (error) {
      console.error('Error writing file:', error);
      return false;
    }
  },

  // Delete file
  delete: async (uri: string) => {
    try {
      await FileSystem.deleteAsync(uri, { idempotent: true });
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  },

  // Copy file
  copy: async (from: string, to: string) => {
    try {
      await FileSystem.copyAsync({ from, to });
      return true;
    } catch (error) {
      console.error('Error copying file:', error);
      return false;
    }
  },

  // Move file
  move: async (from: string, to: string) => {
    try {
      await FileSystem.moveAsync({ from, to });
      return true;
    } catch (error) {
      console.error('Error moving file:', error);
      return false;
    }
  },

  // Create directory
  createDirectory: async (uri: string) => {
    try {
      await FileSystem.makeDirectoryAsync(uri, { intermediates: true });
      return true;
    } catch (error) {
      console.error('Error creating directory:', error);
      return false;
    }
  },

  // List directory contents
  listDirectory: async (uri: string) => {
    try {
      const files = await FileSystem.readDirectoryAsync(uri);
      return files;
    } catch (error) {
      console.error('Error listing directory:', error);
      return [];
    }
  },

  // Get document directory
  getDocumentDirectory: () => FileSystem.documentDirectory,

  // Get cache directory
  getCacheDirectory: () => FileSystem.cacheDirectory,
};

// Upload file to server
export const uploadFile = async (
  uri: string,
  uploadUrl: string,
  options?: {
    fieldName?: string;
    headers?: Record<string, string>;
    parameters?: Record<string, string>;
    onProgress?: (progress: UploadProgress) => void;
  }
): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    // Get file info
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) {
      return { success: false, error: 'File does not exist' };
    }

    // Create upload task
    const uploadTask = FileSystem.createUploadTask(
      uploadUrl,
      uri,
      {
        fieldName: options?.fieldName || 'file',
        httpMethod: 'POST',
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        headers: options?.headers,
        parameters: options?.parameters,
      },
      (data) => {
        if (options?.onProgress && data.totalByteSent && data.totalBytesExpectedToSend) {
          options.onProgress({
            loaded: data.totalByteSent,
            total: data.totalBytesExpectedToSend,
            percentage: Math.round((data.totalByteSent / data.totalBytesExpectedToSend) * 100),
          });
        }
      }
    );

    const response = await uploadTask.uploadAsync();

    if (!response) {
      return { success: false, error: 'Upload failed' };
    }

    // Parse response body
    let data;
    try {
      data = JSON.parse(response.body);
    } catch {
      data = response.body;
    }

    if (response.status >= 200 && response.status < 300) {
      return { success: true, data };
    } else {
      return { success: false, error: data?.error || 'Upload failed', data };
    }
  } catch (error) {
    console.error('Error uploading file:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
};

// Download file from URL
export const downloadFile = async (
  url: string,
  filename: string,
  options?: {
    headers?: Record<string, string>;
    onProgress?: (progress: UploadProgress) => void;
  }
): Promise<{ success: boolean; uri?: string; error?: string }> => {
  try {
    const downloadDir = FileSystem.documentDirectory + 'downloads/';

    // Ensure download directory exists
    await FileSystem.makeDirectoryAsync(downloadDir, { intermediates: true });

    const fileUri = downloadDir + filename;

    // Create download resumable
    const downloadResumable = FileSystem.createDownloadResumable(
      url,
      fileUri,
      { headers: options?.headers },
      (data) => {
        if (options?.onProgress && data.totalBytesWritten && data.totalBytesExpectedToWrite) {
          options.onProgress({
            loaded: data.totalBytesWritten,
            total: data.totalBytesExpectedToWrite,
            percentage: Math.round(
              (data.totalBytesWritten / data.totalBytesExpectedToWrite) * 100
            ),
          });
        }
      }
    );

    const result = await downloadResumable.downloadAsync();

    if (result?.uri) {
      return { success: true, uri: result.uri };
    } else {
      return { success: false, error: 'Download failed' };
    }
  } catch (error) {
    console.error('Error downloading file:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Download failed',
    };
  }
};

// Format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Get file extension
export const getFileExtension = (filename: string): string => {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()?.toLowerCase() || '' : '';
};

// Check if file is an image
export const isImage = (filename: string): boolean => {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
  return imageExtensions.includes(getFileExtension(filename));
};

// Generate unique filename
export const generateUniqueFilename = (originalName: string): string => {
  const ext = getFileExtension(originalName);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}${ext ? '.' + ext : ''}`;
};
