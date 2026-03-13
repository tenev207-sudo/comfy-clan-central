import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const BGN_TO_EUR = 1.95583;

/** Convert BGN amount to EUR for display */
export function toEur(bgnAmount: number): string {
  return (bgnAmount / BGN_TO_EUR).toFixed(2);
}

/** Convert EUR input back to BGN for storage */
export function toBgn(eurAmount: number): number {
  return eurAmount * BGN_TO_EUR;
}
