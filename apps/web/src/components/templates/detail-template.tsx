"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { PageHeader } from "../ui/molecules/page-header"
import { Badge } from "../ui/atoms/badge"
import { Skeleton } from "../ui/atoms/skeleton"

const detailTemplateVariants = cva(
  "space-y-6",
  {
    variants: {
      layout: {
        default: "space-y-6",
        sidebar: "lg:grid lg:grid-cols-12 lg:gap-6 lg:space-y-0 space-y-6",
        tabs: "space-y-6",
        split: "xl:grid xl:grid-cols-3 xl:gap-8 xl:space-y-0 space-y-6",
      },
      spacing: {
        compact: "space-y-4",
        comfortable: "space-y-6", 
        spacious: "space-y-8",
      },
    },
    defaultVariants: {
      layout: "default",
      spacing: "comfortable",
    },
  }
)

export interface DetailField {
  id: string
  label: string
  value: React.ReactNode
  type?: 'text' | 'badge' | 'date' | 'currency' | 'link' | 'custom'
  copyable?: boolean
  editable?: boolean
  onEdit?: (value: string) => void
  loading?: boolean
  className?: string
}

export interface DetailSection {
  id: string
  title: string
  description?: string
  fields?: DetailField[]
  content?: React.ReactNode
  action?: React.ReactNode
  collapsible?: boolean
  defaultCollapsed?: boolean
  loading?: boolean
  className?: string
}

export interface DetailTab {
  id: string
  label: string
  content: React.ReactNode
  badge?: string | number
  disabled?: boolean
}

export interface DetailTemplateProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof detailTemplateVariants> {
  title: string
  subtitle?: string
  description?: string
  headerAction?: React.ReactNode
  breadcrumb?: React.ReactNode
  
  // Status & Meta
  status?: {
    variant: 'success' | 'warning' | 'error' | 'info' | 'default'
    label: string
  }
  badges?: Array<{
    id: string
    label: string
    variant?: 'default' | 'secondary' | 'destructive' | 'outline'
  }>
  
  // Content Structure
  sections?: DetailSection[]
  tabs?: DetailTab[]
  activeTab?: string
  onTabChange?: (tabId: string) => void
  
  // Sidebar Content (for sidebar layout)
  sidebarContent?: React.ReactNode
  sidebarTitle?: string
  
  // Loading & Error States
  loading?: boolean
  error?: string
  onRetry?: () => void
  
  // Actions
  primaryAction?: React.ReactNode
  secondaryActions?: React.ReactNode[]
}

