"use client";

import React, { useRef } from "react";
import { Calendar } from "lucide-react";

interface RawinDateTimeInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string;
  defaultValue?: string;
  className?: string;
}

export default function RawinDateTimeInput({
  name,
  defaultValue = "",
  className = "",
  ...props
}: RawinDateTimeInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleOpenPicker = () => {
    if (inputRef.current) {
      if (typeof inputRef.current.showPicker === "function") {
        try {
          inputRef.current.showPicker();
          return;
        } catch {
          // Fall back to focus if browser blocks showPicker
        }
      }
      inputRef.current.focus();
    }
  };

  return (
    <div
      onClick={handleOpenPicker}
      className={`group relative flex items-center rounded-xl bg-ink-black/60 backdrop-blur-md border border-white/[0.08] hover:border-white/20 focus-within:border-pacific-cyan focus-within:ring-1 focus-within:ring-pacific-cyan/40 transition-all cursor-pointer ${className}`}
    >
      <div className="pl-3.5 pr-1 pointer-events-none text-muted/70 group-hover:text-pacific-cyan group-focus-within:text-pacific-cyan transition-colors">
        <Calendar className="w-4 h-4" />
      </div>
      <input
        ref={inputRef}
        type="datetime-local"
        name={name}
        defaultValue={defaultValue}
        className="w-full pl-2.5 pr-4 py-2.5 bg-transparent text-sm text-foreground font-mono outline-none transition-colors cursor-pointer [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:transition-opacity"
        {...props}
      />
    </div>
  );
}
