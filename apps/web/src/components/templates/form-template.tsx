"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { PageHeader } from "../ui/molecules/page-header"
import { FormField } from "../ui/molecules/form-field"
import { Button } from "../ui/button"
import { Skeleton } from "../ui/atoms/skeleton"

const formTemplateVariants = cva(
  "space-y-6",
  {
    variants: {
      layout: {
        default: "max-w-2xl",
        wide: "max-w-4xl",
        full: "max-w-none",
        split: "lg:grid lg:grid-cols-12 lg:gap-8 lg:max-w-none",
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

export interface FormFieldDefinition {
  id: string
  name: string
  label: string
  type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'textarea' | 'select' | 'multiselect' | 'checkbox' | 'radio' | 'date' | 'file' | 'custom'
  placeholder?: string
  description?: string
  required?: boolean
  disabled?: boolean
  options?: Array<{ value: string | number; label: string; disabled?: boolean }>
  validation?: {
    min?: number
    max?: number
    pattern?: RegExp
    custom?: (value: unknown) => string | null
  }
  defaultValue?: unknown
  value?: unknown
  onChange?: (value: unknown) => void
  className?: string
  colSpan?: number // For grid layouts
  render?: (field: FormFieldDefinition, props: Record<string, unknown>) => React.ReactNode
}

export interface FormSection {
  id: string
  title: string
  description?: string
  fields: FormFieldDefinition[]
  collapsible?: boolean
  defaultCollapsed?: boolean
  className?: string
}

export interface FormTemplateProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'onSubmit'>,
    VariantProps<typeof formTemplateVariants> {
  title: string
  description?: string
  breadcrumb?: React.ReactNode
  
  // Form Structure
  sections?: FormSection[]
  fields?: FormFieldDefinition[] // For simple single-section forms
  
  // Form State
  values?: Record<string, unknown>
  errors?: Record<string, string>
  touched?: Record<string, boolean>
  isSubmitting?: boolean
  isDirty?: boolean
  
  // Form Handlers
  onSubmit?: (values: Record<string, unknown>) => void | Promise<void>
  onChange?: (field: string, value: unknown) => void
  onReset?: () => void
  onCancel?: () => void
  
  // Sidebar (for split layout)
  sidebarContent?: React.ReactNode
  sidebarTitle?: string
  
  // Actions
  submitLabel?: string
  submitVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost'
  showCancel?: boolean
  cancelLabel?: string
  extraActions?: React.ReactNode[]
  
  // Loading & States
  loading?: boolean
  error?: string
  successMessage?: string
  
  // Layout Options
  gridColumns?: number
  stickyActions?: boolean
}

function FormTemplate({
  className,
  layout,
  spacing,
  title,
  description,
  breadcrumb,
  sections = [],
  fields = [],
  values = {},
  errors = {},
  touched = {},
  isSubmitting = false,
  isDirty = false,
  onSubmit,
  onChange,
  onReset,
  onCancel,
  sidebarContent,
  sidebarTitle,
  submitLabel = "Save",
  submitVariant = "default",
  showCancel = true,
  cancelLabel = "Cancel",
  extraActions = [],
  loading = false,
  error,
  successMessage,
  gridColumns = 2,
  stickyActions = true,
  ...props
}: FormTemplateProps) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (onSubmit) {
      await onSubmit(values)
    }
  }

  const renderField = (field: FormFieldDefinition) => {
    const value = values[field.name] || field.value || field.defaultValue
    const hasError = errors[field.name] && touched[field.name]
    const fieldProps = {
      value,
      onChange: (newValue: unknown) => {
        field.onChange?.(newValue)
        onChange?.(field.name, newValue)
      },
      disabled: field.disabled || isSubmitting,
      required: field.required,
      placeholder: field.placeholder,
      error: hasError ? errors[field.name] : undefined,
    }

    if (field.render) {
      return field.render(field, fieldProps)
    }

    const getColSpan = () => {
      if (field.colSpan) return `col-span-${field.colSpan}`
      if (field.type === 'textarea') return `col-span-${gridColumns}`
      return 'col-span-1'
    }

    const fieldElement = (() => {
      switch (field.type) {
        case 'textarea':
          return (
            <textarea
              value={String(value || '')}
              onChange={(e) => fieldProps.onChange(e.target.value)}
              disabled={fieldProps.disabled}
              required={fieldProps.required}
              placeholder={fieldProps.placeholder}
              rows={4}
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
                <option 
                  key={option.value} 
                  value={option.value}
                  disabled={option.disabled}
                >
                  {option.label}
                </option>
              ))}
            </select>
          )

        case 'checkbox':
          return (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={Boolean(value)}
                onChange={(e) => fieldProps.onChange(e.target.checked)}
                disabled={fieldProps.disabled}
                required={fieldProps.required}
                className="rounded border border-border focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
              <label className="text-sm font-medium text-foreground">
                {field.label}
              </label>
            </div>
          )

        case 'radio':
          return (
            <div className="space-y-2">
              {field.options?.map(option => (
                <div key={option.value} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name={field.name}
                    value={option.value}
                    checked={value === option.value}
                    onChange={() => fieldProps.onChange(option.value)}
                    disabled={fieldProps.disabled || option.disabled}
                    className="border border-border focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  />
                  <label className="text-sm text-foreground">
                    {option.label}
                  </label>
                </div>
              ))}
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

    if (field.type === 'checkbox') {
      return (
        <div key={field.id} className={cn(getColSpan(), field.className)}>
          {fieldElement}
          {field.description && (
            <p className="text-xs text-muted-foreground mt-1">
              {field.description}
            </p>
          )}
          {hasError && (
            <p className="text-xs text-destructive mt-1">
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
        className={cn(getColSpan(), field.className)}
      >
        {fieldElement}
      </FormField>
    )
  }

  const renderSection = (section: FormSection) => {
    const isCollapsed = collapsedSections.has(section.id)

    return (
      <section
        key={section.id}
        className={cn(
          "rounded-lg border border-border bg-card p-6",
          section.className
        )}
      >
        {/* Section Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-card-foreground">
                {section.title}
              </h3>
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

        {/* Section Fields */}
        {!isCollapsed && (
          <div className={cn(
            "grid gap-4",
            gridColumns === 1 ? "grid-cols-1" : 
            gridColumns === 2 ? "grid-cols-1 md:grid-cols-2" :
            gridColumns === 3 ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" :
            "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
          )}>
            {section.fields.map(renderField)}
          </div>
        )}
      </section>
    )
  }

  const actionsElement = (
    <div className={cn(
      "flex items-center gap-3 pt-6 border-t border-border",
      stickyActions && "sticky bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    )}>
      <Button
        type="submit"
        variant={submitVariant}
        disabled={isSubmitting || (!isDirty && submitVariant !== 'destructive')}>
        {submitLabel}
      </Button>

      {showCancel && onCancel && (
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          {cancelLabel}
        </Button>
      )}

      {onReset && isDirty && (
        <Button
          type="button"
          variant="ghost"
          onClick={onReset}
          disabled={isSubmitting}
        >
          Reset
        </Button>
      )}

      {extraActions.map((action, i) => (
        <div key={i}>{action}</div>
      ))}
    </div>
  )

  if (loading) {
    return (
      <div className={cn(formTemplateVariants({ layout, spacing }), className)}>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
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
      breadcrumb={breadcrumb}
    />
  )

  const messageElements = (
    <>
      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
      {successMessage && (
        <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-4">
          <p className="text-sm text-green-700">{successMessage}</p>
        </div>
      )}
    </>
  )

  if (layout === 'split') {
    return (
      <div className={cn(formTemplateVariants({ layout, spacing }), className)} {...props}>
        <div className="lg:col-span-8">
          {headerElement}
          {messageElements}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {sections.length > 0 ? (
              sections.map(renderSection)
            ) : fields.length > 0 ? (
              <div className="rounded-lg border border-border bg-card p-6">
                <div className={cn(
                  "grid gap-4",
                  gridColumns === 1 ? "grid-cols-1" : 
                  gridColumns === 2 ? "grid-cols-1 md:grid-cols-2" :
                  gridColumns === 3 ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" :
                  "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
                )}>
                  {fields.map(renderField)}
                </div>
              </div>
            ) : null}
            
            {actionsElement}
          </form>
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
    <div className={cn(formTemplateVariants({ layout, spacing }), className)} {...props}>
      {headerElement}
      {messageElements}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {sections.length > 0 ? (
          sections.map(renderSection)
        ) : fields.length > 0 ? (
          <div className="rounded-lg border border-border bg-card p-6">
            <div className={cn(
              "grid gap-4",
              gridColumns === 1 ? "grid-cols-1" : 
              gridColumns === 2 ? "grid-cols-1 md:grid-cols-2" :
              gridColumns === 3 ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" :
              "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
            )}>
              {fields.map(renderField)}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border p-8 text-center">
            <p className="text-muted-foreground">No form fields configured</p>
          </div>
        )}
        
        {actionsElement}
      </form>
    </div>
  )
}

export { FormTemplate }