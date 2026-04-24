"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { PageHeader } from "../ui/molecules/page-header"
import { DataCard } from "../ui/molecules/data-card"
import { Skeleton } from "../ui/atoms/skeleton"

const dashboardVariants = cva(
  "space-y-6",
  {
    variants: {
      layout: {
        default: "gap-6",
        compact: "gap-4",
        spacious: "gap-8",
      },
      gridSize: {
        small: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
        medium: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4", 
        large: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
      },
    },
    defaultVariants: {
      layout: "default",
      gridSize: "medium",
    },
  }
)

export interface MetricDefinition {
  id: string
  title: string
  value: string | number
  description?: string
  trend?: {
    direction: 'up' | 'down' | 'neutral'
    label: string
    color?: 'success' | 'warning' | 'error' | 'neutral'
  }
  status?: 'success' | 'warning' | 'error' | 'info'
  loading?: boolean
  action?: React.ReactNode
}

export interface DashboardSection {
  id: string
  title: string
  description?: string
  content: React.ReactNode
  action?: React.ReactNode
  loading?: boolean
  className?: string
}

export interface DashboardTemplateProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof dashboardVariants> {
  title: string
  description?: string
  headerAction?: React.ReactNode
  metrics?: MetricDefinition[]
  sections?: DashboardSection[]
  loading?: boolean
  error?: string
  onRetry?: () => void
}

function DashboardTemplate({
  className,
  layout,
  gridSize,
  title,
  description,
  headerAction,
  metrics = [],
  sections = [],
  loading = false,
  error,
  onRetry,
  ...props
}: DashboardTemplateProps) {
  return (
    <div className={cn(dashboardVariants({ layout }), className)} {...props}>
      <PageHeader
        title={title}
        description={description}
        action={headerAction}
      />

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4">
          <p className="text-sm text-destructive mb-2">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-xs text-destructive hover:text-destructive/80 underline"
            >
              Try again
            </button>
          )}
        </div>
      )}

      {/* Metrics Grid */}
      {metrics.length > 0 && (
        <div className={cn("grid gap-4", dashboardVariants({ gridSize }))}>
          {loading && !metrics.length
            ? Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} variant="card" className="h-24" />
              ))
            : metrics.map((metric) => (
                <DataCard
                  key={metric.id}
                  title={metric.title}
                  value={metric.loading ? undefined : metric.value}
                  description={metric.description}
                  trend={metric.trend ? { ...metric.trend, color: metric.trend.color || 'neutral' } : undefined}
                  status={metric.status}
                  action={metric.action}
                  loading={metric.loading}
                  size="sm"
                />
              ))}
        </div>
      )}

      {/* Dynamic Sections */}
      {sections.map((section) => (
        <section
          key={section.id}
          className={cn(
            "rounded-lg border border-border bg-card p-6",
            section.className
          )}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-card-foreground">
                {section.title}
              </h3>
              {section.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {section.description}
                </p>
              )}
            </div>
            {section.action && (
              <div className="shrink-0 ml-4">
                {section.action}
              </div>
            )}
          </div>

          <div className="min-h-0">
            {section.loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              section.content
            )}
          </div>
        </section>
      ))}
    </div>
  )
}

export { DashboardTemplate }