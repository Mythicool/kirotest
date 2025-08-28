import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({
    children,
    variant = 'default',
    padding = 'md',
    hover = false,
    className = '',
    ...props
  }, ref) => {
    const baseClasses = [
      'bg-white',
      'rounded-lg',
      'transition-all',
      'duration-200',
    ];

    const variantClasses = {
      default: ['shadow-sm', 'border', 'border-gray-200'],
      elevated: ['shadow-md'],
      outlined: ['border-2', 'border-gray-200'],
    };

    const paddingClasses = {
      none: [],
      sm: ['p-4'],
      md: ['p-6'],
      lg: ['p-8'],
    };

    const hoverClasses = hover ? ['hover:shadow-lg', 'hover:scale-105', 'cursor-pointer'] : [];

    const allClasses = [
      ...baseClasses,
      ...variantClasses[variant],
      ...paddingClasses[padding],
      ...hoverClasses,
      className,
    ].join(' ');

    return (
      <div ref={ref} className={allClasses} {...props}>
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export default Card;