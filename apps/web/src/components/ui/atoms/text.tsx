"use client"

import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "@/lib/utils"

const textVariants = cva(
  "text-foreground",
  {
    variants: {
      variant: {
        default: "text-foreground",
        muted: "text-muted-foreground",
        primary: "text-primary",
        secondary: "text-secondary-foreground",
        success: "text-green-700 dark:text-green-400",
        warning: "text-yellow-700 dark:text-yellow-400",
        error: "text-destructive",
        accent: "text-accent-foreground",
      },
      size: {
        xs: "text-xs",
        sm: "text-sm", 
        md: "text-base",
        lg: "text-lg",
        xl: "text-xl",
        "2xl": "text-2xl",
        "3xl": "text-3xl",
      },
      weight: {
        normal: "font-normal",
        medium: "font-medium",
        semibold: "font-semibold",
        bold: "font-bold",
      },
      align: {
        left: "text-left",
        center: "text-center",
        right: "text-right",
      },
      truncate: {
        true: "truncate",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      weight: "normal",
      align: "left",
      truncate: false,
    },
  }
)

type ElementType = "p" | "span" | "div" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6"

export interface TextProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof textVariants> {
  asChild?: boolean
  as?: ElementType
}

function Text({
  className,
  variant,
  size,
  weight,
  align,
  truncate,
  asChild = false,
  as = "p",
  ...props
}: TextProps) {
  const Comp = asChild ? Slot : as
  return (
    <Comp
      className={cn(textVariants({ variant, size, weight, align, truncate }), className)}
      {...props}
    />
  )
}

export { Text, textVariants }