function DetailTemplate({
  className,
  layout,
  spacing,
  title,
  subtitle,
  description,
  headerAction,
  breadcrumb,
  status,
  badges = [],
  sections = [],
  tabs = [],
  activeTab,
  onTabChange,
  sidebarContent,
  sidebarTitle,
  loading = false,
  error,
  onRetry,
  primaryAction,
  secondaryActions = [],
  ...props
}: DetailTemplateProps) {
  const [collapsedSections, setCollapsedSections] = React.useState<Set<string>>(
    new Set(sections.filter(s => s.collapsible && s.defaultCollapsed).map(s => s.id))
  )

  const toggleSection = (sectionId: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev)
      if (next.has(sectionId)) {
        next.delete(sectionId)
      } else {
        next.add(sectionId)
      }
      return next
    })
  }

  const renderField = (field: DetailField) => {
    if (field.loading) {
      return <Skeleton className="h-4 w-24" />
    }

    switch (field.type) {
      case 'badge':
        return typeof field.value === 'string' ? (
          <Badge variant="secondary">{field.value}</Badge>
        ) : field.value

      case 'currency':
        return <span className="font-medium text-foreground">{field.value}</span>

      case 'date':
        return <span className="text-muted-foreground">{field.value}</span>

      case 'link':
        return <a href="#" className="text-primary hover:text-primary/80 underline">{field.value}</a>

      default:
        return field.value
    }
  }

  const renderSection = (section: DetailSection) => {
    const isCollapsed = collapsedSections.has(section.id)

    return (
      <section
        key={section.id}
        className={cn(
          "rounded-lg border border-border bg-card",
          section.className
        )}
      >
        {/* Section Header */}
        <div className="flex items-start justify-between p-4 pb-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-semibold text-card-foreground">
                {section.title}
              </h3>
              {section.collapsible && (
                <button
                  onClick={() => toggleSection(section.id)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {isCollapsed ? '▶' : '▼'}
                </button>
              )}
            </div>
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

        {/* Section Content */}
        {!isCollapsed && (
          <div className="p-4">
            {section.loading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </div>
            ) : section.fields ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {section.fields.map((field) => (
                  <div key={field.id} className={cn("space-y-1", field.className)}>
                    <dt className="text-sm font-medium text-muted-foreground">
                      {field.label}
                    </dt>
                    <dd className="text-sm">
                      {renderField(field)}
                    </dd>
                  </div>
                ))}
              </div>
            ) : (
              section.content
            )}
          </div>
        )}
      </section>
    )
  }

  const renderTabs = () => {
    if (tabs.length === 0) return null

    return (
      <div className="space-y-4">
        {/* Tab Navigation */}
        <div className="border-b border-border">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange?.(tab.id)}
                disabled={tab.disabled}
                className={cn(
                  "py-2 px-1 border-b-2 font-medium text-sm transition-colors",
                  activeTab === tab.id || (!activeTab && tab.id === tabs[0].id)
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border",
                  tab.disabled && "opacity-50 cursor-not-allowed"
                )}
              >
                <span className="flex items-center gap-2">
                  {tab.label}
                  {tab.badge && (
                    <Badge variant="secondary" className="text-xs">
                      {tab.badge}
                    </Badge>
                  )}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div>
          {tabs.find(tab => 
            activeTab ? tab.id === activeTab : tab.id === tabs[0].id
          )?.content}
        </div>
      </div>
    )
  }

  if (loading && sections.length === 0) {
    return (
      <div className={cn(detailTemplateVariants({ layout, spacing }), className)}>
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
          <div className="grid gap-6 mt-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} variant="card" className="h-48" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  const headerElement = (
    <PageHeader
      title={title}
      subtitle={subtitle}
      description={description}
      breadcrumb={breadcrumb}
      action={
        <div className="flex items-center gap-2">
          {secondaryActions.map((action, i) => (
            <div key={i}>{action}</div>
          ))}
          {primaryAction}
          {headerAction}
        </div>
      }
    />
  )

  const statusElement = (status || badges.length > 0) && (
    <div className="flex items-center gap-3">
      {status && (
        <Badge variant={status.variant as "default" | "secondary" | "outline" | "error" | "success" | "warning"}>
          {status.label}
        </Badge>
      )}
      {badges.map((badge) => (
        <Badge key={badge.id} variant={badge.variant === 'destructive' ? 'error' : badge.variant}>
          {badge.label}
        </Badge>
      ))}
    </div>
  )

  const errorElement = error && (
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
  )

  if (layout === 'sidebar') {
    return (
      <div className={cn(detailTemplateVariants({ layout, spacing }), className)} {...props}>
        <div className="lg:col-span-8">
          {headerElement}
          {statusElement}
          {errorElement}
          
          {tabs.length > 0 ? renderTabs() : (
            <div className="space-y-6">
              {sections.map(renderSection)}
            </div>
          )}
        </div>
        
        {sidebarContent && (
          <div className="lg:col-span-4">
            <div className="sticky top-6 space-y-6">
              {sidebarTitle && (
                <h3 className="text-lg font-semibold text-foreground">
                  {sidebarTitle}
                </h3>
              )}
              {sidebarContent}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={cn(detailTemplateVariants({ layout, spacing }), className)} {...props}>
      {headerElement}
      {statusElement}
      {errorElement}
      
      {tabs.length > 0 ? renderTabs() : (
        <div className="space-y-6">
          {sections.map(renderSection)}
        </div>
      )}
    </div>
  )
}

export { DetailTemplate }