'use client';

import React from 'react';
import { UseFormReturn, FieldPath, FieldValues } from 'react-hook-form';
import { Input } from './input';
import { InputGroup, InputGroupAddon, InputGroupInput } from './input-group';
import { Label } from './label';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ValidatedInputProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  form: UseFormReturn<TFieldValues>;
  name: TName;
  label?: string;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'url' | 'tel' | 'number' | 'search';
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
  required?: boolean;
  className?: string;
  inputClassName?: string;
  labelClassName?: string;
  description?: string;
  'data-testid'?: string;
}

/**
 * Input component with built-in validation and error handling
 */
export function ValidatedInput<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  form,
  name,
  label,
  placeholder,
  type = 'text',
  icon: Icon,
  iconPosition = 'left',
  disabled = false,
  required = false,
  className,
  inputClassName,
  labelClassName,
  description,
  'data-testid': testId,
}: ValidatedInputProps<TFieldValues, TName>) {
  const {
    register,
    formState: { errors, touchedFields, dirtyFields },
  } = form;

  const fieldError = errors[name];
  const isTouched = Boolean(touchedFields[name as keyof typeof touchedFields]);
  const isDirty = Boolean(dirtyFields[name as keyof typeof dirtyFields]);
  const hasError = !!fieldError;

  // Get error message
  const errorMessage = fieldError?.message as string;

  // Determine field state for styling
  const getFieldState = () => {
    if (hasError && isTouched) return 'error';
    if (isDirty && !hasError) return 'success';
    return 'default';
  };

  const fieldState = getFieldState();

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label
          htmlFor={name}
          className={cn(
            labelClassName,
            required && "after:content-['*'] after:ml-0.5 after:text-red-500",
            hasError && isTouched && 'text-red-600'
          )}
        >
          {label}
        </Label>
      )}

      <InputGroup>
        {Icon && iconPosition === 'left' && (
          <InputGroupAddon>
            <Icon className={cn(
              'size-4',
              hasError && isTouched ? 'text-red-500' : 'text-gray-500'
            )} />
          </InputGroupAddon>
        )}

        <InputGroupInput
          id={name}
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            inputClassName,
            fieldState === 'error' && 'border-red-500 focus:border-red-500 focus:ring-red-500',
            fieldState === 'success' && 'border-green-500 focus:border-green-500 focus:ring-green-500'
          )}
          data-testid={testId}
          {...register(name)}
        />

        {Icon && iconPosition === 'right' && (
          <InputGroupAddon>
            <Icon className={cn(
              'size-4',
              hasError && isTouched ? 'text-red-500' : 'text-gray-500'
            )} />
          </InputGroupAddon>
        )}
      </InputGroup>

      {description && !hasError && (
        <p className="text-sm text-gray-600">{description}</p>
      )}

      {hasError && isTouched && errorMessage && (
        <p className="text-sm text-red-600 flex items-center gap-1" role="alert">
          <span className="text-red-500">⚠</span>
          {errorMessage}
        </p>
      )}
    </div>
  );
}

/**
 * Textarea component with validation
 */
interface ValidatedTextareaProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  form: UseFormReturn<TFieldValues>;
  name: TName;
  label?: string;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  labelClassName?: string;
  description?: string;
  'data-testid'?: string;
}

export function ValidatedTextarea<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  form,
  name,
  label,
  placeholder,
  rows = 3,
  disabled = false,
  required = false,
  className,
  labelClassName,
  description,
  'data-testid': testId,
}: ValidatedTextareaProps<TFieldValues, TName>) {
  const {
    register,
    formState: { errors, touchedFields, dirtyFields },
  } = form;

  const fieldError = errors[name];
  const isTouched = Boolean(touchedFields[name as keyof typeof touchedFields]);
  const isDirty = Boolean(dirtyFields[name as keyof typeof dirtyFields]);
  const hasError = !!fieldError;
  const errorMessage = fieldError?.message as string;

  const fieldState = hasError && isTouched ? 'error' : isDirty && !hasError ? 'success' : 'default';

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label
          htmlFor={name}
          className={cn(
            labelClassName,
            required && "after:content-['*'] after:ml-0.5 after:text-red-500",
            hasError && isTouched && 'text-red-600'
          )}
        >
          {label}
        </Label>
      )}

      <textarea
        id={name}
        rows={rows}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          'flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          fieldState === 'error' && 'border-red-500 focus:border-red-500 focus:ring-red-500',
          fieldState === 'success' && 'border-green-500 focus:border-green-500 focus:ring-green-500'
        )}
        data-testid={testId}
        {...register(name)}
      />

      {description && !hasError && (
        <p className="text-sm text-gray-600">{description}</p>
      )}

      {hasError && isTouched && errorMessage && (
        <p className="text-sm text-red-600 flex items-center gap-1" role="alert">
          <span className="text-red-500">⚠</span>
          {errorMessage}
        </p>
      )}
    </div>
  );
}

