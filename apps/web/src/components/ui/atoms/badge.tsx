"use client"

import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        success:
          "border-transparent bg-green-500/10 text-green-700 ring-1 ring-green-500/20 dark:bg-green-500/20 dark:text-green-400 dark:ring-green-500/30",
        warning:
          "border-transparent bg-yellow-500/10 text-yellow-800 ring-1 ring-yellow-500/20 dark:bg-yellow-500/20 dark:text-yellow-400 dark:ring-yellow-500/30",
        error:
          "border-transparent bg-destructive/10 text-destructive ring-1 ring-destructive/20 dark:bg-destructive/20 dark:text-destructive dark:ring-destructive/30",
        outline: "text-foreground border-border",
      },
      size: {
        xs: "px-1.5 py-0.5 text-[10px] rounded-md",
        sm: "px-2 py-0.5 text-xs rounded-md", 
        md: "px-2.5 py-0.5 text-xs rounded-full",
        lg: "px-3 py-1 text-sm rounded-full",
        xl: "px-4 py-1.5 text-sm rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  asChild?: boolean
}

function Badge({ className, variant, size, asChild = false, ...props }: BadgeProps) {
  const Comp = asChild ? Slot : "div"
  return (
    <Comp
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
