import { clsx, type ClassValue } from "clsx";
import { format } from "date-fns";
import { formatUnits } from "ethers";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(
  timestamp: bigint | string | Date | number = Date.now()
) {
  const formatString = "dd/MM/yyyy";
  const date =
    typeof timestamp === "bigint"
      ? new Date(Number(timestamp) * 1000)
      : new Date(timestamp);
  return format(date, formatString);
}

export function formatPrice(price: bigint) {
  return formatUnits(price, 9);
}
