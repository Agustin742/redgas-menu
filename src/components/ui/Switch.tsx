type SwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  /** Visible text next to the track; defaults to nothing (label stays accessible). */
  text?: string;
  disabled?: boolean;
};

/** Compact on/off switch (role="switch"), same look as the category visibility toggle. */
export function Switch({ checked, onChange, label, text, disabled }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-2 rounded-full py-0.5 pr-1 text-sm font-medium text-roast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-espresso focus-visible:ring-offset-2 disabled:opacity-60"
    >
      <span
        aria-hidden="true"
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
          checked ? "bg-coffee-yellow" : "bg-warm-border"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow-[0_1px_3px_rgba(36,21,14,0.35)] transition-transform ${
            checked ? "translate-x-4" : ""
          }`}
        />
      </span>
      {text}
    </button>
  );
}
