import React from "react";

const ReactivateButton = ({ onClick, loading = false, className = "" }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`text-xs text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded transition-colors disabled:opacity-60 ${className}`}
    >
      {loading ? "Reactivating..." : "Reactivate"}
    </button>
  );
};

export default ReactivateButton;
