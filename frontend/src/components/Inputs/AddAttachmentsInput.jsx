import React, { useState, useRef } from "react";
import { HiMiniPlus, HiOutlineTrash, HiOutlineDocument } from "react-icons/hi2";
import { LuPaperclip, LuUpload, LuX } from "react-icons/lu";
import { toast } from "react-hot-toast";

const AddAttachmentsInput = ({ attachments = [], onChange }) => {
  const [option, setOption] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Function to handle adding a link
  const handleAddLink = () => {
    if (option.trim()) {
      // Validate URL
      try {
        new URL(option.trim());
        const newAttachments = [...attachments, option.trim()];
        onChange(newAttachments);
        setOption("");
        toast.success("Link added successfully");
      } catch {
        toast.error("Please enter a valid URL");
      }
    }
  };

  // Function to handle file upload
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setUploading(true);

    // Simulate upload - replace with actual upload logic
    try {
      // This would be replaced with actual API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Mock uploaded file URL
      const mockFileUrl = URL.createObjectURL(file);
      const newAttachments = [...attachments, mockFileUrl];
      onChange(newAttachments);
      toast.success("File uploaded successfully");
    } catch {
      toast.error("Failed to upload file");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Function to handle deleting an attachment
  const handleDeleteAttachment = (index) => {
    const updatedArr = attachments.filter((_, idx) => idx !== index);

    // Cleanup object URL if it's a blob
    if (attachments[index]?.startsWith("blob:")) {
      URL.revokeObjectURL(attachments[index]);
    }

    onChange(updatedArr);
    toast.success("Attachment removed");
  };

  // Get file name from URL or path
  const getFileName = (url) => {
    if (url.startsWith("blob:")) return "Uploaded file";
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      return pathname.split("/").pop() || url;
    } catch {
      return url;
    }
  };

  return (
    <div className="space-y-4">
      {/* Existing Attachments List */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-500">
            Attachments ({attachments.length})
          </label>
          <div className="space-y-2">
            {attachments.map((item, index) => (
              <div
                key={`${item}-${index}`}
                className="flex items-center justify-between bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors group"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <HiOutlineDocument className="text-gray-400 text-lg shrink-0" />
                  <p className="text-xs text-gray-700 truncate" title={item}>
                    {getFileName(item)}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <a
                    href={item}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 hover:bg-white rounded transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <LuPaperclip className="text-gray-400 hover:text-primary text-sm" />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDeleteAttachment(index)}
                    className="p-1 hover:bg-white rounded transition-colors"
                  >
                    <HiOutlineTrash className="text-lg text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add New Attachment */}
      <div className="space-y-3">
        {/* Link Input */}
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-3 border border-gray-200 rounded-lg px-3 bg-white focus-within:border-primary transition-colors">
            <LuPaperclip className="text-gray-400" />
            <input
              type="url"
              placeholder="Add file link (URL)"
              value={option}
              onChange={({ target }) => setOption(target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAddLink()}
              className="w-full text-sm text-gray-700 outline-none bg-transparent py-2.5"
            />
          </div>
          <button
            type="button"
            className="btn-outline text-nowrap px-4 py-2.5"
            onClick={handleAddLink}
            disabled={!option.trim()}
          >
            <HiMiniPlus className="text-lg mr-1" /> Add Link
          </button>
        </div>

        {/* File Upload */}
        <div className="relative">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx,.txt"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full border-2 border-dashed border-gray-200 rounded-lg p-4 hover:border-primary hover:bg-primary/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-gray-600">Uploading...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <LuUpload className="text-primary text-lg" />
                <span className="text-sm text-gray-600">
                  Click to upload file (max 5MB)
                </span>
              </div>
            )}
          </button>
        </div>

        {/* Help Text */}
        <p className="text-xs text-gray-400">
          Supported formats: Images, PDF, DOC, XLS, TXT (max 5MB)
        </p>
      </div>
    </div>
  );
};

export default AddAttachmentsInput;
