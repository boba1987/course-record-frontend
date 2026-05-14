"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch, buildListQuery } from "@/lib/api";

/** Stable empty filters for `usePagedModel` / `useMemo` fallbacks */
export const EMPTY_LIST_FILTERS: Record<string, string> = Object.freeze({});
import type { PagedModel } from "@/types/api";
import { Button } from "@/components/ui/button";

export function PaginationFooter({
  page,
  onPageChange,
}: {
  page: { number: number; totalPages: number };
  onPageChange: (n: number) => void;
}) {
  const n = page.number;
  const tp = page.totalPages;
  return (
    <div className="flex items-center justify-between gap-2 border-t px-2 py-3 text-sm text-muted-foreground">
      <span>
        Page {n + 1} of {Math.max(tp, 1)}
      </span>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={n <= 0}
          onClick={() => onPageChange(n - 1)}
        >
          Previous
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={n >= tp - 1 || tp === 0}
          onClick={() => onPageChange(n + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

export function usePagedModel<T>(
  path: string,
  page: number,
  size: number,
  sort = "id,asc",
  filters: Record<string, string> = EMPTY_LIST_FILTERS,
) {
  return useQuery({
    queryKey: [path, page, size, sort, filters],
    queryFn: () =>
      apiFetch<PagedModel<T>>(
        `${path}${buildListQuery({ page, size, sort, filters })}`,
      ),
  });
}
