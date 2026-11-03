import type { InputHTMLAttributes, Ref } from "react";

type AppInputProps = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
  ref?: Ref<HTMLInputElement>;
};

export function AppInput({
  invalid = false,
  className = "",
  ref,
  ...props
}: AppInputProps) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={`min-h-11 w-full rounded-xl border bg-white px-3.5 py-2.5 text-base text-espresso placeholder:text-roast/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-espresso focus-visible:ring-offset-2 disabled:opacity-60 ${
        invalid ? "border-energy-orange" : "border-warm-border"
      } ${className}`}
      {...props}
    />
  );
}
