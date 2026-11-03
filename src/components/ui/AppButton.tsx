import type { ButtonHTMLAttributes } from "react";

type AppButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
  loading?: boolean;
};

const variants = {
  primary:
    "border-espresso bg-espresso text-white hover:bg-roast hover:border-roast",
  secondary: "border-warm-border bg-white text-espresso hover:bg-cream",
} as const;

export function AppButton({
  variant = "primary",
  loading = false,
  disabled,
  className = "",
  type = "button",
  children,
  ...props
}: AppButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex min-h-11 items-center justify-center rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-espresso focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
