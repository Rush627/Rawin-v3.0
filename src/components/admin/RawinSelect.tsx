"use client";

import { useState, useRef, useEffect, useCallback, useId } from "react";
import { ChevronDown, Check } from "lucide-react";

export interface RawinSelectOption {
  value: string;
  label: string;
  badge?: string;
}

interface RawinSelectProps {
  name: string;
  options: RawinSelectOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  size?: "sm" | "md";
  fontMono?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export default function RawinSelect({
  name,
  options,
  value,
  defaultValue,
  onChange,
  placeholder = "Select...",
  size = "md",
  fontMono = false,
  disabled = false,
  className = "",
  id,
}: RawinSelectProps) {
  const generatedId = useId();
  const selectId = id || generatedId;

  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState<string>(() => {
    if (value !== undefined) return value;
    if (defaultValue !== undefined) return defaultValue;
    return options[0]?.value || "";
  });

  const selectedValue = isControlled ? (value as string) : internalValue;
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Sync internal state if controlled value updates
  useEffect(() => {
    if (isControlled) {
      setInternalValue(value);
    }
  }, [isControlled, value]);

  const selectedOption = options.find((opt) => opt.value === selectedValue);

  const handleSelect = useCallback(
    (newVal: string) => {
      if (!isControlled) {
        setInternalValue(newVal);
      }
      onChange?.(newVal);
      setIsOpen(false);
      buttonRef.current?.focus();
    },
    [isControlled, onChange]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (e.key === "Escape") {
      setIsOpen(false);
      buttonRef.current?.focus();
      return;
    }

    if (e.key === "Tab") {
      setIsOpen(false);
      return;
    }

    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setIsOpen(true);
        const currentIndex = options.findIndex((opt) => opt.value === selectedValue);
        setHighlightedIndex(currentIndex >= 0 ? currentIndex : 0);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < options.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : options.length - 1));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < options.length) {
        handleSelect(options[highlightedIndex].value);
      }
    }
  };

  const isSmall = size === "sm";

  return (
    <div
      ref={containerRef}
      className={`relative inline-block ${isSmall ? "w-auto" : "w-full"} ${
        isOpen ? "z-30" : ""
      } ${className}`}
      onKeyDown={handleKeyDown}
    >
      {/* Hidden input to ensure FormData captures the value in Server Actions */}
      <input type="hidden" name={name} value={selectedValue} />

      {/* Trigger Button */}
      <button
        ref={buttonRef}
        id={selectId}
        type="button"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={`${selectId}-listbox`}
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setIsOpen((prev) => !prev);
            const currentIndex = options.findIndex((opt) => opt.value === selectedValue);
            setHighlightedIndex(currentIndex >= 0 ? currentIndex : 0);
          }
        }}
        className={`w-full flex items-center justify-between gap-2.5 transition-all cursor-pointer select-none outline-none ${
          fontMono ? "font-mono" : "font-sans"
        } ${
          isSmall
            ? "px-2.5 py-1 text-xs rounded-lg bg-ink-black/80 border border-white/[0.12] hover:border-white/25 text-muted hover:text-foreground shadow-sm"
            : "px-4 py-2.5 text-sm rounded-xl bg-ink-black/70 border border-white/[0.12] hover:border-white/25 text-foreground shadow-sm"
        } ${
          isOpen
            ? "border-pacific-cyan ring-1 ring-pacific-cyan/40"
            : "focus-visible:border-pacific-cyan focus-visible:ring-1 focus-visible:ring-pacific-cyan/40"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <span className="truncate text-left font-medium">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`shrink-0 transition-transform duration-200 ${
            isSmall ? "w-3 h-3" : "w-4 h-4"
          } ${isOpen ? "rotate-180 text-pacific-cyan" : "text-muted/60"}`}
        />
      </button>

      {/* Floating Dropdown Menu (Rounded-xl with blurred backdrop and Pacific Cyan highlight) */}
      {isOpen && (
        <ul
          ref={listboxRef}
          id={`${selectId}-listbox`}
          role="listbox"
          tabIndex={-1}
          className={`absolute left-0 top-full mt-1.5 z-50 rounded-xl bg-ink-black/95 backdrop-blur-xl border border-white/[0.12] shadow-[0_16px_40px_rgba(0,0,0,0.85),0_0_24px_rgba(24,155,173,0.12)] p-1.5 flex flex-col gap-1 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-150 ${
            isSmall ? "min-w-[130px] text-xs" : "w-full text-sm"
          }`}
        >
          {options.map((option, idx) => {
            const isSelected = option.value === selectedValue;
            const isHighlighted = idx === highlightedIndex;

            return (
              <li
                key={option.value}
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(option.value)}
                onMouseEnter={() => setHighlightedIndex(idx)}
                className={`flex items-center justify-between gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer select-none ${
                  fontMono ? "font-mono" : "font-sans"
                } ${
                  isSelected
                    ? "bg-pacific-cyan text-ink-black font-semibold shadow-sm"
                    : isHighlighted
                    ? "bg-pacific-cyan/20 text-pacific-cyan"
                    : "text-foreground/90 hover:bg-white/[0.06] hover:text-foreground"
                }`}
              >
                <span className="truncate">{option.label}</span>
                {isSelected && (
                  <Check
                    className={`shrink-0 stroke-[2.5] ${
                      isSmall ? "w-3 h-3 text-ink-black" : "w-3.5 h-3.5 text-ink-black"
                    }`}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
