import { useEffect, useRef, useState, type ReactNode } from "react";

interface PriceFlashProps {
  /** The current numeric value to monitor for changes */
  value: number;
  /** The rendered content (typically the formatted price string) */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Wraps a price display value and briefly flashes green or red
 * when the value changes (increase → green, decrease → red).
 */
export function PriceFlash({ value, children, className = "" }: PriceFlashProps) {
  const prevValue = useRef<number>(value);
  const [flash, setFlash] = useState<"up" | "down" | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (prevValue.current !== value) {
      const direction = value > prevValue.current ? "up" : "down";
      setFlash(direction);
      prevValue.current = value;

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setFlash(null), 700);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [value]);

  return (
    <span
      className={`${className} ${
        flash === "up"
          ? "price-flash-up"
          : flash === "down"
          ? "price-flash-down"
          : ""
      }`}
    >
      {children}
    </span>
  );
}
