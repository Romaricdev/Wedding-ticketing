"use client";

import { Search, X } from "lucide-react";
import { useEffect, useId, useState, type ChangeEvent } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface SearchInputProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  onDebouncedChange?: (value: string) => void;
  debounceMs?: number;
  placeholder?: string;
  label?: string;
  className?: string;
  disabled?: boolean;
}

export function SearchInput({
  value,
  defaultValue = "",
  onValueChange,
  onDebouncedChange,
  debounceMs = 300,
  placeholder = "Rechercher…",
  label = "Rechercher",
  className,
  disabled = false,
}: SearchInputProps) {
  const inputId = useId();
  const [internalValue, setInternalValue] = useState(defaultValue);
  const currentValue = value ?? internalValue;

  useEffect(() => {
    if (!onDebouncedChange) return;

    const timeout = window.setTimeout(() => {
      onDebouncedChange(currentValue);
    }, debounceMs);

    return () => window.clearTimeout(timeout);
  }, [currentValue, debounceMs, onDebouncedChange]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;

    if (value === undefined) {
      setInternalValue(nextValue);
    }

    onValueChange?.(nextValue);
  };

  const handleClear = () => {
    if (value === undefined) {
      setInternalValue("");
    }

    onValueChange?.("");
    onDebouncedChange?.("");
  };

  return (
    <div className={cn("relative", className)}>
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted"
        aria-hidden="true"
      />
      <Input
        id={inputId}
        type="search"
        value={currentValue}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className="pl-10 pr-12"
      />
      {currentValue ? (
        <button
          type="button"
          className="absolute inset-y-0 right-0 flex min-h-[44px] min-w-[44px] items-center justify-center text-text-muted hover:text-text"
          aria-label="Effacer la recherche"
          onClick={handleClear}
          disabled={disabled}
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
