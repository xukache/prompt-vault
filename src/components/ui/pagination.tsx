"use client";

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  EllipsisHorizontalIcon,
} from "@heroicons/react/24/outline";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  showPageSizeSelector?: boolean;
  pageSizeOptions?: number[];
  className?: string;
}

export const Pagination = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  showPageSizeSelector = true,
  pageSizeOptions = [10, 20, 50, 100],
  className = "",
}: PaginationProps) => {
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // 生成页码数组
  const generatePageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 7;

    if (totalPages <= maxVisiblePages) {
      // 如果总页数小于等于最大显示页数，显示所有页码
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // 复杂的页码显示逻辑
      if (currentPage <= 4) {
        // 当前页在前面
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        // 当前页在后面
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // 当前页在中间
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const pageNumbers = generatePageNumbers();

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handlePageClick = (page: number | string) => {
    if (typeof page === "number" && page !== currentPage) {
      onPageChange(page);
    }
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className={`flex items-center justify-between ${className}`}>
      {/* 左侧：显示当前项目范围 */}
      <div className="flex items-center space-x-4">
        <span className="text-sm text-muted-foreground">
          显示 {startItem}-{endItem} 项，共 {totalItems} 项
        </span>

        {/* 页面大小选择器 */}
        {showPageSizeSelector && onPageSizeChange && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">每页显示</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="px-2 py-1 text-sm border border-border rounded bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span className="text-sm text-muted-foreground">项</span>
          </div>
        )}
      </div>

      {/* 右侧：页码导航 */}
      <div className="flex items-center space-x-1">
        {/* 上一页按钮 */}
        <button
          onClick={handlePrevious}
          disabled={currentPage === 1}
          className={`
            p-2 rounded-md transition-colors duration-200
            ${
              currentPage === 1
                ? "text-muted-foreground cursor-not-allowed opacity-50"
                : "text-foreground hover:bg-accent hover:text-accent-foreground"
            }
          `}
          aria-label="上一页"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
        {/* 页码按钮 */}
        {pageNumbers.map((page, index) => (
          <button
            key={`page-${index}`}
            onClick={() => handlePageClick(page)}
            disabled={page === "..."}
            className={`
              px-3 py-2 text-sm rounded-md transition-colors duration-200
              ${
                page === currentPage
                  ? "bg-primary text-primary-foreground"
                  : page === "..."
                  ? "text-muted-foreground cursor-default"
                  : "text-foreground hover:bg-accent hover:text-accent-foreground"
              }
            `}
          >
            {page === "..." ? (
              <EllipsisHorizontalIcon className="h-4 w-4" />
            ) : (
              page
            )}
          </button>
        ))}
        {/* 下一页按钮 */}
        <button
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className={`
            p-2 rounded-md transition-colors duration-200
            ${
              currentPage === totalPages
                ? "text-muted-foreground cursor-not-allowed opacity-50"
                : "text-foreground hover:bg-accent hover:text-accent-foreground"
            }
          `}
          aria-label="下一页"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
