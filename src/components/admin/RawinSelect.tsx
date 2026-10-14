"use client";

import { useState, useRef, useEffect, useCallback, useId } from "react";
import { ChevronDown, Check } from "lucide-react";

export interface RawinSelectOption {
  value: string;
  label: string;
  badge?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface RawinSelectProps {
  name: string;
  options: RawinSelectOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  size?: "xs" | "sm" | "md";
  fontMono?: boolean;
  disabled?: boolean;
  error?: boolean;
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
  error = false,
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
  const [openUpward, setOpenUpward] = useState<boolean>(false);

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

  // Viewport boundary check to intelligently open upward if space below is limited
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const estimatedMenuHeight = 240;
      if (spaceBelow < estimatedMenuHeight && rect.top > estimatedMenuHeight) {
        setOpenUpward(true);
      } else {
        setOpenUpward(false);
      }
    }
  }, [isOpen]);

  // Auto-scroll highlighted option into view
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listboxRef.current) {
      const items = listboxRef.current.querySelectorAll("li");
      const activeItem = items[highlightedIndex];
      if (activeItem) {
        activeItem.scrollIntoView({ block: "nearest" });
      }
    }
  }, [isOpen, highlightedIndex]);

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
      setHighlightedIndex((prev) => {
        let next = prev < options.length - 1 ? prev + 1 : 0;
        while (options[next]?.disabled && next !== prev) {
          next = next < options.length - 1 ? next + 1 : 0;
        }
        return next;
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => {
        let next = prev > 0 ? prev - 1 : options.length - 1;
        while (options[next]?.disabled && next !== prev) {
          next = next > 0 ? next - 1 : options.length - 1;
        }
        return next;
      });
    } else if (e.key === "Home") {
      e.preventDefault();
      const firstEnabled = options.findIndex((opt) => !opt.disabled);
      if (firstEnabled >= 0) setHighlightedIndex(firstEnabled);
    } else if (e.key === "End") {
      e.preventDefault();
      for (let i = options.length - 1; i >= 0; i--) {
        if (!options[i].disabled) {
          setHighlightedIndex(i);
          break;
        }
      }
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < options.length) {
        const option = options[highlightedIndex];
        if (!option.disabled) {
          handleSelect(option.value);
        }
      }
    }
  };

  const isExtraSmall = size === "xs";
  const isSmall = size === "sm";

  return (
    <div
      ref={containerRef}
      className={`relative ${
        isSmall && !isExtraSmall ? "inline-block w-auto min-w-[120px]" : "block w-full min-w-0 max-w-full box-border"
      } ${isOpen ? "z-[60]" : ""} ${className}`}
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
        className={`w-full min-w-0 max-w-full box-border flex items-center justify-between gap-2 transition-colors duration-150 cursor-pointer select-none outline-none ${
          fontMono ? "font-mono" : "font-sans"
        } ${
          isExtraSmall
            ? "px-3 py-1.5 text-xs rounded-lg bg-surface border border-line hover:border-line-strong text-fg shadow-sm"
            : isSmall
            ? "px-2.5 py-1 text-xs rounded-lg bg-surface border border-line-strong hover:border-line-strong text-fg-muted hover:text-fg shadow-sm"
            : "px-3.5 sm:px-4 py-2.5 text-xs sm:text-sm min-h-[40px] rounded-xl bg-surface border border-line-strong hover:border-line-strong text-fg shadow-sm"
        } ${
          error
            ? "border-danger/60 ring-1 ring-danger/30"
            : isOpen
            ? "border-accent ring-1 ring-accent/40"
            : "focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent/40"
        } ${disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}`}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
          {selectedOption?.icon && (
            <span className="shrink-0 text-accent flex items-center">
              {selectedOption.icon}
            </span>
          )}
          <span className="truncate text-left font-medium min-w-0 flex-1">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.badge && (
            <span className="shrink-0 ml-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-2 text-fg-muted border border-line whitespace-nowrap">
              {selectedOption.badge}
            </span>
          )}
        </div>
        <ChevronDown
          className={`shrink-0 transition-transform duration-200 ${
            isExtraSmall || isSmall ? "w-3 h-3" : "w-4 h-4"
          } ${isOpen ? "rotate-180 text-accent" : "text-fg-muted/60"}`}
        />
      </button>

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <ul
          ref={listboxRef}
          id={`${selectId}-listbox`}
          role="listbox"
          tabIndex={-1}
          className={`absolute left-0 ${
            openUpward ? "bottom-full mb-1.5" : "top-full mt-1.5"
          } z-[70] rounded-xl bg-surface backdrop-blur-xl border border-line-strong  p-1.5 flex flex-col gap-0.5 max-h-60 overflow-y-auto ${
            isSmall && !isExtraSmall ? "min-w-[150px] text-xs" : "w-full min-w-0 max-w-full text-xs"
          } animate-in fade-in zoom-in-95 duration-100`}
        >
          {options.map((option, idx) => {
            const isSelected = option.value === selectedValue;
            const isHighlighted = idx === highlightedIndex;

            return (
              <li
                key={option.value}
                role="option"
                aria-selected={isSelected}
                aria-disabled={option.disabled}
                onClick={() => {
                  if (!option.disabled) {
                    handleSelect(option.value);
                  }
                }}
                onMouseEnter={() => {
                  if (!option.disabled) {
                    setHighlightedIndex(idx);
                  }
                }}
                className={`flex items-center justify-between gap-2.5 ${
                  isExtraSmall || isSmall
                    ? "px-2.5 py-1.5 text-xs rounded-lg"
                    : "px-3 py-2 text-sm rounded-lg"
                } transition-colors select-none ${
                  fontMono ? "font-mono" : "font-sans"
                } ${
                  option.disabled
                    ? "opacity-40 cursor-not-allowed"
                    : "cursor-pointer"
                } ${
                  isSelected
                    ? "bg-accent/15 text-accent font-medium border border-accent/30"
                    : isHighlighted
                    ? "bg-surface-2 text-fg"
                    : "text-fg/80 hover:bg-surface-2 hover:text-fg"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {option.icon && (
                    <span
                      className={`shrink-0 flex items-center ${
                        isSelected ? "text-accent" : "text-fg-muted"
                      }`}
                    >
                      {option.icon}
                    </span>
                  )}
                  <span className="truncate">{option.label}</span>
                  {option.badge && (
                    <span className="ml-1.5 text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-2 text-fg-muted border border-line">
                      {option.badge}
                    </span>
                  )}
                </div>
                {isSelected && (
                  <Check
                    className={`shrink-0 stroke-[2.5] text-accent ${
                      isExtraSmall || isSmall ? "w-3 h-3" : "w-3.5 h-3.5"
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
