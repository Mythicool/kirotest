import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    leftIcon,
    rightIcon,
    fullWidth = false,
    className = '',
    disabled,
    ...props
  }, ref) => {
    const baseClasses = [
      'inline-flex',
      'items-center',
      'justify-center',
      'font-medium',
      'transition-colors',
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-offset-2',
      'disabled:opacity-50',
      'disabled:cursor-not-allowed',
      'disabled:pointer-events-none',
    ];

    const variantClasses = {
      primary: [
        'bg-primary-600',
        'text-white',
        'hover:bg-primary-700',
        'focus:ring-primary-500',
        'shadow-sm',
      ],
      secondary: [
        'bg-gray-100',
        'text-gray-900',
        'hover:bg-gray-200',
        'focus:ring-gray-500',
        'shadow-sm',
      ],
      outline: [
        'border',
        'border-gray-300',
        'bg-transparent',
        'text-gray-700',
        'hover:bg-gray-50',
        'focus:ring-primary-500',
      ],
      ghost: [
        'bg-transparent',
        'text-gray-700',
        'hover:bg-gray-100',
        'focus:ring-primary-500',
      ],
      danger: [
        'bg-red-600',
        'text-white',
        'hover:bg-red-700',
        'focus:ring-red-500',
        'shadow-sm',
      ],
    };

    const sizeClasses = {
      sm: ['px-3', 'py-1.5', 'text-sm', 'rounded-md'],
      md: ['px-4', 'py-2', 'text-sm', 'rounded-md'],
      lg: ['px-6', 'py-3', 'text-base', 'rounded-lg'],
    };

    const widthClasses = fullWidth ? ['w-full'] : [];

    const allClasses = [
      ...baseClasses,
      ...variantClasses[variant],
      ...sizeClasses[size],
      ...widthClasses,
      className,
    ].join(' ');

    return (
      <button
        ref={ref}
        className={allClasses}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {leftIcon && !loading && <span className="mr-2">{leftIcon}</span>}
        {children}
        {rightIcon && <span className="ml-2">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;