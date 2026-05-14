"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

const toolbarClass =
  "flex flex-col gap-3 rounded-lg border bg-muted/30 p-4 sm:flex-row sm:flex-wrap sm:items-end";

type Props = {
  /** Filter fields (inputs + labels) */
  children: ReactNode;
  onApply: () => void;
  onClear: () => void;
  applyLabel?: string;
};

/**
 * Draft inputs live in parent state; Apply commits to the query, Clear resets draft + applied.
 */
export function ListFiltersToolbar({
  children,
  onApply,
  onClear,
  applyLabel = "Apply filters",
}: Props) {
  return (
    <form
      className={toolbarClass}
      onSubmit={(e) => {
        e.preventDefault();
        onApply();
      }}
    >
      {children}
      <div className="flex shrink-0 gap-2 pb-0.5">
        <Button type="submit" size="sm">
          {applyLabel}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onClear}>
          Clear
        </Button>
      </div>
    </form>
  );
}
