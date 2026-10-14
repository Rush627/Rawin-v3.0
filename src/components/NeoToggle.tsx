"use client";

import React, { useId } from "react";

export type NeoToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  ariaLabel?: string;
  id?: string;
  className?: string;
};

/** Theme-aware switch used across the admin. API kept stable for existing call sites. */
export const NeoToggle: React.FC<NeoToggleProps> = ({ checked, onChange, disabled = false, ariaLabel, id, className = "" }) => {
  const generatedId = useId();
  const resolvedId = id || generatedId;

  return (
    <label
      htmlFor={resolvedId}
      className={`relative inline-flex items-center shrink-0 ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} ${className}`.trim()}
    >
      <input
        id={resolvedId}
        type="checkbox"
        role="switch"
        className="peer sr-only"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-checked={checked}
      />
      <span className="block w-12 h-7 rounded-full bg-sunken border border-line-strong transition-colors duration-300 peer-checked:bg-accent peer-checked:border-accent peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--focus)]" />
      <span className="absolute left-1 top-1 w-5 h-5 rounded-full bg-fg-subtle shadow-[var(--shadow-1)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] peer-checked:translate-x-5 peer-checked:bg-accent-fg" />
    </label>
  );
};

export default NeoToggle;
