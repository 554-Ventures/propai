"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { PageHeader } from "../ui/molecules/page-header"
import { FilterBar, type FilterConfig } from "../ui/molecules/filter-bar"
import { DataTable } from "../ui/organisms/data-table"
import { Skeleton } from "../ui/atoms/skeleton"

const listTemplateVariants = cva(
  "space-y-6",
  {
    variants: {
      layout: {
        table: "space-y-6",
        cards: "space-y-6", 
        split: "space-y-6 lg:grid lg:grid-cols-12 lg:gap-6 lg:space-y-0",
      },
      density: {
        comfortable: "space-y-6",
        compact: "space-y-4",
        dense: "space-y-3",
      },
    },
    defaultVariants: {
      layout: "table",
      density: "comfortable",
    },
  }
)

export interface ListAction {
  label: string
  onClick: () => void
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost'
  icon?: React.ComponentType<{ className?: string }>
  disabled?: boolean
}

export interface BulkAction extends ListAction {
  requiresSelection: boolean
}

export interface ListTemplateColumn<T = Record<string, unknown>> {
  id: string
  header: string
  accessorKey?: keyof T
  cell?: (item: T) => React.ReactNode
  sortable?: boolean
  filterable?: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
}

export interface ListTemplateProps<T = Record<string, unknown>>
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof listTemplateVariants> {
  title: string
  description?: string
  headerAction?: React.ReactNode
  
  // Data & State
  data: T[]
  loading?: boolean
  error?: string
  onRetry?: () => void
  
  // Display Options
  displayMode?: 'table' | 'cards' | 'split'
  columns?: ListTemplateColumn<T>[]
  cardRenderer?: (item: T) => React.ReactNode
  emptyState?: {
    title: string
    description?: string
    action?: React.ReactNode
  }
  
  // Filtering & Search
  searchPlaceholder?: string
  searchValue?: string
  onSearchChange?: (value: string) => void
  filters?: FilterConfig[] // FilterConfig from FilterBar
  _onFiltersChange?: (filters: FilterConfig[]) => void
  
  // Selection & Bulk Actions  
  selectable?: boolean
  selectedItems?: string[]
  onSelectionChange?: (selected: string[]) => void
  getItemId?: (item: T) => string
  bulkActions?: BulkAction[]
  
  // Pagination
  pagination?: {
    current: number
    total: number
    pageSize: number
    onPageChange: (page: number) => void
    onPageSizeChange?: (size: number) => void
  }
  
  // Loading States
  skeletonCount?: number
}

function ListTemplate<T = Record<string, unknown>>({
  className,
  layout = "table",
  density,
  title,
  description,
  headerAction,
  data,
  loading = false,
  error,
  onRetry,
  displayMode = "table",
  columns = [],
  cardRenderer,
  emptyState,
  searchPlaceholder = "Search...",
  searchValue,
  onSearchChange,
  filters = [],
  _onFiltersChange,
  selectable = false,
  selectedItems = [],
  onSelectionChange,
  getItemId,
  bulkActions = [],
  pagination,
  skeletonCount = 5,
  ...props
}: ListTemplateProps<T>) {
  const hasFiltering = filters.length > 0 || onSearchChange
  const hasSelection = selectable && selectedItems && onSelectionChange
  const showBulkActions = hasSelection && selectedItems.length > 0 && bulkActions.length > 0

  const renderEmptyState = () => {
    if (loading) return null
    
    if (error) {
      return (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-8 text-center">
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
    }
    
    if (data.length === 0) {
      return (
        <div className="rounded-lg border border-dashed border-border p-8 text-center">
          <h3 className="text-lg font-medium text-foreground mb-2">
            {emptyState?.title || "No items found"}
          </h3>
          {emptyState?.description && (
            <p className="text-sm text-muted-foreground mb-4">
              {emptyState.description}
            </p>
          )}
          {emptyState?.action}
        </div>
      )
    }
    
    return null
  }

  const renderLoadingState = () => {
    if (!loading) return null
    
    if (displayMode === 'cards') {
      return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: skeletonCount }).map((_, i) => (
            <Skeleton key={i} variant="card" className="h-32" />
          ))}
        </div>
      )
    }
    
    return (
      <div className="space-y-3">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    )
  }

  const renderTableView = () => {
    if (columns.length === 0) return null
    
    return (
      <DataTable
        data={data}
        columns={columns.map(col => ({
          key: String(col.id || col.accessorKey || ''),
          title: col.header,
          render: col.cell ? (item: T) => col.cell!(item) : ((item: T) => String((item as Record<string, unknown>)[String(col.accessorKey) || ''] || '')),
          sortable: col.sortable,
          width: col.width,
          align: col.align,
        }))}
        loading={loading}
        selection={hasSelection ? {
          selectedRows: selectedItems,
          onSelectionChange: onSelectionChange!,
          getRowId: (getItemId as ((row: unknown) => string)) || ((item: unknown) => String((item as Record<string, unknown>).id || '')),
        } : undefined}
        pagination={pagination ? {
          currentPage: pagination.current,
          pageSize: pagination.pageSize,
          totalItems: pagination.total,
          onPageChange: pagination.onPageChange,
          onPageSizeChange: pagination.onPageSizeChange,
        } : undefined}
      />
    )
  }

  const renderCardView = () => {
    if (!cardRenderer) return null
    
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data.map((item, index) => (
          <div key={getItemId?.(item) || index}>
            {cardRenderer(item)}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={cn(listTemplateVariants({ layout, density }), className)} {...props}>
      <div className="flex items-start justify-between">
        <PageHeader
          title={title}
          description={description}
          action={headerAction}
        />
        
        {/* Bulk Actions */}
        {showBulkActions && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {selectedItems.length} selected
            </span>
            {bulkActions.map((action) => (
              <button
                key={action.label}
                onClick={action.onClick}
                disabled={action.disabled}
                className={cn(
                  "px-3 py-1.5 text-xs rounded-md border transition-colors",
                  action.variant === 'destructive' 
                    ? "border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    : "border-border text-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                {action.icon && <action.icon className="w-3 h-3 mr-1" />}
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Filtering */}
      {hasFiltering && (
        <FilterBar
          searchValue={searchValue || ""}
          onSearchChange={onSearchChange}
          searchPlaceholder={searchPlaceholder}
          filters={filters}

        />
      )}

      {/* Content */}
      {renderEmptyState() || renderLoadingState() || (
        <>
          {displayMode === 'table' && renderTableView()}
          {displayMode === 'cards' && renderCardView()}
          {displayMode === 'split' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>{renderCardView()}</div>
              <div>{renderTableView()}</div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export { ListTemplate }