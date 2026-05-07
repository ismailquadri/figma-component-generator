import React from 'react';
import './Button.styles.css';

export const Button = ({
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedby,
  className = '',
  onClick,
  ...props
}) => {
  const baseClasses = 'button';
  const variantClasses = `${baseClasses}--${variant}`;
  const sizeClasses = `${baseClasses}--${size}`;
  const disabledClasses = disabled ? `${baseClasses}--disabled` : '';

  return (
    <button
      className={`${baseClasses} ${variantClasses} ${sizeClasses} ${disabledClasses} ${className}`}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedby}
      aria-disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;