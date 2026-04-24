"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Label } from "../atoms/label"
import { Input, Select, Textarea } from "../atoms/input"
import { Text } from "../atoms/text"

const formFieldVariants = cva(
  "space-y-2",
  {
    variants: {
      variant: {
        default: "",
        inline: "flex items-center space-y-0 space-x-3",
        compact: "space-y-1",
      },
      size: {
        sm: "",
        md: "",
        lg: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)

export interface FormFieldProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof formFieldVariants> {
  label?: string
  description?: string
  error?: string
  required?: boolean
  children: React.ReactNode
  htmlFor?: string
}

function FormField({
  className,
  variant,
  size,
  label,
  description,
  error,
  required,
  children,
  htmlFor,
  ...props
}: FormFieldProps) {
  const generatedId = React.useId()
  const fieldId = htmlFor || generatedId
  
  // Clone children to pass the field ID and error state
  const childrenWithProps = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child as React.ReactElement<any>, {
        id: fieldId,
        "aria-describedby": error ? `${fieldId}-error` : description ? `${fieldId}-description` : undefined,
        "aria-invalid": !!error,
        variant: error ? "error" : (child.props as any).variant,
      })
    }
    return child
  })

  if (variant === "inline") {
    return (
      <div className={cn(formFieldVariants({ variant, size }), className)} {...props}>
        <div className="flex-1">
          {childrenWithProps}
        </div>
        {label && (
          <Label 
            htmlFor={fieldId}
            required={required}
            variant={error ? "error" : "default"}
            size={size}
          >
            {label}
          </Label>
        )}
      </div>
    )
  }

  return (
    <div className={cn(formFieldVariants({ variant, size }), className)} {...props}>
      {label && (
        <Label 
          htmlFor={fieldId}
          required={required}
          variant={error ? "error" : "default"}
          size={size}
        >
          {label}
        </Label>
      )}
      
      {description && !error && (
        <Text 
          id={`${fieldId}-description`}
          variant="muted" 
          size="sm"
        >
          {description}
        </Text>
      )}
      
      <div>
        {childrenWithProps}
      </div>
      
      {error && (
        <Text 
          id={`${fieldId}-error`}
          variant="error" 
          size="sm"
          role="alert"
          aria-live="polite"
        >
          {error}
        </Text>
      )}
    </div>
  )
}

// Convenience components that combine FormField with common input types
const FormInput = React.forwardRef<
  HTMLInputElement,
  Omit<FormFieldProps, 'children'> & React.ComponentProps<typeof Input>
>(({ label, description, error, required, className, variant: fieldVariant, size: fieldSize, htmlFor, ...inputProps }, ref) => (
  <FormField 
    label={label} 
    description={description} 
    error={error} 
    required={required}
    variant={fieldVariant}
    size={fieldSize}
    htmlFor={htmlFor}
  >
    <Input ref={ref} className={className} {...inputProps} />
  </FormField>
))
FormInput.displayName = "FormInput"

const FormSelect = React.forwardRef<
  HTMLSelectElement,
  Omit<FormFieldProps, 'children'> & React.ComponentProps<typeof Select>
>(({ label, description, error, required, className, variant: fieldVariant, size: fieldSize, htmlFor, children, ...selectProps }, ref) => (
  <FormField 
    label={label} 
    description={description} 
    error={error} 
    required={required}
    variant={fieldVariant}
    size={fieldSize}
    htmlFor={htmlFor}
  >
    <Select ref={ref} className={className} {...selectProps}>
      {children}
    </Select>
  </FormField>
))
FormSelect.displayName = "FormSelect"

const FormTextarea = React.forwardRef<
  HTMLTextAreaElement,
  Omit<FormFieldProps, 'children'> & React.ComponentProps<typeof Textarea>
>(({ label, description, error, required, className, variant: fieldVariant, size: fieldSize, htmlFor, ...textareaProps }, ref) => (
  <FormField 
    label={label} 
    description={description} 
    error={error} 
    required={required}
    variant={fieldVariant}
    size={fieldSize}
    htmlFor={htmlFor}
  >
    <Textarea ref={ref} className={className} {...textareaProps} />
  </FormField>
))
FormTextarea.displayName = "FormTextarea"

export { FormField, FormInput, FormSelect, FormTextarea, formFieldVariants }
