"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface PaginationControlProps {
  totalItems: number;
  pageSize: number;
  currentPage: number;
  siblingCount?: number;
  className?: string;
  onPageChange?: (page: number) => void;
  baseUrl?: string;
  preserveParams?: boolean;
}

export default function PaginationControl({
  totalItems,
  pageSize,
  currentPage,
  siblingCount = 1,
  className,
  onPageChange,
  baseUrl = "",
  preserveParams = true,
}: PaginationControlProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Generate URL for a specific page
  const generatePageUrl = useCallback((page: number) => {
    if (!preserveParams) return `${baseUrl}?page=${page}`;

    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    return `${baseUrl}?${params.toString()}`;
  }, [baseUrl, preserveParams, searchParams]);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    if (onPageChange) {
      // If onPageChange is provided, use it (client-side pagination)
      onPageChange(page);
    } else {
      // Otherwise, use router navigation (server-side pagination)
      router.push(generatePageUrl(page));
    }
  }, [onPageChange, router, generatePageUrl]);

  // Generate page numbers to display
  const generatePagination = useCallback(() => {
    // Always show first page
    const firstPage = 1;
    // Always show last page
    const lastPage = totalPages;

    // Calculate range of pages to show around current page
    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

    // Determine whether to show dots
    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 1;

    // Generate the array of page numbers to display
    const pages = [];

    // Always add first page
    pages.push(1);

    // Add left dots if needed
    if (shouldShowLeftDots) {
      pages.push("leftDots");
    }

    // Add pages around current page
    for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
      if (i !== 1 && i !== totalPages) {
        pages.push(i);
      }
    }

    // Add right dots if needed
    if (shouldShowRightDots) {
      pages.push("rightDots");
    }

    // Add last page if not already included and if it's different from the first page
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  }, [currentPage, siblingCount, totalPages]);

  // Always show pagination, even if there's only one page
  const pages = generatePagination();

  return (
    <Pagination className={className}>
      <PaginationContent className={totalPages <= 1 ? "opacity-70" : ""}>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handlePageChange(Math.max(1, currentPage - 1));
            }}
            aria-disabled={currentPage === 1}
            tabIndex={currentPage === 1 ? -1 : 0}
            className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
          />
        </PaginationItem>

        {pages.map((page, i) => {
          // Render dots
          if (page === "leftDots" || page === "rightDots") {
            return (
              <PaginationItem key={`dots-${i}`}>
                <span className="flex h-9 w-9 items-center justify-center">
                  <PaginationEllipsis />
                </span>
              </PaginationItem>
            );
          }

          // Render page number
          const pageNum = page as number;
          return (
            <PaginationItem key={pageNum}>
              <PaginationLink
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handlePageChange(pageNum);
                }}
                isActive={currentPage === pageNum}
              >
                {pageNum}
              </PaginationLink>
            </PaginationItem>
          );
        })}

        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handlePageChange(Math.min(totalPages, currentPage + 1));
            }}
            aria-disabled={currentPage === totalPages}
            tabIndex={currentPage === totalPages ? -1 : 0}
            className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
