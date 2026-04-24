"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "../button"
import { Text } from "../atoms/text"
import { Skeleton } from "../atoms/skeleton"

const tableVariants = cva(
  "w-full caption-bottom text-sm",
  {
    variants: {
      variant: {
        default: "border-separate border-spacing-0",
        simple: "",
        striped: "border-separate border-spacing-0"
      },
      size: {
        sm: "text-xs",
        md: "text-sm",
        lg: "text-base"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "md"
    }
  }
)

const cellVariants = cva(
  "p-4 align-middle transition-colors",
  {
    variants: {
      align: {
        left: "text-left",
        center: "text-center", 
        right: "text-right"
      }
    },
    defaultVariants: {
      align: "left"
    }
  }
)

export interface TableColumn<T> {
  key: string
  title: string
  render: (row: T, index: number) => React.ReactNode
  sortable?: boolean
  width?: string
  align?: "left" | "center" | "right"
  className?: string
  headerClassName?: string
}

export interface PaginationConfig {
  currentPage: number
  pageSize: number
  totalItems: number
  showSizeChanger?: boolean
  pageSizeOptions?: number[]
  onPageChange: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
}

export interface SortingConfig {
  sortKey?: string
  sortDirection?: "asc" | "desc"
  onSort: (key: string, direction: "asc" | "desc") => void
}

export interface SelectionConfig {
  selectedRows: string[]
  onSelectionChange: (selectedRows: string[]) => void
  getRowId: (row: unknown) => string
  selectAllVisible?: boolean
}

export interface DataTableProps<T>
  extends React.TableHTMLAttributes<HTMLTableElement>,
    VariantProps<typeof tableVariants> {
  data: T[]
  columns: TableColumn<T>[]
  loading?: boolean
  pagination?: PaginationConfig
  sorting?: SortingConfig
  selection?: SelectionConfig
  onRowClick?: (row: T, index: number) => void
  emptyState?: React.ReactNode
  loadingRows?: number
  className?: string
  rowClassName?: (row: T, index: number) => string
  testId?: string
}

function DataTable<T>({
  data,
  columns,
  loading = false,
  pagination,
  sorting,
  selection,
  onRowClick,
  emptyState,
  loadingRows = 5,
  variant,
  size,
  className,
  rowClassName,
  testId = "data-table",
  ...props
}: DataTableProps<T>) {
  const handleSort = (column: TableColumn<T>) => {
    if (!sorting || !column.sortable) return

    const newDirection = 
      sorting.sortKey === column.key && sorting.sortDirection === "asc" 
        ? "desc" 
        : "asc"
    
    sorting.onSort(column.key, newDirection)
  }

  const getSortIcon = (column: TableColumn<T>) => {
    if (!column.sortable) return null

    if (sorting?.sortKey === column.key) {
      return sorting.sortDirection === "asc" 
        ? <ChevronUp className="ml-1 h-3 w-3" />
        : <ChevronDown className="ml-1 h-3 w-3" />
    }

    return <ChevronsUpDown className="ml-1 h-3 w-3 opacity-50" />
  }

  const handleRowClick = (row: T, index: number, event: React.MouseEvent) => {
    // Don't trigger row click if clicking on interactive elements
    const target = event.target as HTMLElement
    if (target.closest('button, a, input, [role="button"]')) {
      return
    }
    
    onRowClick?.(row, index)
  }

  const renderLoadingState = () => (
    <tbody>
      {Array.from({ length: loadingRows }).map((_, index) => (
        <tr key={`loading-${index}`} className="border-b border-border">
          {columns.map((column) => (
            <td 
              key={column.key}
              className={cn(cellVariants({ align: column.align }), column.className)}
            >
              <Skeleton className="h-4 w-full max-w-[200px]" />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  )

  const renderEmptyState = () => (
    <tbody>
      <tr>
        <td 
          colSpan={columns.length} 
          className="h-24 text-center"
        >
          {emptyState || (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Text variant="muted" size="sm">
                No data available
              </Text>
            </div>
          )}
        </td>
      </tr>
    </tbody>
  )

  const renderPagination = () => {
    if (!pagination) return null

    const { 
      currentPage, 
      pageSize, 
      totalItems, 
      onPageChange,
      onPageSizeChange,
      showSizeChanger = false,
      pageSizeOptions = [10, 25, 50, 100]
    } = pagination

    const totalPages = Math.ceil(totalItems / pageSize)
    const startItem = (currentPage - 1) * pageSize + 1
    const endItem = Math.min(currentPage * pageSize, totalItems)

    return (
      <div className="flex items-center justify-between px-2 py-4 border-t border-border">
        <div className="flex items-center space-x-2">
          <Text variant="muted" size="sm">
            Showing {startItem} to {endItem} of {totalItems} entries
          </Text>
          
          {showSizeChanger && onPageSizeChange && (
            <div className="flex items-center space-x-2 ml-6">
              <Text variant="muted" size="sm">Show:</Text>
              <select
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="border border-border rounded px-2 py-1 text-sm bg-background"
              >
                {pageSizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            Previous
          </Button>
          
          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNumber
              if (totalPages <= 5) {
                pageNumber = i + 1
              } else if (currentPage <= 3) {
                pageNumber = i + 1
              } else if (currentPage >= totalPages - 2) {
                pageNumber = totalPages - 4 + i
              } else {
                pageNumber = currentPage - 2 + i
              }

              return (
                <Button
                  key={pageNumber}
                  variant={currentPage === pageNumber ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(pageNumber)}
                  className="w-8 h-8"
                >
                  {pageNumber}
                </Button>
              )
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="rounded-lg border border-border bg-background"
      data-testid={testId}
    >
      <div className="overflow-x-auto">
        <table 
          className={cn(tableVariants({ variant, size }), className)}
          {...props}
        >
          <thead className="[&_tr]:border-b">
            <tr className="border-b border-border bg-muted/50">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    cellVariants({ align: column.align }),
                    "h-12 px-4 text-left align-middle font-medium text-muted-foreground",
                    column.sortable && "cursor-pointer select-none hover:text-foreground",
                    column.headerClassName
                  )}
                  style={{ width: column.width }}
                  onClick={() => handleSort(column)}
                >
                  <div className="flex items-center">
                    {column.title}
                    {getSortIcon(column)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {loading ? renderLoadingState() : data.length === 0 ? renderEmptyState() : (
            <tbody className="[&_tr:last-child]:border-0">
              {data.map((row, index) => (
                <tr
                  key={index}
                  className={cn(
                    "border-b border-border transition-colors hover:bg-muted/50",
                    onRowClick && "cursor-pointer",
                    variant === "striped" && index % 2 === 1 && "bg-muted/25",
                    rowClassName?.(row, index)
                  )}
                  onClick={(e) => handleRowClick(row, index, e)}
                >
                  {columns.map((column) => (
                    <td 
                      key={column.key}
                      className={cn(
                        cellVariants({ align: column.align }),
                        column.className
                      )}
                    >
                      {column.render(row, index)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          )}
        </table>
      </div>

      {renderPagination()}
    </div>
  )
}

export { DataTable }