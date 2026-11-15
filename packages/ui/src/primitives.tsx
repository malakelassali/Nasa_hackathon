import {
  forwardRef,
  useId,
  useLayoutEffect,
  useRef,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type MouseEvent,
  type ReactNode,
  type SelectHTMLAttributes,
} from 'react';

function classes(...values: Array<string | false | undefined>) {
  return values.filter(Boolean).join(' ');
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'default' | 'small' | 'icon';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'default', type = 'button', className, children, ...props },
  ref,
) {
  return (
    <button
      {...props}
      ref={ref}
      className={classes('agrix-button', `agrix-button--${variant}`, `agrix-button--${size}`, className)}
      type={type}
    >
      {children}
    </button>
  );
});

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  tone?: 'default' | 'sage' | 'warning' | 'plain';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { tone = 'default', className, children, ...props },
  ref,
) {
  return (
    <div {...props} ref={ref} className={classes('agrix-card', `agrix-card--${tone}`, className)}>
      {children}
    </div>
  );
});

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
}

export function Badge({ tone = 'neutral', className, children, ...props }: BadgeProps) {
  return <span {...props} className={classes('agrix-badge', `agrix-badge--${tone}`, className)}>{children}</span>;
}

export type IconName =
  | 'leaf' | 'map' | 'plans' | 'bookmark' | 'chat' | 'mic' | 'search'
  | 'plus' | 'minus' | 'locate' | 'check' | 'arrowLeft' | 'arrowRight'
  | 'close' | 'menu' | 'play' | 'pause' | 'reset' | 'chevronDown' | 'alert';

export interface IconProps {
  name: IconName;
  size?: 'small' | 'medium' | 'large';
  label?: string;
  className?: string;
}

export function Icon({ name, size = 'medium', label, className }: IconProps) {
  const dimension = size === 'small' ? 16 : size === 'large' ? 28 : 20;
  return (
    <img
      src={`/assets/icons/${name}.svg`}
      width={dimension}
      height={dimension}
      alt={label ?? ''}
      aria-hidden={label ? undefined : true}
      draggable={false}
      className={classes('agrix-icon', `agrix-icon--${name}`, `agrix-icon--${size}`, className)}
    />
  );
}

interface FieldMessages {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string;
  wrapperClassName?: string;
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement>, FieldMessages {}
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, wrapperClassName, className, id, 'aria-describedby': describedBy, ...props },
  ref,
) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const hintId = `${fieldId}-hint`;
  const errorId = `${fieldId}-error`;
  const description = classes(describedBy, hint ? hintId : undefined, error ? errorId : undefined) || undefined;
  return (
    <div className={classes('agrix-field', wrapperClassName)}>
      {label && <label className="agrix-field__label" htmlFor={fieldId}>{label}</label>}
      <input
        {...props}
        ref={ref}
        id={fieldId}
        aria-describedby={description}
        aria-invalid={error ? true : props['aria-invalid']}
        className={classes('agrix-input', error && 'agrix-input--error', className)}
      />
      {hint && <p className="agrix-field__hint" id={hintId}>{hint}</p>}
      {error && <p className="agrix-field__error" id={errorId}>{error}</p>}
    </div>
  );
});

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement>, FieldMessages {}
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, wrapperClassName, className, children, id, 'aria-describedby': describedBy, ...props },
  ref,
) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const hintId = `${fieldId}-hint`;
  const errorId = `${fieldId}-error`;
  const description = classes(describedBy, hint ? hintId : undefined, error ? errorId : undefined) || undefined;
  return (
    <div className={classes('agrix-field', wrapperClassName)}>
      {label && <label className="agrix-field__label" htmlFor={fieldId}>{label}</label>}
      <select
        {...props}
        ref={ref}
        id={fieldId}
        aria-describedby={description}
        aria-invalid={error ? true : props['aria-invalid']}
        className={classes('agrix-input', 'agrix-select', error && 'agrix-input--error', className)}
      >
        {children}
      </select>
      {hint && <p className="agrix-field__hint" id={hintId}>{hint}</p>}
      {error && <p className="agrix-field__error" id={errorId}>{error}</p>}
    </div>
  );
});

export interface SegmentedOption<T extends string> {
  label: string;
  value: T;
  disabled?: boolean;
}

export interface SegmentedControlProps<T extends string> {
  label: string;
  options: ReadonlyArray<SegmentedOption<T>>;
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  className?: string;
  hideLabel?: boolean;
}

export function SegmentedControl<T extends string>({
  label, options, value, onChange, disabled = false, className, hideLabel = false,
}: SegmentedControlProps<T>) {
  const name = useId();
  return (
    <fieldset disabled={disabled} className={classes('agrix-segmented', className)}>
      <legend className={hideLabel ? 'agrix-sr-only' : 'agrix-field__label'}>{label}</legend>
      <div className="agrix-segmented__options">
        {options.map((option) => (
          <label key={option.value} className="agrix-segmented__option">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              disabled={option.disabled}
              onChange={() => onChange(option.value)}
            />
            <span className="agrix-segmented__label">{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  closeLabel?: string;
  className?: string;
}

export function Modal({
  open, onClose, title, description, children, footer, closeLabel = 'Close', className,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
      if (previousFocus.current?.isConnected) previousFocus.current.focus({ preventScroll: true });
    }
  }, [open]);

  useLayoutEffect(() => () => {
    const dialog = dialogRef.current;
    if (dialog?.open) dialog.close();
    if (previousFocus.current?.isConnected) previousFocus.current.focus({ preventScroll: true });
  }, []);

  function closeOnBackdrop(event: MouseEvent<HTMLDialogElement>) {
    if (event.target !== event.currentTarget) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
  }

  return (
    <dialog
      ref={dialogRef}
      className={classes('agrix-modal', className)}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={closeOnBackdrop}
    >
      <div className="agrix-modal__surface">
        <header className="agrix-modal__header">
          <h2 id={titleId}>{title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label={closeLabel}>
            <Icon name="close" />
          </Button>
        </header>
        {description && <p className="agrix-modal__description" id={descriptionId}>{description}</p>}
        <div className="agrix-modal__body">{children}</div>
        {footer && <footer className="agrix-modal__footer">{footer}</footer>}
      </div>
    </dialog>
  );
}
