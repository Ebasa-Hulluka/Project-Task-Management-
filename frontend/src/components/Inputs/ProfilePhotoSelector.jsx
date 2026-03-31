import React, { useRef, useState, useEffect } from "react";
import { LuUser, LuUpload, LuTrash, LuCamera } from "react-icons/lu";
import { toast } from "react-hot-toast";

const ProfilePhotoSelector = ({
  image,
  setImage,
  onUpload,
  onRemove,
  disabled = false,
}) => {
  const inputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleImageChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a valid image file (JPEG, PNG, GIF, WEBP)");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size must be less than 2MB");
      return;
    }

    // Create preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setImage(file);

    // Auto upload if callback provided
    if (onUpload) {
      setUploading(true);
      try {
        await onUpload(file);
      } catch {
        toast.error("Failed to upload image");
      } finally {
        setUploading(false);
      }
    }

    toast.success("Image selected successfully");
  };

  const handleRemoveImage = () => {
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setImage(null);
    setPreviewUrl(null);
    if (onRemove) {
      onRemove();
    }
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    toast.success("Image removed");
  };

  const onChooseFile = () => {
    if (!disabled && !uploading) {
      inputRef.current?.click();
    }
  };

  return (
    <div className="flex flex-col items-center mb-6">
      {/* Hidden file input */}
      <input
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        ref={inputRef}
        onChange={handleImageChange}
        className="hidden"
        disabled={disabled || uploading}
      />

      {/* Photo Container */}
      <div className="relative group">
        {/* Photo Display */}
        <div className="relative">
          {previewUrl || image ? (
            <img
              src={previewUrl || (typeof image === "string" ? image : null)}
              alt="profile"
              className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 border-4 border-white shadow-lg flex items-center justify-center">
              <LuUser className="text-4xl text-primary/60" />
            </div>
          )}

          {/* Upload Overlay */}
          {!disabled && !uploading && (
            <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                type="button"
                onClick={onChooseFile}
                className="text-white hover:scale-110 transition-transform"
              >
                <LuCamera className="text-2xl" />
              </button>
            </div>
          )}

          {/* Uploading Spinner */}
          {uploading && (
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {!disabled && !uploading && (previewUrl || image) && (
          <div className="absolute -bottom-2 -right-2 flex gap-1">
            <button
              type="button"
              onClick={onChooseFile}
              className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center shadow-md hover:bg-primary-dark transition-colors"
              title="Change photo"
            >
              <LuUpload className="text-sm" />
            </button>
            <button
              type="button"
              onClick={handleRemoveImage}
              className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 transition-colors"
              title="Remove photo"
            >
              <LuTrash className="text-sm" />
            </button>
          </div>
        )}

        {/* Add Button (when no image) */}
        {!disabled && !uploading && !previewUrl && !image && (
          <button
            type="button"
            onClick={onChooseFile}
            className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center shadow-md hover:bg-primary-dark transition-colors"
            title="Add photo"
          >
            <LuUpload className="text-sm" />
          </button>
        )}
      </div>

      {/* Helper Text */}
      <p className="text-xs app-text-muted mt-3 font-medium">
        Click {previewUrl || image ? "the camera" : "the + button"} to{" "}
        {previewUrl || image ? "change" : "upload"} your photo
      </p>
      <p className="text-xs app-text-muted font-medium">JPEG, PNG, GIF, WEBP (max 2MB)</p>
    </div>
  );
};

export default ProfilePhotoSelector;
