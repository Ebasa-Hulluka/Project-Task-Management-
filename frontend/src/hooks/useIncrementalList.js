import { useEffect, useState } from "react";

const alignBatchToColumns = (batchSize, columns) => {
  if (!columns || columns < 1) return batchSize;
  return Math.max(columns, Math.ceil(batchSize / columns) * columns);
};

const parseOptions = (batchSizeOrOptions, resetDeps) => {
  if (
    typeof batchSizeOrOptions === "object" &&
    batchSizeOrOptions !== null &&
    !Array.isArray(batchSizeOrOptions)
  ) {
    return {
      batchSize: batchSizeOrOptions.batchSize ?? 4,
      columns: batchSizeOrOptions.columns ?? null,
      resetDeps: resetDeps ?? [],
    };
  }

  return {
    batchSize: batchSizeOrOptions ?? 4,
    columns: null,
    resetDeps: resetDeps ?? [],
  };
};

/**
 * @param {Array} items
 * @param {number|{ batchSize?: number, columns?: number }} batchSizeOrOptions
 * @param {Array} resetDeps
 */
const useIncrementalList = (items = [], batchSizeOrOptions = 4, resetDeps = []) => {
  const { batchSize, columns, resetDeps: deps } = parseOptions(
    batchSizeOrOptions,
    resetDeps,
  );
  const alignedBatch = alignBatchToColumns(batchSize, columns);
  const initialCount = Math.min(alignedBatch, items.length);

  const [visibleCount, setVisibleCount] = useState(initialCount);

  useEffect(() => {
    setVisibleCount(Math.min(alignedBatch, items.length));
  }, [alignedBatch, items.length, ...deps]);

  const totalCount = items.length;
  const visibleItems = items.slice(0, visibleCount);
  const remainingCount = Math.max(totalCount - visibleItems.length, 0);

  const showMore = () => {
    setVisibleCount((current) => {
      const remaining = totalCount - current;
      if (remaining <= 0) return current;

      // Reveal leftover tasks that would leave a sparse row (e.g. 4 shown + 1 hidden in a 3-col grid)
      if (columns && remaining < columns) {
        return totalCount;
      }

      return Math.min(current + alignedBatch, totalCount);
    });
  };

  return {
    visibleItems,
    visibleCount: visibleItems.length,
    totalCount,
    remainingCount,
    hasMore: remainingCount > 0,
    showMore,
    batchSize: alignedBatch,
  };
};

export default useIncrementalList;
