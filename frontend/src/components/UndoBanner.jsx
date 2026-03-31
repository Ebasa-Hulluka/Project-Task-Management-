import React from "react";

const UndoBanner = ({ message, onUndoClick }) => {
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-center">
      <p className="text-sm text-amber-900">{message}</p>
      <button
        type="button"
        onClick={onUndoClick}
        className="mt-2 inline-flex items-center justify-center rounded-md border border-amber-400 bg-amber-200 px-3 py-1.5 text-sm font-semibold text-amber-900 transition hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-1"
      >
        Undo Deletion
      </button>
    </div>
  );
};

export default UndoBanner;
