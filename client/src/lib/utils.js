import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Same helper shadcn-based libraries use (Vengeance UI / Skiper UI src/lib/utils.ts).
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
