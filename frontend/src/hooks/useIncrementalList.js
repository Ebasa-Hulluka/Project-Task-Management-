import { useEffect, useState } from "react";

const useIncrementalList = (items = [], batchSize = 4, resetDeps = []) => {
  const [visibleCount, setVisibleCount] = useState(batchSize);

  useEffect(() => {
    setVisibleCount(batchSize);
  }, [batchSize, ...resetDeps]);

  const totalCount = items.length;
  const visibleItems = items.slice(0, visibleCount);
  const remainingCount = Math.max(totalCount - visibleItems.length, 0);

  const showMore = () => {
    setVisibleCount((current) => Math.min(current + batchSize, totalCount));
  };

  return {
    visibleItems,
    visibleCount: visibleItems.length,
    totalCount,
    remainingCount,
    hasMore: remainingCount > 0,
    showMore,
  };
};

export default useIncrementalList;
