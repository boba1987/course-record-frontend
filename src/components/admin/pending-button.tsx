import * as React from "react";
import { Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type PendingButtonProps = React.ComponentProps<typeof Button> & {
  pending?: boolean;
};

export function PendingButton({
  pending,
  disabled,
  className,
  children,
  ...props
}: PendingButtonProps) {
  return (
    <Button
      disabled={disabled || pending}
      className={cn(className)}
      {...props}
    >
      {pending ? (
        <>
          <Loader2Icon
            className="size-4 shrink-0 animate-spin"
            data-icon="inline-start"
            aria-hidden
          />
          {children}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
