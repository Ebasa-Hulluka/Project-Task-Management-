import { API_PATHS } from "./apiPaths";
import axiosInstance from "./axiosInstance";

/**
 * Upload an image file to the server
 * @param {File} imageFile - The image file to upload
 * @param {Function} onProgress - Optional progress callback
 * @returns {Promise} - Promise with the response data
 */
const uploadImage = async (imageFile, onProgress) => {
  if (!imageFile) {
    throw new Error("No image file provided");
  }

  // Validate file type
  const validTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];
  if (!validTypes.includes(imageFile.type)) {
    throw new Error(
      "Invalid file type. Please upload a JPEG, PNG, GIF, or WEBP image.",
    );
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (imageFile.size > maxSize) {
    throw new Error("File size too large. Maximum size is 5MB.");
  }

  const formData = new FormData();
  formData.append("profileImage", imageFile); // Field name should match backend expectation

  try {
    const response = await axiosInstance.post(
      API_PATHS.IMAGE.UPLOAD_IMAGE,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total,
            );
            onProgress(percentCompleted);
          }
        },
      },
    );

    // The backend returns { success: true, imageUrl: "url" } or { imageUrl: "url" }
    return {
      success: true,
      imageUrl: response.data.imageUrl || response.data.url,
      data: response.data,
    };
  } catch (error) {
    console.error("Error uploading the image:", error);

    // Extract error message from response if available
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to upload image";

    throw new Error(errorMessage);
  }
};

/**
 * Upload multiple images
 * @param {File[]} imageFiles - Array of image files
 * @param {Function} onProgress - Progress callback for each file
 * @returns {Promise} - Promise with array of results
 */
export const uploadMultipleImages = async (imageFiles, onProgress) => {
  if (!imageFiles || !imageFiles.length) {
    throw new Error("No image files provided");
  }

  const results = [];

  for (let i = 0; i < imageFiles.length; i++) {
    try {
      const result = await uploadImage(imageFiles[i], (progress) => {
        if (onProgress) {
          onProgress(i, imageFiles.length, progress);
        }
      });
      results.push({
        success: true,
        file: imageFiles[i].name,
        imageUrl: result.imageUrl,
      });
    } catch (error) {
      results.push({
        success: false,
        file: imageFiles[i].name,
        error: error.message,
      });
    }
  }

  return results;
};

/**
 * Get image URL (handles both full URLs and relative paths)
 * @param {string} imageUrl - The image URL or path
 * @returns {string} - Full image URL
 */
export const getImageUrl = (imageUrl) => {
  if (!imageUrl) return null;

  // If it's already a full URL, return as is
  if (imageUrl.startsWith("http")) {
    return imageUrl;
  }

  // Otherwise, prepend the base URL
  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
  return `${baseUrl}${imageUrl}`;
};

export default uploadImage;
