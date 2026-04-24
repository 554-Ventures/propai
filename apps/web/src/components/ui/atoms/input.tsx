"use client"

import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "@/lib/utils"

const inputVariants = cva(
  "flex w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-input",
        error: "border-destructive focus-visible:ring-destructive",
        success: "border-green-500 focus-visible:ring-green-500",
      },
      size: {
        xs: "h-7 px-2 py-1 text-xs",
        sm: "h-8 px-2.5 py-1.5 text-xs",
        md: "h-9 px-3 py-2 text-sm",
        lg: "h-10 px-3 py-2.5 text-sm",
        xl: "h-11 px-4 py-3 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, size, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

const Select = React.forwardRef<HTMLSelectElement, Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> & VariantProps<typeof inputVariants>>(
  ({ className, variant, size, children, ...props }, ref) => {
    return (
      <select
        className={cn(
          inputVariants({ variant, size }),
          "cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 4 5%22><path fill=%22%236b7280%22 d=%22M2 0L0 2h4zm0 5L0 3h4z%22/></svg>')] bg-[length:12px] bg-[position:right_8px_center] bg-no-repeat",
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    )
  }
)
Select.displayName = "Select"

const Textarea = React.forwardRef<HTMLTextAreaElement, Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> & VariantProps<typeof inputVariants>>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          inputVariants({ variant, size }),
          "min-h-[80px] resize-y",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Input, Select, Textarea, inputVariants }
