"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "../atoms/badge"
import { Text } from "../atoms/text"
import { Button } from "../button"

const dataCardVariants = cva(
  "rounded-lg border border-border bg-card text-card-foreground shadow-sm transition-all duration-200",
  {
    variants: {
      variant: {
        default: "hover:shadow-md",
        interactive: "cursor-pointer hover:shadow-md hover:border-ring/20 hover:bg-accent/5",
        outlined: "border-2",
        ghost: "border-transparent bg-transparent shadow-none hover:bg-muted/50",
      },
      size: {
        sm: "p-3",
        md: "p-4", 
        lg: "p-6",
        xl: "p-8",
      },
      status: {
        default: "",
        success: "ring-1 ring-green-500/20 border-green-500/20",
        warning: "ring-1 ring-yellow-500/20 border-yellow-500/20",
        error: "ring-1 ring-destructive/20 border-destructive/20",
        info: "ring-1 ring-blue-500/20 border-blue-500/20",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      status: "default",
    },
  }
)

export interface DataCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof dataCardVariants> {
  title: string
  subtitle?: string
  description?: string
  icon?: LucideIcon
  badge?: React.ReactNode
  action?: React.ReactNode
  footer?: React.ReactNode
  stats?: Array<{ label: string; value: string | number; variant?: 'default' | 'success' | 'warning' | 'error' }>
  trend?: {
    direction: 'up' | 'down' | 'neutral'
    label: string
    color: 'success' | 'warning' | 'error' | 'neutral'
  }
  value?: string | number
  detail?: string
  loading?: boolean
  asChild?: boolean
}

function DataCard({
  className,
  variant,
  size,
  status,
  title,
  subtitle,
  description,
  icon: Icon,
  badge,
  action,
  footer,
  stats,
  trend,
  value,
  detail,
  loading,
  onClick,
  ...props
}: DataCardProps) {
  const isInteractive = onClick || variant === "interactive"
  
  // Simple metric card layout (for dashboard-style cards)
  if (value !== undefined && !stats && !description) {
    const trendColors = {
      success: "text-green-400",
      warning: "text-yellow-400", 
      error: "text-red-400",
      neutral: "text-muted-foreground"
    }
    
    const trendIcons = {
      up: "↗",
      down: "↘", 
      neutral: "↔"
    }
    
    return (
      <div
        className={cn(
          dataCardVariants({ variant: isInteractive ? "interactive" : variant, size, status }),
          className
        )}
        onClick={onClick}
        {...props}
      >
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{title}</p>
          <p className="text-2xl font-semibold text-foreground">{value}</p>
          <div className="flex items-center justify-between">
            {detail && <p className="text-xs text-muted-foreground">{detail}</p>}
            {trend && (
              <span className={`text-sm ${trendColors[trend.color]}`} title={`Trend: ${trend.label}`}>
                {trendIcons[trend.direction]}
              </span>
            )}
          </div>
        </div>
      </div>
    )
  }
  
  // Standard complex card layout
  // Standard complex card layout
  return (
    <div
      className={cn(
        dataCardVariants({ variant: isInteractive ? "interactive" : variant, size, status }),
        className
      )}
      onClick={onClick}
      {...props}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {Icon && (
            <div className="shrink-0 mt-0.5">
              <Icon className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
          
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Text as="h3" weight="semibold" truncate className="flex-1">
                {title}
              </Text>
              {badge}
            </div>
            
            {subtitle && (
              <Text variant="muted" size="sm" truncate>
                {subtitle}
              </Text>
            )}
          </div>
        </div>
        
        {action && (
          <div className="shrink-0">
            {action}
          </div>
        )}
      </div>
      
      {/* Description */}
      {description && (
        <Text variant="muted" size="sm" className="mb-4">
          {description}
        </Text>
      )}
      
      {/* Stats Grid */}
      {stats && stats.length > 0 && (
        <div className="grid grid-cols-2 gap-4 mb-4">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <Text 
                size="lg" 
                weight="semibold" 
                variant={stat.variant === 'success' ? 'success' : 
                        stat.variant === 'warning' ? 'warning' :
                        stat.variant === 'error' ? 'error' : 'default'}
              >
                {stat.value}
              </Text>
              <Text variant="muted" size="xs" className="mt-1">
                {stat.label}
              </Text>
            </div>
          ))}
        </div>
      )}
      
      {/* Footer */}
      {footer && (
        <div className="border-t border-border pt-3 mt-4">
          {footer}
        </div>
      )}
    </div>
  )
}

// Convenience components for common patterns
const DataCardAction = {
  Button: ({ children, ...props }: React.ComponentProps<typeof Button>) => (
    <Button size="sm" variant="ghost" {...props}>
      {children}
    </Button>
  ),
  Badge: ({ children, ...props }: React.ComponentProps<typeof Badge>) => (
    <Badge size="sm" {...props}>
      {children}
    </Badge>
  ),
}

export { DataCard, dataCardVariants, DataCardAction }
