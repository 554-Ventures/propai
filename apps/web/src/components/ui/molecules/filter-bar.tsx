"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Search, Filter, X, ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "../button"
import { Input } from "../atoms/input"
import { Badge } from "../atoms/badge"

const filterBarVariants = cva(
  "flex flex-wrap items-center gap-4 p-4 bg-background border border-border rounded-lg",
  {
    variants: {
      variant: {
        default: "border-border",
        embedded: "border-none bg-transparent p-0",
        compact: "p-2 gap-2"
      },
      direction: {
        row: "flex-row",
        column: "flex-col items-start",
        responsive: "flex-col sm:flex-row sm:items-center"
      }
    },
    defaultVariants: {
      variant: "default", 
      direction: "responsive"
    }
  }
)

export interface FilterOption {
  label: string
  value: string | number | boolean
  count?: number
}

export interface FilterConfig {
  key: string
  label: string
  type: "select" | "multiselect" | "daterange" | "toggle" | "text"
  options?: FilterOption[]
  value?: unknown
  onChange: (value: unknown) => void
  placeholder?: string
  width?: string
  disabled?: boolean
}

export interface QuickFilter {
  label: string
  value: unknown
  isActive?: boolean
  count?: number
  onClick: () => void
}

export interface FilterSortingConfig {
  options: Array<{ label: string; value: string; direction: "asc" | "desc" }>
  currentSort?: string
  onSortChange: (sortKey: string, direction: "asc" | "desc") => void
}

export interface FilterBarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof filterBarVariants> {
  // Search functionality
  searchValue?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  showSearch?: boolean

  // Filters
  filters?: FilterConfig[]
  quickFilters?: QuickFilter[]

  // Sorting
  sorting?: FilterSortingConfig

  // Actions
  actions?: React.ReactNode
  
  // State
  loading?: boolean
  totalCount?: number
  filteredCount?: number

  // Styling
  className?: string
}

