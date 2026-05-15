import type { FieldError } from "react-hook-form";

/** Message from a field error or a Zod refine placed on an array/object (`root`). */
export function fieldErrorMessage(error: FieldError | undefined): string | undefined {
  if (!error) return undefined;
  if (typeof error.message === "string" && error.message !== "") return error.message;
  const root = (error as FieldError & { root?: FieldError }).root;
  if (root && typeof root.message === "string" && root.message !== "") return root.message;
  return undefined;
}
