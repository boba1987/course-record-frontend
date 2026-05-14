import { z } from "zod";

function prepNumber(v: unknown) {
  if (v === "" || v === undefined || v === null) return undefined;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : v;
}

/** Zod 4 + react-hook-form: HTML number inputs often yield `string | number`. */
export function formInt(min: number, max: number) {
  return z.preprocess(prepNumber, z.number().int().min(min).max(max));
}

export function formPositiveInt(min: number) {
  return z.preprocess(prepNumber, z.number().int().min(min));
}
