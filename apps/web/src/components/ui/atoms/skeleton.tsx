"use client"

import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "@/lib/utils"

const skeletonVariants = cva(
  "animate-pulse rounded-md bg-muted",
  {
    variants: {
      variant: {
        default: "bg-muted",
        card: "bg-card border border-border",
        text: "bg-muted/60",
        avatar: "bg-muted rounded-full",
        button: "bg-muted/80",
      },
      size: {
        xs: "h-3",
        sm: "h-4",
        md: "h-5", 
        lg: "h-6",
        xl: "h-8",
        "2xl": "h-10",
        "3xl": "h-12",
      },
      width: {
        xs: "w-8",
        sm: "w-16",
        md: "w-24",
        lg: "w-32",
        xl: "w-48",
        "2xl": "w-64",
        full: "w-full",
        auto: "w-auto",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md", 
      width: "full",
    },
  }
)

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {}

function Skeleton({ className, variant, size, width, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(skeletonVariants({ variant, size, width }), className)}
      {...props}
    />
  )
}

// Common skeleton patterns
const SkeletonText = ({ lines = 1, className }: { lines?: number; className?: string }) => (
  <div className={cn("space-y-2", className)}>
    {Array.from({ length: lines }, (_, i) => (
      <Skeleton
        key={i}
        variant="text"
        size="sm"
        width={i === lines - 1 ? "lg" : "full"} 
      />
    ))}
  </div>
)

const SkeletonCard = ({ className }: { className?: string }) => (
  <div className={cn("p-4 space-y-3", className)}>
    <div className="flex items-center space-x-3">
      <Skeleton variant="avatar" size="lg" width="lg" />
      <div className="space-y-1 flex-1">
        <Skeleton size="md" width="lg" />
        <Skeleton size="sm" width="md" />
      </div>
    </div>
    <SkeletonText lines={2} />
  </div>
)

const SkeletonTable = ({ rows = 3, cols = 4, className }: { rows?: number; cols?: number; className?: string }) => (
  <div className={cn("space-y-3", className)}>
    <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {Array.from({ length: cols }, (_, i) => (
        <Skeleton key={`header-${i}`} size="md" width="full" />
      ))}
    </div>
    {Array.from({ length: rows }, (_, rowIndex) => (
      <div key={`row-${rowIndex}`} className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }, (_, colIndex) => (
          <Skeleton key={`cell-${rowIndex}-${colIndex}`} size="sm" width="full" />
        ))}
      </div>
    ))}
  </div>
)

export { Skeleton, SkeletonText, SkeletonCard, SkeletonTable, skeletonVariants }
