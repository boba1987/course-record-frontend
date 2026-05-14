import { zodResolver } from "@hookform/resolvers/zod";
import type { FieldValues, Resolver } from "react-hook-form";
import type { z } from "zod";

/** Zod 4 + `@hookform/resolvers`: explicit `T` avoids preprocess `unknown` input mismatches. */
export function typedZodResolver<T extends FieldValues>(schema: z.ZodTypeAny): Resolver<T> {
  return zodResolver(schema as never) as Resolver<T>;
}
