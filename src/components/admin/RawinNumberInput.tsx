"use client";

import React, { useRef, useState, useEffect } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

interface RawinNumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  name: string;
  defaultValue?: number | string;
  value?: number | string;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  onChange?: (val: number) => void;
}

export default function RawinNumberInput({
  name,
  defaultValue = 1,
  value,
  min = 1,
  max = 999,
  step = 1,
  className = "",
  onChange,
  ...props
}: RawinNumberInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [internalVal, setInternalVal] = useState<string>(
    value !== undefined ? String(value) : String(defaultValue)
  );

  useEffect(() => {
    if (value !== undefined) {
      setInternalVal(String(value));
    }
  }, [value]);

  const updateValue = (newNum: number) => {
    const clamped = Math.max(min, Math.min(max, newNum));
    setInternalVal(String(clamped));
    if (inputRef.current) {
      inputRef.current.value = String(clamped);
      inputRef.current.dispatchEvent(new Event("input", { bubbles: true }));
      inputRef.current.dispatchEvent(new Event("change", { bubbles: true }));
    }
    onChange?.(clamped);
  };

  const handleStep = (direction: "up" | "down") => {
    const currentNum = parseInt(internalVal, 10);
    const safeCurrent = isNaN(currentNum) ? min : currentNum;
    if (direction === "up") {
      updateValue(safeCurrent + step);
    } else {
      updateValue(safeCurrent - step);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valStr = e.target.value;
    setInternalVal(valStr);
    const num = parseInt(valStr, 10);
    if (!isNaN(num)) {
      onChange?.(num);
    }
  };

  return (
    <div
      className={`group relative flex items-center rounded-xl bg-surface backdrop-blur-md border border-line hover:border-line-strong focus-within:border-accent focus-within:ring-1 focus-within:ring-accent/40 transition-all ${className}`}
    >
      <input
        ref={inputRef}
        type="number"
        name={name}
        value={internalVal}
        min={min}
        max={max}
        step={step}
        onChange={handleChange}
        className="w-full pl-4 pr-10 py-2.5 bg-transparent text-[16px] sm:text-sm text-fg font-mono outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        {...props}
      />
      <div className="absolute right-1.5 inset-y-1.5 flex flex-col justify-center gap-0.5 pr-0.5">
        <button
          type="button"
          tabIndex={-1}
          aria-label="Increment display order"
          onClick={() => handleStep("up")}
          className="flex items-center justify-center w-6 h-3.5 rounded text-fg-muted/60 hover:text-accent hover:bg-surface-2 active:bg-accent/20 transition-colors cursor-pointer select-none"
        >
          <ChevronUp className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>
        <button
          type="button"
          tabIndex={-1}
          aria-label="Decrement display order"
          onClick={() => handleStep("down")}
          className="flex items-center justify-center w-6 h-3.5 rounded text-fg-muted/60 hover:text-accent hover:bg-surface-2 active:bg-accent/20 transition-colors cursor-pointer select-none"
        >
          <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
}
