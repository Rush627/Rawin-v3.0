"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { Check, ChevronDown } from "lucide-react";

export interface VoiceOption {
  value: string;
  label: string;
  /** secondary text, e.g. the voice's language */
  hint?: string;
}

interface VoiceSelectProps {
  id?: string;
  label: string;
  value: string;
  options: VoiceOption[];
  onChange: (value: string) => void;
}

const shortLang = (s?: string) => (s ? s.replace("_", "-") : "");

/**
 * Reply-voice picker: a button that opens a themed listbox (the native <select> menu cannot be
 * styled). Keyboard: Enter / Space / ↓ / ↑ open it; ↑ ↓ Home End move; type-ahead jumps by first
 * letters; Enter or Space chooses; Escape or Tab closes and returns focus to the button. The menu
 * opens upward when there is no room below, so it never leaves the viewport.
 */
export default function VoiceSelect({ id, label, value, options, onChange }: VoiceSelectProps) {
  const auto = useId().replace(/:/g, "");
  const baseId = id || `voice-${auto}`;
  const listId = `${baseId}-list`;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [up, setUp] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const typed = useRef({ text: "", at: 0 });

  // a stored voice that is no longer installed shows as Automatic
  const selectedIndex = Math.max(0, options.findIndex((o) => o.value === value));
  const selected = options[selectedIndex];

  const openMenu = (index = selectedIndex) => {
    setActive(index);
    setOpen(true);
  };
  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) buttonRef.current?.focus();
  };
  const choose = (index: number) => {
    const opt = options[index];
    if (opt) onChange(opt.value);
    close();
  };

  // flip upward when the menu would run past the bottom of the viewport
  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return;
    const r = buttonRef.current.getBoundingClientRect();
    const need = Math.min(280, options.length * 44 + 12);
    setUp(window.innerHeight - r.bottom < need + 12 && r.top > window.innerHeight - r.bottom);
  }, [open, options.length]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.focus();
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!listRef.current?.contains(t) && !buttonRef.current?.contains(t)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const onButtonKey = (e: KeyboardEvent) => {
    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
      e.preventDefault();
      openMenu(e.key === "ArrowUp" ? Math.max(0, selectedIndex - 1) : selectedIndex);
    }
  };

  const onListKey = (e: KeyboardEvent) => {
    const last = options.length - 1;
    if (e.key === "ArrowDown") setActive((a) => Math.min(last, a + 1));
    else if (e.key === "ArrowUp") setActive((a) => Math.max(0, a - 1));
    else if (e.key === "Home") setActive(0);
    else if (e.key === "End") setActive(last);
    else if (e.key === "Enter" || e.key === " ") choose(active);
    else if (e.key === "Escape") close();
    else if (e.key === "Tab") {
      setOpen(false);
      return;
    } else if (e.key.length === 1 && /\S/.test(e.key)) {
      const now = e.timeStamp;
      typed.current = { text: (now - typed.current.at < 700 ? typed.current.text : "") + e.key.toLowerCase(), at: now };
      const hit = options.findIndex((o) => o.label.toLowerCase().startsWith(typed.current.text));
      if (hit >= 0) setActive(hit);
    } else return;
    e.preventDefault();
  };

  return (
    <div className="relative">
      <span id={`${baseId}-label`} className="sr-only">
        {label}
      </span>
      <button
        ref={buttonRef}
        id={baseId}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-labelledby={`${baseId}-label ${baseId}`}
        onClick={() => (open ? close() : openMenu())}
        onKeyDown={onButtonKey}
        className="voice-select-trigger w-full h-10 pl-3 pr-2.5 rounded-xl bg-surface border border-line hover:border-line-strong text-left text-[13px] text-fg flex items-center gap-2 transition-colors"
      >
        <span className="flex-1 min-w-0 truncate">{selected?.label}</span>
        <ChevronDown className={`w-4 h-4 shrink-0 text-fg-subtle transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          tabIndex={-1}
          aria-labelledby={`${baseId}-label`}
          aria-activedescendant={`${baseId}-opt-${active}`}
          onKeyDown={onListKey}
          className={`voice-select-menu absolute left-0 right-0 z-50 max-h-[280px] overflow-y-auto overscroll-contain p-1.5 rounded-2xl border border-line-strong bg-surface shadow-[var(--shadow-3)] outline-none ${
            up ? "bottom-[calc(100%+6px)]" : "top-[calc(100%+6px)]"
          }`}
          data-lenis-prevent
        >
          {options.map((o, i) => {
            const isSel = i === selectedIndex;
            return (
              <li
                key={o.value || "auto"}
                id={`${baseId}-opt-${i}`}
                data-index={i}
                role="option"
                aria-selected={isSel}
                onPointerMove={() => setActive(i)}
                onClick={() => choose(i)}
                className={`flex items-center gap-2.5 min-h-11 px-2.5 rounded-xl cursor-pointer text-[13px] select-none ${
                  i === active ? "bg-fg/[0.06] text-fg" : "text-fg-muted"
                }`}
              >
                <span className="w-4 shrink-0 text-accent">{isSel && <Check className="w-3.5 h-3.5" />}</span>
                <span className="flex-1 min-w-0">
                  <span className="block truncate">{o.label}</span>
                  {o.hint && <span className="block font-mono text-[10.5px] uppercase tracking-[0.08em] text-fg-subtle">{shortLang(o.hint)}</span>}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
