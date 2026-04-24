"use client"

import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "@/lib/utils"

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
  {
    variants: {
      variant: {
        default: "text-foreground",
        error: "text-destructive",
        success: "text-green-700 dark:text-green-400",
        muted: "text-muted-foreground",
      },
      size: {
        xs: "text-xs",
        sm: "text-sm",
        md: "text-sm",
        lg: "text-base",
        xl: "text-lg",
      },
      required: {
        true: "after:content-['*'] after:text-destructive after:ml-1",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      required: false,
    },
  }
)

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement>,
    VariantProps<typeof labelVariants> {
  required?: boolean
}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, variant, size, required, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(labelVariants({ variant, size, required }), className)}
      {...props}
    />
  )
)
Label.displayName = "Label"

export { Label, labelVariants }
