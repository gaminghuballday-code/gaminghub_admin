import React from 'react';
import Input from '../Input/Input';
import type { InputProps } from '../Input/Input';
import './FormField.scss';

export interface FormFieldProps extends Omit<InputProps, 'type'> {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'date' | 'time' | 'textarea';
  rows?: number;
}

const FormField: React.FC<FormFieldProps> = ({
  type = 'text',
  rows = 4,
  label,
  error,
  hint,
  fullWidth = true,
  id,
  className = '',
  placeholder,
  value,
  disabled,
  required,
  onChange,
  ...otherProps
}) => {
  const fieldId = id || (label ? `field-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  if (type === 'textarea') {
    return (
      <div className={`form-group ${fullWidth ? 'form-group-full-width' : ''}`}>
        {label && (
          <label htmlFor={fieldId} className="form-label">
            {label}
          </label>
        )}
        <textarea
          id={fieldId}
          className={`form-textarea ${error ? 'form-input-error' : ''} ${className}`}
          placeholder={placeholder}
          value={value as string}
          onChange={(e) => {
            if (onChange) {
              // Create compatible event for Input onChange
              const syntheticEvent = {
                ...e,
                target: { ...e.target, value: e.target.value },
              } as unknown as React.ChangeEvent<HTMLInputElement>;
              onChange(syntheticEvent);
            }
          }}
          disabled={disabled}
          required={required}
          rows={rows}
          {...(otherProps as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
        {error && <small className="form-error">{error}</small>}
        {hint && !error && <small className="form-hint">{hint}</small>}
      </div>
    );
  }

  return (
    <Input
      type={type}
      label={label}
      error={error}
      hint={hint}
      fullWidth={fullWidth}
      id={fieldId}
      className={className}
      placeholder={placeholder}
      value={value}
      disabled={disabled}
      required={required}
      onChange={onChange}
      {...otherProps}
    />
  );
};

export default FormField;
