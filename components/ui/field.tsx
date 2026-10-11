import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { cn } from '@/lib/utils';

type FieldA11yProps = {
  id: string;
  'aria-describedby'?: string;
  'aria-invalid'?: true;
};

/**
 * Labelled form row. The control is provided through a render function so the
 * label, hint, error and control are always wired together with matching ids —
 * screen readers announce the hint/error with the field, and clicking the label
 * focuses the control.
 */
export function Field({
  id,
  label,
  hint,
  error,
  required,
  optional,
  labelHidden,
  className,
  children,
}: {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  required?: boolean;
  optional?: boolean;
  labelHidden?: boolean;
  className?: string;
  children: (props: FieldA11yProps) => ReactNode;
}) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className={cn('min-w-0', className)}>
      <label htmlFor={id} className={cn('label mb-1.5 flex items-baseline gap-1.5', labelHidden && 'sr-only')}>
        <span>{label}</span>
        {required && (
          <>
            <span aria-hidden="true" className="text-danger">
              *
            </span>
            <span className="sr-only">(required)</span>
          </>
        )}
        {optional && !required && (
          <span className="text-xs font-normal text-subtle">optional</span>
        )}
      </label>

      {children({
        id,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : undefined,
      })}

      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-xs leading-5 text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs leading-5 font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn('field-control', className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn('field-control resize-y', className)} {...props} />;
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn('field-control pr-9', className)} {...props}>
      {children}
    </select>
  );
}

/** Numeric inputs pair best with tabular figures and a monospaced feel. */
export function NumberInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      inputMode="decimal"
      className={cn('field-control text-right tabular-nums', className)}
      {...props}
    />
  );
}