function FilterBar({
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Search...",
  showSearch = true,
  filters = [],
  quickFilters = [],
  sorting,
  actions,
  loading = false,
  totalCount,
  filteredCount,
  variant,
  direction,
  className,
  ...props
}: FilterBarProps) {
  const [openFilter, setOpenFilter] = React.useState<string | null>(null)
  const [localSearchValue, setLocalSearchValue] = React.useState(searchValue)

  // Debounce search input
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearchValue !== searchValue) {
        onSearchChange?.(localSearchValue)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [localSearchValue, searchValue, onSearchChange])

  // Update local search when external value changes
  React.useEffect(() => {
    setLocalSearchValue(searchValue)
  }, [searchValue])

  const activeFiltersCount = filters.filter(filter => {
    if (filter.type === "multiselect") {
      return Array.isArray(filter.value) && filter.value.length > 0
    }
    return filter.value !== undefined && filter.value !== "" && filter.value !== null
  }).length

  const hasActiveFilters = activeFiltersCount > 0 || localSearchValue.length > 0

  const clearAllFilters = () => {
    setLocalSearchValue("")
    onSearchChange?.("")
    filters.forEach(filter => {
      filter.onChange(filter.type === "multiselect" ? [] : "")
    })
  }

  const renderFilter = (filter: FilterConfig) => {
    const isOpen = openFilter === filter.key

    switch (filter.type) {
      case "select":
        return (
          <div key={filter.key} className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpenFilter(isOpen ? null : filter.key)}
              className={cn(
                "justify-between min-w-[120px]",
                Boolean(filter.value && filter.value !== "") && "bg-primary/10 border-primary/20"
              )}
              disabled={filter.disabled || loading}
            >
              <span className="truncate">
                {filter.value && filter.value !== ""
                  ? filter.options?.find(opt => opt.value === filter.value)?.label || String(filter.value)
                  : filter.placeholder || filter.label
                }
              </span>
              <ChevronDown className="ml-2 h-3 w-3" />
            </Button>

            {isOpen && (
              <div className="absolute top-full left-0 mt-1 w-full min-w-[200px] bg-background border border-border rounded-md shadow-md z-50 max-h-60 overflow-y-auto">
                {filter.options?.map((option) => (
                  <button
                    key={String(option.value)}
                    className="w-full text-left px-3 py-2 hover:bg-muted transition-colors flex items-center justify-between"
                    onClick={() => {
                      filter.onChange(option.value)
                      setOpenFilter(null)
                    }}
                  >
                    <span>{option.label}</span>
                    {option.count !== undefined && (
                      <Badge variant="secondary" size="sm">
                        {option.count}
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )

      case "text":
        return (
          <Input
            key={filter.key}
            placeholder={filter.placeholder || filter.label}
            value={filter.value ? String(filter.value) : ""}
            onChange={(e) => filter.onChange(e.target.value)}
            disabled={filter.disabled || loading}
            className="w-[200px]"
          />
        )

      case "toggle":
        return (
          <Button
            key={filter.key}
            variant={filter.value ? "default" : "outline"}
            size="sm"
            onClick={() => filter.onChange(!filter.value)}
            disabled={filter.disabled || loading}
          >
            {filter.label}
          </Button>
        )

      default:
        return null
    }
  }

  const renderSorting = () => {
    if (!sorting) return null

    const currentSortOption = sorting.options.find(
      option => option.value === sorting.currentSort
    )

    return (
      <div className="relative">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpenFilter(openFilter === "sort" ? null : "sort")}
          className="justify-between min-w-[120px]"
        >
          <span className="truncate">
            {currentSortOption?.label || "Sort"}
          </span>
          <ChevronDown className="ml-2 h-3 w-3" />
        </Button>

        {openFilter === "sort" && (
          <div className="absolute top-full left-0 mt-1 w-full min-w-[200px] bg-background border border-border rounded-md shadow-md z-50">
            {sorting.options.map((option) => (
              <button
                key={`${option.value}-${option.direction}`}
                className="w-full text-left px-3 py-2 hover:bg-muted transition-colors"
                onClick={() => {
                  sorting.onSortChange(option.value, option.direction)
                  setOpenFilter(null)
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      {/* Click outside handler */}
      {openFilter && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setOpenFilter(null)}
        />
      )}

      <div 
        className={cn(filterBarVariants({ variant, direction }), className)}
        {...props}
      >
        {/* Search Section */}
        {showSearch && (
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={localSearchValue}
              onChange={(e) => setLocalSearchValue(e.target.value)}
              className="pl-9"
              disabled={loading}
            />
          </div>
        )}

        {/* Quick Filters */}
        {quickFilters.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {quickFilters.map((quickFilter, index) => (
              <Button
                key={index}
                variant={quickFilter.isActive ? "default" : "outline"}
                size="sm"
                onClick={quickFilter.onClick}
                className="h-8"
              >
                {quickFilter.label}
                {quickFilter.count !== undefined && (
                  <Badge 
                    variant="secondary" 
                    size="sm" 
                    className="ml-2"
                  >
                    {quickFilter.count}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {filters.map(renderFilter)}
        </div>

        {/* Sorting */}
        {renderSorting()}

        {/* Actions */}
        {actions && (
          <div className="flex items-center gap-2 ml-auto">
            {actions}
          </div>
        )}

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3 mr-1" />
            Clear filters
          </Button>
        )}
      </div>

      {/* Results Summary */}
      {(totalCount !== undefined || filteredCount !== undefined) && (
        <div className="flex items-center justify-between py-2 text-sm text-muted-foreground">
          <div>
            {filteredCount !== undefined && totalCount !== undefined ? (
              hasActiveFilters ? (
                <span>
                  Showing {filteredCount} of {totalCount} results
                </span>
              ) : (
                <span>{totalCount} total results</span>
              )
            ) : filteredCount !== undefined ? (
              <span>{filteredCount} results</span>
            ) : totalCount !== undefined ? (
              <span>{totalCount} total items</span>
            ) : null}
          </div>

          {activeFiltersCount > 0 && (
            <div className="flex items-center gap-1">
              <Filter className="h-3 w-3" />
              <span>{activeFiltersCount} filter{activeFiltersCount > 1 ? 's' : ''} applied</span>
            </div>
          )}
        </div>
      )}
    </>
  )
}

export { FilterBar }