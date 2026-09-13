"use client";

import React, { useId } from "react";
import "./HolographicToggle.css";

export interface HolographicToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  ariaLabel?: string;
  size?: "default" | "compact";
  className?: string;
}

export default function HolographicToggle({
  checked,
  onChange,
  disabled = false,
  ariaLabel = "Toggle switch",
  size = "default",
  className = "",
}: HolographicToggleProps) {
  const inputId = useId();

  return (
    <label
      htmlFor={inputId}
      className={`holo-toggle-container ${checked ? "is-checked" : ""} ${
        disabled ? "is-disabled" : ""
      } ${size === "compact" ? "size-compact" : ""} ${className}`}
    >
      {/* Hidden Native Accessible Checkbox */}
      <input
        id={inputId}
        type="checkbox"
        className="holo-toggle-input"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-checked={checked}
      />

      {/* Track Chassis */}
      <div className="holo-toggle-track" aria-hidden="true">
        {/* Moving Track Grid Lines */}
        <div className="holo-track-lines" />

        {/* Sweeping Laser Scanline */}
        <div className="holo-scanline" />

        {/* State Indicator Glyph ("ON" / "OFF") */}
        <span className="holo-state-label">
          {checked ? "ON" : "OFF"}
        </span>

        {/* Top Holographic Glass Reflection */}
        <div className="holo-glass-sheen" />

        {/* Holographic Glowing Thumb */}
        <div className="holo-toggle-thumb">
          {/* Rotating Energy Ring */}
          <div className="holo-energy-ring" />

          {/* Pulsing Inner Core */}
          <div className="holo-thumb-core" />

          {/* Top Glass Dome Sheen */}
          <div className="holo-thumb-sheen" />
        </div>
      </div>
    </label>
  );
}
