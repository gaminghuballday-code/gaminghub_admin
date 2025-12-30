import React from 'react';
import './Input.scss';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  fullWidth = true,
  icon,
  className = '',
  id,
  ...inputProps
}) => {
  const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
  const inputClasses = [
    'form-input',
    error && 'form-input-error',
    icon && 'form-input-with-icon',
    fullWidth && 'form-input-full-width',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={`form-group ${fullWidth ? 'form-group-full-width' : ''}`}>
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label}
        </label>
      )}
      <div className="input-wrapper">
        {icon && <span className="input-icon">{icon}</span>}
        <input
          id={inputId}
          className={inputClasses}
          {...inputProps}
        />
      </div>
      {error && <small className="form-error">{error}</small>}
      {hint && !error && <small className="form-hint">{hint}</small>}
    </div>
  );
};

export default Input;
