import React from "react";
import { LuChevronDown } from "react-icons/lu";

const IncrementalListControls = ({
  visibleCount,
  totalCount,
  remainingCount,
  onShowMore,
  batchSize = 4,
  itemLabel = "items",
}) => {
  if (totalCount <= 0) return null;

  const nextBatchCount = Math.min(batchSize, remainingCount);
  const normalizedLabel = totalCount === 1 ? itemLabel.replace(/s$/, "") : itemLabel;

  return (
    <div className="mt-6 flex flex-col items-center gap-3">
      <p className="text-sm text-gray-500">
        Showing {visibleCount} of {totalCount} {normalizedLabel}
      </p>

      {remainingCount > 0 && (
        <button
          type="button"
          className="btn-outline flex items-center gap-2"
          onClick={onShowMore}
        >
          <LuChevronDown className="text-base" />
          See next {nextBatchCount}
        </button>
      )}
    </div>
  );
};

export default IncrementalListControls;
