import React, { useEffect } from "react";
import { LuX } from "react-icons/lu";

const Modal = ({
  children,
  isOpen,
  onClose,
  title,
  size = "md",
  showCloseButton = true,
  closeOnClickOutside = true,
  preventScroll = true,
}) => {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (preventScroll && isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, preventScroll]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Size classes
  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-2xl",
    lg: "max-w-4xl",
    xl: "max-w-6xl",
    full: "max-w-[95vw]",
  };

  const handleBackdropClick = (e) => {
    if (closeOnClickOutside && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div
        className={`
          relative bg-white rounded-xl shadow-xl w-full ${sizeClasses[size]}
          animate-fadeIn max-h-[90vh] flex flex-col
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-5 border-b border-gray-200 shrink-0">
            {title && (
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors ml-auto"
                aria-label="Close modal"
              >
                <LuX className="text-xl text-gray-500" />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
};

// Confirmation Modal Component
export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "info",
  loading = false,
}) => {
  const getTypeStyles = () => {
    switch (type) {
      case "danger":
        return {
          icon: <LuAlertTriangle className="text-red-600 text-2xl" />,
          confirmBtn: "bg-red-600 hover:bg-red-700",
          iconBg: "bg-red-100",
        };
      case "warning":
        return {
          icon: <LuAlertTriangle className="text-yellow-600 text-2xl" />,
          confirmBtn: "bg-yellow-600 hover:bg-yellow-700",
          iconBg: "bg-yellow-100",
        };
      default:
        return {
          icon: <LuAlertTriangle className="text-blue-600 text-2xl" />,
          confirmBtn: "bg-primary hover:bg-primary-dark",
          iconBg: "bg-blue-100",
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" showCloseButton={false}>
      <div className="text-center">
        <div
          className={`w-16 h-16 mx-auto mb-4 ${styles.iconBg} rounded-full flex items-center justify-center`}
        >
          {styles.icon}
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 mb-6">{message}</p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 ${styles.confirmBtn}`}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processing...
              </div>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

// Slide-in Panel Modal
export const SlidePanel = ({
  children,
  isOpen,
  onClose,
  title,
  position = "right",
  size = "md",
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const positionClasses = {
    right: "right-0 translate-x-0",
    left: "left-0 -translate-x-0",
  };

  const sizeClasses = {
    sm: "w-80",
    md: "w-96",
    lg: "w-[32rem]",
    xl: "w-[48rem]",
    full: "w-screen",
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`
          fixed top-0 h-full bg-white shadow-xl z-50
          transition-transform duration-300 ease-in-out
          ${positionClasses[position]} ${sizeClasses[size]}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LuX className="text-xl text-gray-500" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4">{children}</div>
        </div>
      </div>
    </>
  );
};

export default Modal;
