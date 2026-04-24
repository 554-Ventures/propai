"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { PageHeader } from "../ui/molecules/page-header"
import { FormField } from "../ui/molecules/form-field"
import { Button } from "../ui/button"
import { Badge } from "../ui/atoms/badge"
import { Skeleton } from "../ui/atoms/skeleton"

const settingsTemplateVariants = cva(
  "space-y-6",
  {
    variants: {
      layout: {
        default: "max-w-4xl",
        sidebar: "lg:grid lg:grid-cols-12 lg:gap-8 lg:max-w-none lg:space-y-0 space-y-6",
        tabs: "max-w-none",
        stacked: "max-w-2xl",
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

export interface SettingsFieldDefinition {
  id: string
  name: string
  label: string
  description?: string
  type: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'switch' | 'checkbox' | 'radio' | 'file' | 'color' | 'custom'
  placeholder?: string
  required?: boolean
  disabled?: boolean
  value?: unknown
  defaultValue?: unknown
  options?: Array<{ value: string | number; label: string; description?: string }>
  validation?: {
    min?: number
    max?: number
    pattern?: RegExp
  }
  render?: (field: SettingsFieldDefinition, props: Record<string, unknown>) => React.ReactNode
  onChange?: (value: unknown) => void
  className?: string
}

export interface SettingsSection {
  id: string
  title: string
  description?: string
  icon?: React.ComponentType<{ className?: string }>
  fields: SettingsFieldDefinition[]
  actions?: Array<{
    label: string
    onClick: () => void
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost'
    disabled?: boolean
  }>
  badge?: {
    label: string
    variant: 'default' | 'secondary' | 'destructive' | 'outline'
  }
  collapsible?: boolean
  defaultCollapsed?: boolean
  loading?: boolean
  error?: string
  className?: string
}

export interface SettingsTab {
  id: string
  label: string
  description?: string
  icon?: React.ComponentType<{ className?: string }>
  sections: SettingsSection[]
  badge?: string | number
  disabled?: boolean
}

export interface SettingsNavItem {
  id: string
  label: string
  description?: string
  icon?: React.ComponentType<{ className?: string }>
  badge?: string | number
  disabled?: boolean
  href?: string
  onClick?: () => void
  children?: SettingsNavItem[]
}

export interface SettingsTemplateProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'onReset'>,
    VariantProps<typeof settingsTemplateVariants> {
  title: string
  description?: string
  
  // Content Structure  
  sections?: SettingsSection[]
  tabs?: SettingsTab[]
  activeTab?: string
  onTabChange?: (tabId: string) => void
  
  // Navigation (for sidebar layout)
  navigation?: SettingsNavItem[]
  activeNavItem?: string
  onNavChange?: (navId: string) => void
  
  // Form State
  values?: Record<string, unknown>
  errors?: Record<string, string>
  touched?: Record<string, boolean>
  hasChanges?: boolean
  
  // Form Handlers
  onSave?: (sectionId?: string) => void | Promise<void>
  onChange?: (field: string, value: unknown) => void
  onReset?: (sectionId?: string) => void
  
  // Loading & States
  saving?: boolean
  loading?: boolean
  globalError?: string
  successMessage?: string
  
  // Actions
  showGlobalSave?: boolean
  globalSaveLabel?: string
  showResetAll?: boolean
  extraHeaderActions?: React.ReactNode[]
}

function SettingsTemplate({
  className,
  layout,
  spacing,
  title,
  description,
  sections = [],
  tabs = [],
  activeTab,
  onTabChange,
  navigation = [],
  activeNavItem,
  onNavChange,
  values = {},
  errors = {},
  touched = {},
  hasChanges = false,
  onSave,
  onChange,
  onReset,
  saving = false,
  loading = false,
  globalError,
  successMessage,
  showGlobalSave = false,
  globalSaveLabel = "Save All Changes",
  showResetAll = false,
  extraHeaderActions = [],
  ...props
}: SettingsTemplateProps) {
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

  const renderField = (field: SettingsFieldDefinition) => {
    const value = values[field.name] ?? field.value ?? field.defaultValue
    const hasError = errors[field.name] && touched[field.name]
    
    const fieldProps = {
      value,
      onChange: (newValue: unknown) => {
        field.onChange?.(newValue)
        onChange?.(field.name, newValue)
      },
      disabled: field.disabled || saving,
      required: field.required,
      placeholder: field.placeholder,
      error: hasError ? errors[field.name] : undefined,
    }

    if (field.render) {
      return field.render(field, fieldProps)
    }

    const fieldElement = (() => {
      switch (field.type) {
        case 'switch':
          return (
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(value)}
                onChange={(e) => fieldProps.onChange(e.target.checked)}
                disabled={fieldProps.disabled}
                className="sr-only"
              />
              <div className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                value ? "bg-primary" : "bg-muted",
                fieldProps.disabled && "opacity-50 cursor-not-allowed"
              )}>
                <div className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-background transition-transform",
                  value ? "translate-x-6" : "translate-x-1"
                )} />
              </div>
              <span className="text-sm font-medium text-foreground">
                {field.label}
              </span>
            </label>
          )

        case 'textarea':
          return (
            <textarea
              value={String(value || '')}
              onChange={(e) => fieldProps.onChange(e.target.value)}
              disabled={fieldProps.disabled}
              required={fieldProps.required}
              placeholder={fieldProps.placeholder}
              rows={3}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
          )

        case 'select':
          return (
            <select
              value={String(value || '')}
              onChange={(e) => fieldProps.onChange(e.target.value)}
              disabled={fieldProps.disabled}
              required={fieldProps.required}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="">{field.placeholder || `Select ${field.label}`}</option>
              {field.options?.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )

        case 'checkbox':
          return (
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                checked={Boolean(value)}
                onChange={(e) => fieldProps.onChange(e.target.checked)}
                disabled={fieldProps.disabled}
                className="mt-0.5 rounded border border-border focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
              <div>
                <label className="text-sm font-medium text-foreground">
                  {field.label}
                </label>
                {field.description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {field.description}
                  </p>
                )}
              </div>
            </div>
          )

        case 'radio':
          return (
            <div className="space-y-3">
              {field.options?.map(option => (
                <div key={option.value} className="flex items-start space-x-3">
                  <input
                    type="radio"
                    name={field.name}
                    value={option.value}
                    checked={value === option.value}
                    onChange={() => fieldProps.onChange(option.value)}
                    disabled={fieldProps.disabled}
                    className="mt-0.5 border border-border focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  />
                  <div>
                    <label className="text-sm font-medium text-foreground">
                      {option.label}
                    </label>
                    {option.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {option.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )

        case 'color':
          return (
            <div className="flex items-center space-x-3">
              <input
                type="color"
                value={String(value || '#000000')}
                onChange={(e) => fieldProps.onChange(e.target.value)}
                disabled={fieldProps.disabled}
                className="w-12 h-8 rounded border border-border"
              />
              <input
                type="text"
                value={String(value || '')}
                onChange={(e) => fieldProps.onChange(e.target.value)}
                disabled={fieldProps.disabled}
                placeholder="#000000"
                className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
            </div>
          )

        case 'file':
          return (
            <input
              type="file"
              onChange={(e) => fieldProps.onChange(e.target.files?.[0] || null)}
              disabled={fieldProps.disabled}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
          )

        default:
          return (
            <input
              type={field.type}
              value={String(value || '')}
              onChange={(e) => fieldProps.onChange(e.target.value)}
              disabled={fieldProps.disabled}
              required={fieldProps.required}
              placeholder={fieldProps.placeholder}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
          )
      }
    })()

    if (field.type === 'switch' || field.type === 'checkbox' || field.type === 'radio') {
      return (
        <div key={field.id} className={cn("py-3", field.className)}>
          {fieldElement}
          {hasError && (
            <p className="text-xs text-destructive mt-2">
              {errors[field.name]}
            </p>
          )}
        </div>
      )
    }

    return (
      <FormField
        key={field.id}
        label={field.label}
        description={field.description}
        required={field.required}
        error={hasError ? errors[field.name] : undefined}
        className={field.className}
      >
        {fieldElement}
      </FormField>
    )
  }

  const renderSection = (section: SettingsSection) => {
    const isCollapsed = collapsedSections.has(section.id)
    const sectionHasChanges = section.fields.some(field => values[field.name] !== field.defaultValue)

    return (
      <section
        key={section.id}
        className={cn(
          "rounded-lg border border-border bg-card",
          section.className
        )}
      >
        {/* Section Header */}
        <div className="flex items-start justify-between p-6 pb-0">
          <div className="flex items-start space-x-3">
            {section.icon && (
              <section.icon className="w-5 h-5 text-muted-foreground mt-1" />
            )}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-card-foreground">
                  {section.title}
                </h3>
                {section.badge && (
                  <Badge variant={section.badge.variant === 'destructive' ? 'error' : section.badge.variant}>
                    {section.badge.label}
                  </Badge>
                )}
                {section.collapsible && (
                  <button
                    type="button"
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
          </div>

          {/* Section Actions */}
          <div className="flex items-center gap-2">
            {section.actions?.map((action, i) => (
              <Button
                key={i}
                variant={action.variant || "outline"}
                size="sm"
                onClick={action.onClick}
                disabled={action.disabled || saving}
              >
                {action.label}
              </Button>
            ))}
            
            {!showGlobalSave && onSave && (
              <Button
                variant="default"
                size="sm"
                onClick={() => onSave(section.id)}
                disabled={!sectionHasChanges || saving}
              >
                {saving ? "Saving..." : "Save"}
              </Button>
            )}
          </div>
        </div>

        {/* Section Content */}
        {!isCollapsed && (
          <div className="p-6 pt-4">
            {section.loading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : section.error ? (
              <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4">
                <p className="text-sm text-destructive">{section.error}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {section.fields.map(renderField)}
              </div>
            )}
          </div>
        )}
      </section>
    )
  }

  const renderNavigation = () => {
    if (navigation.length === 0) return null

    const renderNavItem = (item: SettingsNavItem, level = 0) => (
      <div key={item.id}>
        <button
          onClick={() => {
            if (item.onClick) {
              item.onClick()
            } else if (onNavChange) {
              onNavChange(item.id)
            }
          }}
          disabled={item.disabled}
          className={cn(
            "flex items-center w-full px-3 py-2 text-left text-sm rounded-md transition-colors",
            level > 0 && "ml-4",
            activeNavItem === item.id
              ? "bg-primary/10 text-primary font-medium"
              : "text-muted-foreground hover:text-foreground hover:bg-accent",
            item.disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          {item.icon && <item.icon className="w-4 h-4 mr-3" />}
          <span className="flex-1">{item.label}</span>
          {item.badge && (
            <Badge variant="secondary" className="text-xs">
              {item.badge}
            </Badge>
          )}
        </button>
        {item.children?.map(child => renderNavItem(child, level + 1))}
      </div>
    )

    return (
      <nav className="space-y-1">
        {navigation.map(renderNavItem)}
      </nav>
    )
  }

  if (loading) {
    return (
      <div className={cn(settingsTemplateVariants({ layout, spacing }), className)}>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
          <div className="space-y-6">
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
      description={description}
      action={
        <div className="flex items-center gap-2">
          {extraHeaderActions.map((action, i) => (
            <div key={i}>{action}</div>
          ))}
          
          {showResetAll && hasChanges && onReset && (
            <Button
              variant="outline"
              onClick={() => onReset()}
              disabled={saving}
            >
              Reset All
            </Button>
          )}
          
          {showGlobalSave && hasChanges && onSave && (
            <Button
              variant="default"
              onClick={() => onSave()}
              disabled={saving}
            >
              {saving ? "Saving..." : globalSaveLabel}
            </Button>
          )}
        </div>
      }
    />
  )

  const messagesElement = (
    <>
      {globalError && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{globalError}</p>
        </div>
      )}
      {successMessage && (
        <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-4">
          <p className="text-sm text-green-700">{successMessage}</p>
        </div>
      )}
    </>
  )

  if (layout === 'sidebar') {
    return (
      <div className={cn(settingsTemplateVariants({ layout, spacing }), className)} {...props}>
        <div className="lg:col-span-3">
          <div className="sticky top-6">
            {renderNavigation()}
          </div>
        </div>
        
        <div className="lg:col-span-9">
          {headerElement}
          {messagesElement}
          <div className="space-y-6">
            {(sections.length > 0 ? sections : tabs.find(t => t.id === (activeTab || tabs[0]?.id))?.sections || [])
              .map(renderSection)}
          </div>
        </div>
      </div>
    )
  }

  if (layout === 'tabs') {
    return (
      <div className={cn(settingsTemplateVariants({ layout, spacing }), className)} {...props}>
        {headerElement}
        {messagesElement}
        
        {tabs.length > 0 && (
          <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="border-b border-border">
              <nav className="flex space-x-8">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange?.(tab.id)}
                    disabled={tab.disabled}
                    className={cn(
                      "py-2 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2",
                      activeTab === tab.id || (!activeTab && tab.id === tabs[0].id)
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:border-border",
                      tab.disabled && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {tab.icon && <tab.icon className="w-4 h-4" />}
                    {tab.label}
                    {tab.badge && (
                      <Badge variant="secondary" className="text-xs">
                        {tab.badge}
                      </Badge>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
              {(tabs.find(tab => activeTab ? tab.id === activeTab : tab.id === tabs[0].id)?.sections || [])
                .map(renderSection)}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={cn(settingsTemplateVariants({ layout, spacing }), className)} {...props}>
      {headerElement}
      {messagesElement}
      <div className="space-y-6">
        {sections.map(renderSection)}
      </div>
    </div>
  )
}

export { SettingsTemplate }