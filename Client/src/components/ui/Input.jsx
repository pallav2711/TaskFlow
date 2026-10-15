import { forwardRef } from 'react';

/**
 * Reusable form input with label and error state.
 * Fully compatible with react-hook-form via forwardRef.
 */
const Input = forwardRef(
  (
    {
      label,
      id,
      error,
      helperText,
      icon,
      className = '',
      containerClassName = '',
      required = false,
      ...rest
    },
    ref
  ) => {
    return (
      <div className={`flex flex-col gap-1 ${containerClassName}`}>
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-gray-700">
            {label}
            {required && <span className="text-red-500 ml-1" aria-hidden>*</span>}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={id}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : undefined}
            className={`
              w-full rounded-lg border px-3 py-2 text-sm text-gray-900
              placeholder-gray-400 bg-white
              transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
              disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
              ${error ? 'border-red-400 focus:ring-red-400' : 'border-gray-300'}
              ${icon ? 'pl-9' : ''}
              ${className}
            `}
            {...rest}
          />
        </div>
        {error && (
          <p id={`${id}-error`} role="alert" className="text-xs text-red-600">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p className="text-xs text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