/**
 * Select component with validation
 */
interface ValidatedSelectProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  form: UseFormReturn<TFieldValues>;
  name: TName;
  label?: string;
  placeholder?: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  labelClassName?: string;
  description?: string;
  'data-testid'?: string;
}

export function ValidatedSelect<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  form,
  name,
  label,
  placeholder = 'Select an option',
  options,
  disabled = false,
  required = false,
  className,
  labelClassName,
  description,
  'data-testid': testId,
}: ValidatedSelectProps<TFieldValues, TName>) {
  const {
    register,
    formState: { errors, touchedFields, dirtyFields },
  } = form;

  const fieldError = errors[name];
  const isTouched = Boolean(touchedFields[name as keyof typeof touchedFields]);
  const isDirty = Boolean(dirtyFields[name as keyof typeof dirtyFields]);
  const hasError = !!fieldError;
  const errorMessage = fieldError?.message as string;

  const fieldState = hasError && isTouched ? 'error' : isDirty && !hasError ? 'success' : 'default';

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label
          htmlFor={name}
          className={cn(
            labelClassName,
            required && "after:content-['*'] after:ml-0.5 after:text-red-500",
            hasError && isTouched && 'text-red-600'
          )}
        >
          {label}
        </Label>
      )}

      <select
        id={name}
        disabled={disabled}
        className={cn(
          'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          fieldState === 'error' && 'border-red-500 focus:border-red-500 focus:ring-red-500',
          fieldState === 'success' && 'border-green-500 focus:border-green-500 focus:ring-green-500'
        )}
        data-testid={testId}
        {...register(name)}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>

      {description && !hasError && (
        <p className="text-sm text-gray-600">{description}</p>
      )}

      {hasError && isTouched && errorMessage && (
        <p className="text-sm text-red-600 flex items-center gap-1" role="alert">
          <span className="text-red-500">⚠</span>
          {errorMessage}
        </p>
      )}
    </div>
  );
}

/**
 * Checkbox component with validation
 */
interface ValidatedCheckboxProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  form: UseFormReturn<TFieldValues>;
  name: TName;
  label?: string;
  description?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  'data-testid'?: string;
}

export function ValidatedCheckbox<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  form,
  name,
  label,
  description,
  disabled = false,
  required = false,
  className,
  'data-testid': testId,
}: ValidatedCheckboxProps<TFieldValues, TName>) {
  const {
    register,
    formState: { errors, touchedFields },
  } = form;

  const fieldError = errors[name];
  const isTouched = Boolean(touchedFields[name as keyof typeof touchedFields]);
  const hasError = !!fieldError;
  const errorMessage = fieldError?.message as string;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-start space-x-2">
        <input
          id={name}
          type="checkbox"
          disabled={disabled}
          className={cn(
            'peer h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            hasError && isTouched && 'border-red-500 focus:ring-red-500'
          )}
          data-testid={testId}
          {...register(name)}
        />
        {label && (
          <Label
            htmlFor={name}
            className={cn(
              'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
              required && "after:content-['*'] after:ml-0.5 after:text-red-500",
              hasError && isTouched && 'text-red-600'
            )}
          >
            {label}
          </Label>
        )}
      </div>

      {description && (
        <p className="text-sm text-gray-600 ml-6">{description}</p>
      )}

      {hasError && isTouched && errorMessage && (
        <p className="text-sm text-red-600 flex items-center gap-1 ml-6" role="alert">
          <span className="text-red-500">⚠</span>
          {errorMessage}
        </p>
      )}
    </div>
  );
}