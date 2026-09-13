"use client";

import React, { useId } from "react";
import "./NeoToggle.css";

export type NeoToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  ariaLabel?: string;
  id?: string;
  className?: string;
};

export const NeoToggle: React.FC<NeoToggleProps> = ({
  checked,
  onChange,
  disabled = false,
  ariaLabel,
  id,
  className = "",
}) => {
  const generatedId = useId();
  const resolvedId = id || generatedId;

  return (
    <div
      className={`neo-toggle-container ${checked ? "is-checked" : ""} ${
        disabled ? "is-disabled" : ""
      } ${className}`.trim()}
    >
      <input
        className="neo-toggle-input"
        id={resolvedId}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        disabled={disabled}
        aria-label={ariaLabel}
      />
      <label className="neo-toggle" htmlFor={resolvedId}>
        <div className="neo-track">
          <div className="neo-background-layer" />
          <div className="neo-grid-layer" />
          <div className="neo-spectrum-analyzer" aria-hidden="true">
            <span className="neo-spectrum-bar" />
            <span className="neo-spectrum-bar" />
            <span className="neo-spectrum-bar" />
            <span className="neo-spectrum-bar" />
            <span className="neo-spectrum-bar" />
          </div>
          <div className="neo-track-highlight" />

          <div className="neo-thumb">
            <div className="neo-thumb-pulse" />
            <div className="neo-thumb-ring" />
            <div className="neo-thumb-core">
              <div className="neo-thumb-icon">
                <svg
                  className="neo-thumb-wave"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    d="M2 12h4l2.5-6 4 12 3-8 2.5 4h4"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="neo-status" aria-hidden="true">
          <div className="neo-status-indicator">
            <span className="neo-status-dot" />
            <span className="neo-status-text">
              {checked ? "ACTIVE" : "STANDBY"}
            </span>
          </div>
        </div>
      </label>
    </div>
  );
};

export default NeoToggle;
