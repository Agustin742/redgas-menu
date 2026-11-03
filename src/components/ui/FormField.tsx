import type { InputHTMLAttributes, Ref } from "react";
import { AppInput } from "./AppInput";

type FormFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  error?: string;
  inputRef?: Ref<HTMLInputElement>;
};

export function FormField({
  id,
  label,
  error,
  inputRef,
  ...inputProps
}: FormFieldProps) {
  const errorId = `${id}-error`;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-espresso">
        {label}
      </label>
      <AppInput
        id={id}
        name={id}
        ref={inputRef}
        invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        {...inputProps}
      />
      {error ? (
        <p id={errorId} className="text-sm text-roast">
          {error}
        </p>
      ) : null}
    </div>
  );
}
