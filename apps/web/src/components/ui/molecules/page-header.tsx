"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Text } from "../atoms/text"
import { Button } from "../button"

const pageHeaderVariants = cva(
  "flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4 mb-6",
  {
    variants: {
      variant: {
        default: "border-b border-border",
        simple: "border-none pb-0 mb-4",
        compact: "pb-2 mb-4",
      },
      align: {
        start: "items-start",
        center: "items-center",
        end: "items-end",
      },
    },
    defaultVariants: {
      variant: "default",
      align: "start",
    },
  }
)

export interface PageHeaderProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof pageHeaderVariants> {
  title: string
  description?: string
  action?: React.ReactNode
  subtitle?: string
  breadcrumb?: React.ReactNode
}

function PageHeader({
  className,
  variant,
  align,
  title,
  description,
  action,
  subtitle,
  breadcrumb,
  ...props
}: PageHeaderProps) {
  return (
    <div className={cn(pageHeaderVariants({ variant, align }), className)} {...props}>
      <div className="min-w-0 flex-1">
        {breadcrumb && <div className="mb-2">{breadcrumb}</div>}
        
        <div className="flex items-center gap-3 mb-1">
          <Text as="h1" size="2xl" weight="semibold" className="tracking-tight">
            {title}
          </Text>
          {subtitle && (
            <Text variant="muted" size="sm" className="mt-1">
              {subtitle}
            </Text>
          )}
        </div>
        
        {description && (
          <Text variant="muted" size="sm" className="max-w-2xl">
            {description}
          </Text>
        )}
      </div>
      
      {action && (
        <div className="flex items-center gap-2 shrink-0">
          {action}
        </div>
      )}
    </div>
  )
}

// Convenience components for common patterns
const PageHeaderAction = {
  Primary: ({ children, ...props }: React.ComponentProps<typeof Button>) => (
    <Button variant="default" {...props}>
      {children}
    </Button>
  ),
  Secondary: ({ children, ...props }: React.ComponentProps<typeof Button>) => (
    <Button variant="outline" {...props}>
      {children}
    </Button>
  ),
  Group: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={cn("flex items-center gap-2", className)}>
      {children}
    </div>
  ),
}

export { PageHeader, pageHeaderVariants, PageHeaderAction }
