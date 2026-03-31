import React from "react";
import { LuTriangleAlert, LuTrash2, LuX } from "react-icons/lu";

const DeleteAlert = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Delete",
  message = "Are you sure you want to delete this item? This action cannot be undone.",
  itemName = "",
  loading = false,
  confirmLabel = "Delete",
  confirmDisabled = false,
  children = null,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <LuTriangleAlert className="text-red-600 text-xl" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={loading}
          >
            <LuX className="text-xl text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          <p className="text-gray-600 mb-2">{message}</p>
          {itemName && (
            <p className="text-sm font-medium text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-200">
              "{itemName}"
            </p>
          )}
          {children && <div className="mt-4">{children}</div>}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading || confirmDisabled}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Deleting...
              </>
            ) : (
              <>
                <LuTrash2 className="text-lg" />
                {confirmLabel}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Compact version for inline use
export const InlineDeleteAlert = ({ onConfirm, onCancel, loading = false }) => {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <p className="text-sm text-red-800 mb-3">
        Are you sure you want to delete this?
      </p>
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-sm text-gray-600 hover:bg-white rounded transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="px-3 py-1.5 text-sm text-white bg-red-600 rounded hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-1"
        >
          {loading ? (
            <>
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Deleting...
            </>
          ) : (
            <>
              <LuTrash2 />
              Delete
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default DeleteAlert;
