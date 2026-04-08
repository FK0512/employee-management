import clsx from "clsx";

export function cn(...args: Parameters<typeof clsx>) {
  return clsx(...args);
}

