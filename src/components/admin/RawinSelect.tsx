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
      className={`relative inline-block ${
        isSmall && !isExtraSmall ? "w-auto min-w-[120px]" : "w-full"
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
        className={`w-full flex items-center justify-between gap-2 transition-colors duration-150 cursor-pointer select-none outline-none ${
          fontMono ? "font-mono" : "font-sans"
        } ${
          isExtraSmall
            ? "px-3 py-1.5 text-xs rounded-lg bg-ink-black/60 border border-white/[0.08] hover:border-white/20 text-foreground shadow-sm"
            : isSmall
            ? "px-2.5 py-1 text-xs rounded-lg bg-ink-black/80 border border-white/[0.12] hover:border-white/25 text-muted hover:text-foreground shadow-sm"
            : "px-4 py-2.5 text-sm rounded-xl bg-ink-black/70 border border-white/[0.12] hover:border-white/25 text-foreground shadow-sm"
        } ${
          error
            ? "border-rose-500/60 ring-1 ring-rose-500/30"
            : isOpen
            ? "border-pacific-cyan ring-1 ring-pacific-cyan/40"
            : "focus-visible:border-pacific-cyan focus-visible:ring-1 focus-visible:ring-pacific-cyan/40"
        } ${disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {selectedOption?.icon && (
            <span className="shrink-0 text-pacific-cyan flex items-center">
              {selectedOption.icon}
            </span>
          )}
          <span className="truncate text-left font-medium">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.badge && (
            <span className="ml-1.5 text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-muted border border-white/[0.08]">
              {selectedOption.badge}
            </span>
          )}
        </div>
        <ChevronDown
          className={`shrink-0 transition-transform duration-200 ${
            isExtraSmall || isSmall ? "w-3 h-3" : "w-4 h-4"
          } ${isOpen ? "rotate-180 text-pacific-cyan" : "text-muted/60"}`}
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
          } z-[70] rounded-xl bg-ink-black/95 backdrop-blur-xl border border-white/[0.12] shadow-[0_16px_40px_rgba(0,0,0,0.9),0_0_24px_rgba(24,155,173,0.1)] p-1.5 flex flex-col gap-0.5 max-h-60 overflow-y-auto ${
            isSmall && !isExtraSmall ? "min-w-[150px] text-xs" : "w-full min-w-[170px] text-xs"
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
                    ? "bg-pacific-cyan/15 text-pacific-cyan font-medium border border-pacific-cyan/30"
                    : isHighlighted
                    ? "bg-white/[0.08] text-foreground"
                    : "text-foreground/80 hover:bg-white/[0.04] hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {option.icon && (
                    <span
                      className={`shrink-0 flex items-center ${
                        isSelected ? "text-pacific-cyan" : "text-muted"
                      }`}
                    >
                      {option.icon}
                    </span>
                  )}
                  <span className="truncate">{option.label}</span>
                  {option.badge && (
                    <span className="ml-1.5 text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-muted border border-white/[0.08]">
                      {option.badge}
                    </span>
                  )}
                </div>
                {isSelected && (
                  <Check
                    className={`shrink-0 stroke-[2.5] text-pacific-cyan ${
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
