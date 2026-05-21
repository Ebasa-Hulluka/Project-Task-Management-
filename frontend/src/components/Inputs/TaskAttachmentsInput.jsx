import React, { useRef, useState } from "react";
import { HiMiniPlus, HiOutlineTrash } from "react-icons/hi2";
import { LuPaperclip, LuUpload, LuLink } from "react-icons/lu";
import { toast } from "react-hot-toast";

import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import {
  getAttachmentLabel,
  normalizeTaskAttachments,
  getErrorMessage,
} from "../../utils/helper";

/**
 * @param {Array<{url:string,name?:string,kind?:'link'|'file'}>} attachments
 * @param {(items: Array) => void} onChange
 * @param {boolean} readOnly
 * @param {string} helperText
 */
const TaskAttachmentsInput = ({
  attachments = [],
  onChange,
  readOnly = false,
  helperText = "Add reference links or upload files (PDF, DOC, images, etc.).",
}) => {
  const [linkInput, setLinkInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const safeAttachments = normalizeTaskAttachments(attachments);

  const handleAddLink = () => {
    const trimmed = linkInput.trim();
    if (!trimmed) return;

    try {
      const url = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
      new URL(url);
      onChange([
        ...safeAttachments,
        { url, name: getAttachmentLabel(url), kind: "link" },
      ]);
      setLinkInput("");
      toast.success("Link added");
    } catch {
      toast.error("Please enter a valid URL");
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file || readOnly) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File must be 10MB or less");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await axiosInstance.post(
        API_PATHS.TASKS.UPLOAD_ATTACHMENT,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );

      const uploaded = response.data;
      if (uploaded?.url) {
        onChange([
          ...safeAttachments,
          {
            url: uploaded.url,
            name: uploaded.name || file.name,
            kind: uploaded.kind || "file",
          },
        ]);
        toast.success("File uploaded");
      }
    } catch (error) {
      toast.error(getErrorMessage(error) || "Failed to upload file");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemove = (index) => {
    onChange(safeAttachments.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {safeAttachments.length > 0 && (
        <div className="space-y-2">
          {safeAttachments.map((item, index) => (
            <div
              key={`${item.url}-${index}`}
              className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {item.kind === "file" ? (
                  <LuPaperclip className="text-gray-400 shrink-0" />
                ) : (
                  <LuLink className="text-gray-400 shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {item.name || getAttachmentLabel(item.url)}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{item.url}</p>
                </div>
                <span className="text-[10px] uppercase tracking-wide text-gray-400 shrink-0">
                  {item.kind === "file" ? "File" : "Link"}
                </span>
              </div>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="p-1 hover:bg-white rounded"
                  aria-label="Remove attachment"
                >
                  <HiOutlineTrash className="text-red-500" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {!readOnly && (
        <>
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 border border-gray-200 rounded-lg px-3 bg-white focus-within:border-primary">
              <LuLink className="text-gray-400 shrink-0" />
              <input
                type="url"
                placeholder="Paste a link (repo, PDF URL, doc...)"
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddLink())}
                className="w-full text-sm py-2 outline-none bg-transparent"
              />
            </div>
            <button
              type="button"
              className="btn-outline text-nowrap px-3 py-2"
              onClick={handleAddLink}
              disabled={!linkInput.trim()}
            >
              <HiMiniPlus className="inline mr-1" />
              Add link
            </button>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full border-2 border-dashed border-gray-200 rounded-lg p-3 hover:border-primary hover:bg-primary/5 transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <span className="text-sm text-gray-600">Uploading...</span>
            ) : (
              <span className="flex items-center justify-center gap-2 text-sm text-gray-600">
                <LuUpload className="text-primary" />
                Upload file (max 10MB)
              </span>
            )}
          </button>
        </>
      )}

      <p className="text-xs text-gray-500">{helperText}</p>
    </div>
  );
};

export default TaskAttachmentsInput;
