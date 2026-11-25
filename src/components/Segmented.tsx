"use client";

type Option<T> = { value: T; label: string };

type Props<T extends string | number> = {
  value: T;
  onChange: (value: T) => void;
  options: Option<T>[];
  className?: string;
};

/** Compact segmented control used across the onboarding and check-in forms. */
export function Segmented<T extends string | number>({
  value,
  onChange,
  options,
  className,
}: Props<T>) {
  return (
    <div className={`flex flex-wrap gap-1.5 ${className ?? ""}`}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          className="seg text-sm"
          data-active={o.value === value}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
