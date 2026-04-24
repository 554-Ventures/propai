"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { 
  Home,
  Calendar,
  Users,
  TrendingUp,
  Filter,
  Download,
  RefreshCw,
  AlertCircle,
  Info
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Text } from "../ui/atoms/text"
import { Button } from "../ui/button"
import { Badge } from "../ui/atoms/badge"
import { Skeleton } from "../ui/atoms/skeleton"

// Data types for occupancy visualization
export interface UnitOccupancy {
  unitId: string
  unitNumber: string
  propertyId: string
  propertyName: string
  floor?: number
  bedrooms: number
  bathrooms: number
  sqft?: number
  status: 'occupied' | 'vacant' | 'maintenance' | 'notice' | 'turnover'
  occupancyStartDate?: Date
  occupancyEndDate?: Date
  leaseEndDate?: Date
  rentAmount?: number
  tenantName?: string
  daysVacant?: number
  maintenanceIssues?: number
}

export interface PropertyOccupancyData {
  propertyId: string
  propertyName: string
  address: string
  totalUnits: number
  occupiedUnits: number
  vacantUnits: number
  maintenanceUnits: number
  noticeUnits: number
  turnoverUnits: number
  occupancyRate: number
  avgDaysVacant: number
  monthlyRevenue: number
  potentialRevenue: number
  revenueEfficiency: number
  units: UnitOccupancy[]
}

export interface OccupancyTrend {
  date: Date
  occupancyRate: number
  totalUnits: number
  occupiedUnits: number
  newLeases: number
  moveOuts: number
  turnoverRate: number
}

const heatmapVariants = cva(
  "w-full bg-card border border-border rounded-lg p-6",
  {
    variants: {
      size: {
        sm: "min-h-64",
        md: "min-h-80",
        lg: "min-h-96",
        xl: "min-h-[40rem]",
      },
      variant: {
        default: "shadow-sm",
        elevated: "shadow-lg",
        minimal: "border-0 shadow-none bg-transparent p-4",
      },
      view: {
        grid: "",
        list: "",
        timeline: "",
      },
    },
    defaultVariants: {
      size: "lg",
      variant: "default",
      view: "grid",
    },
  }
)

export interface OccupancyHeatmapProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof heatmapVariants> {
  data: PropertyOccupancyData[]
  trends?: OccupancyTrend[]
  title?: string
  subtitle?: string
  timeframe?: 'current' | '30d' | '90d' | '12m'
  onTimeframeChange?: (timeframe: string) => void
  selectedPropertyIds?: string[]
  onPropertySelect?: (propertyIds: string[]) => void
  showLegend?: boolean
  showMetrics?: boolean
  showFilters?: boolean
  interactive?: boolean
  onUnitClick?: (unit: UnitOccupancy) => void
  onExport?: (format: 'csv' | 'pdf' | 'png') => void
  loading?: boolean
  error?: string
  refreshing?: boolean
  onRefresh?: () => void
}

function OccupancyHeatmap({
  className,
  size,
  variant,
  view,
  data = [],
  trends: trends = [],
  title = "Occupancy Overview",
  subtitle,
  timeframe: timeframe = 'current',
  onTimeframeChange: onTimeframeChange,
  selectedPropertyIds: selectedPropertyIds = [],
  onPropertySelect: onPropertySelect,
  showLegend = true,
  showMetrics = true,
  showFilters = false,
  interactive = true,
  onUnitClick,
  onExport,
  loading = false,
  error,
  refreshing = false,
  onRefresh,
  ...props
}: OccupancyHeatmapProps) {
  const [hoveredUnit, setHoveredUnit] = React.useState<UnitOccupancy | null>(null)
  const [viewMode, setViewMode] = React.useState<'grid' | 'list' | 'timeline'>(view || 'grid')
  const [_statusFilter, _setStatusFilter] = React.useState<string[]>([])

  // Calculate aggregate metrics
  const aggregateMetrics = React.useMemo(() => {
    if (!data.length) return null

    const totals = data.reduce(
      (acc, property) => ({
        totalUnits: acc.totalUnits + property.totalUnits,
        occupiedUnits: acc.occupiedUnits + property.occupiedUnits,
        vacantUnits: acc.vacantUnits + property.vacantUnits,
        maintenanceUnits: acc.maintenanceUnits + property.maintenanceUnits,
        monthlyRevenue: acc.monthlyRevenue + property.monthlyRevenue,
        potentialRevenue: acc.potentialRevenue + property.potentialRevenue,
      }),
      {
        totalUnits: 0,
        occupiedUnits: 0,
        vacantUnits: 0,
        maintenanceUnits: 0,
        monthlyRevenue: 0,
        potentialRevenue: 0,
      }
    )

    return {
      ...totals,
      occupancyRate: (totals.occupiedUnits / totals.totalUnits) * 100,
      revenueEfficiency: (totals.monthlyRevenue / totals.potentialRevenue) * 100,
      avgVacantDays: data.reduce((sum, p) => sum + p.avgDaysVacant, 0) / data.length,
    }
  }, [data])

  // Status color mapping
  const getStatusColor = (status: UnitOccupancy['status']) => {
    switch (status) {
      case 'occupied':
        return 'bg-green-500 hover:bg-green-600'
      case 'vacant':
        return 'bg-red-500 hover:bg-red-600'
      case 'maintenance':
        return 'bg-yellow-500 hover:bg-yellow-600'
      case 'notice':
        return 'bg-orange-500 hover:bg-orange-600'
      case 'turnover':
        return 'bg-blue-500 hover:bg-blue-600'
      default:
        return 'bg-gray-500 hover:bg-gray-600'
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  if (loading) {
    return (
      <div className={cn(heatmapVariants({ size, variant }), className)} {...props}>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-9 w-24" />
          </div>
          
          {showMetrics && (
            <div className="grid grid-cols-4 gap-4 mb-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="p-4 border rounded-lg">
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ))}
            </div>
          )}
          
          <div className="grid grid-cols-6 gap-2">
            {Array.from({ length: 24 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn(heatmapVariants({ size, variant }), className)} {...props}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-3">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
            <div>
              <Text weight="medium" className="text-destructive">
                Error loading occupancy data
              </Text>
              <Text size="sm" variant="muted">
                {error}
              </Text>
            </div>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(heatmapVariants({ size, variant }), className)} {...props}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center space-x-3">
            <Text size="lg" weight="semibold">
              {title}
            </Text>
            {aggregateMetrics && (
              <Badge variant={aggregateMetrics.occupancyRate >= 95 ? "default" : "secondary"}>
                {formatPercentage(aggregateMetrics.occupancyRate)} occupied
              </Badge>
            )}
          </div>
          {subtitle && (
            <Text size="sm" variant="muted">
              {subtitle}
            </Text>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* View Mode Toggle */}
          <div className="flex border rounded-md">
            {['grid', 'list', 'timeline'].map((mode) => (
              <Button
                key={mode}
                variant={viewMode === mode ? "default" : "ghost"}
                size="sm"
                className="rounded-none first:rounded-l-md last:rounded-r-md"
                onClick={() => setViewMode(mode as 'grid' | 'list' | 'timeline')}
              >
                {mode === 'grid' && <Home className="w-4 h-4" />}
                {mode === 'list' && <Users className="w-4 h-4" />}
                {mode === 'timeline' && <Calendar className="w-4 h-4" />}
              </Button>
            ))}
          </div>

          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
            </Button>
          )}

          {showFilters && (
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4" />
            </Button>
          )}

          {onExport && (
            <Button variant="outline" size="sm" onClick={() => onExport('csv')}>
              <Download className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Metrics Summary */}
      {showMetrics && aggregateMetrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 border rounded-lg">
            <div className="flex items-center space-x-2">
              <Home className="w-4 h-4 text-muted-foreground" />
              <Text size="sm" variant="muted">Total Units</Text>
            </div>
            <Text size="lg" weight="semibold">
              {aggregateMetrics.totalUnits}
            </Text>
            <Text size="xs" variant="muted">
              {aggregateMetrics.occupiedUnits} occupied, {aggregateMetrics.vacantUnits} vacant
            </Text>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <Text size="sm" variant="muted">Occupancy Rate</Text>
            </div>
            <Text size="lg" weight="semibold" className="text-green-700 dark:text-green-400">
              {formatPercentage(aggregateMetrics.occupancyRate)}
            </Text>
            <Text size="xs" variant="muted">
              Target: 95%
            </Text>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <Text size="sm" variant="muted">Avg Days Vacant</Text>
            </div>
            <Text size="lg" weight="semibold" className="text-blue-700 dark:text-blue-400">
              {aggregateMetrics.avgVacantDays.toFixed(0)}
            </Text>
            <Text size="xs" variant="muted">
              Industry avg: 30 days
            </Text>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              <Text size="sm" variant="muted">Revenue Efficiency</Text>
            </div>
            <Text size="lg" weight="semibold" className="text-purple-700 dark:text-purple-400">
              {formatPercentage(aggregateMetrics.revenueEfficiency)}
            </Text>
            <Text size="xs" variant="muted">
              {formatCurrency(aggregateMetrics.monthlyRevenue)} / {formatCurrency(aggregateMetrics.potentialRevenue)}
            </Text>
          </div>
        </div>
      )}

      {/* Legend */}
      {showLegend && (
        <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-muted/20 rounded-lg">
          <Text size="sm" weight="medium">Status Legend:</Text>
          {[
            { status: 'occupied', label: 'Occupied', count: aggregateMetrics?.occupiedUnits || 0 },
            { status: 'vacant', label: 'Vacant', count: aggregateMetrics?.vacantUnits || 0 },
            { status: 'maintenance', label: 'Maintenance', count: aggregateMetrics?.maintenanceUnits || 0 },
            { status: 'notice', label: '30-Day Notice', count: 0 },
            { status: 'turnover', label: 'Turnover', count: 0 },
          ].map(({ status, label, count }) => (
            <div key={status} className="flex items-center space-x-2">
              <div className={cn("w-4 h-4 rounded", getStatusColor(status as UnitOccupancy['status']))} />
              <Text size="sm">
                {label} ({count})
              </Text>
            </div>
          ))}
        </div>
      )}

      {/* Heatmap Grid View */}
      {viewMode === 'grid' && (
        <div className="space-y-6">
          {data.map((property) => (
            <div key={property.propertyId} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <Text weight="semibold">{property.propertyName}</Text>
                  <Text size="sm" variant="muted">{property.address}</Text>
                </div>
                <div className="text-right">
                  <Badge variant={property.occupancyRate >= 95 ? "default" : "secondary"}>
                    {formatPercentage(property.occupancyRate)}
                  </Badge>
                  <Text size="sm" variant="muted">
                    {property.occupiedUnits}/{property.totalUnits} occupied
                  </Text>
                </div>
              </div>

              <div className="grid grid-cols-8 md:grid-cols-12 lg:grid-cols-16 gap-1">
                {property.units.map((unit) => (
                  <div
                    key={unit.unitId}
                    className={cn(
                      "aspect-square rounded cursor-pointer transition-all",
                      getStatusColor(unit.status),
                      interactive && "hover:scale-110 hover:z-10 relative",
                      hoveredUnit?.unitId === unit.unitId && "ring-2 ring-primary ring-offset-1"
                    )}
                    onMouseEnter={() => setHoveredUnit(unit)}
                    onMouseLeave={() => setHoveredUnit(null)}
                    onClick={() => interactive && onUnitClick?.(unit)}
                    title={`${unit.unitNumber} - ${unit.status}`}
                  >
                    <div className="w-full h-full flex items-center justify-center">
                      <Text size="xs" className="text-white font-medium">
                        {unit.unitNumber}
                      </Text>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Hovered Unit Tooltip */}
      {hoveredUnit && interactive && (
        <div className="fixed z-50 p-3 bg-popover border border-border rounded-lg shadow-lg pointer-events-none">
          <Text weight="semibold" size="sm">
            Unit {hoveredUnit.unitNumber}
          </Text>
          <Text size="xs" variant="muted" className="capitalize">
            {hoveredUnit.status}
          </Text>
          {hoveredUnit.tenantName && (
            <Text size="xs">
              Tenant: {hoveredUnit.tenantName}
            </Text>
          )}
          {hoveredUnit.rentAmount && (
            <Text size="xs">
              Rent: {formatCurrency(hoveredUnit.rentAmount)}/month
            </Text>
          )}
          {hoveredUnit.leaseEndDate && (
            <Text size="xs">
              Lease ends: {hoveredUnit.leaseEndDate.toLocaleDateString()}
            </Text>
          )}
        </div>
      )}

      {/* Empty State */}
      {!loading && data.length === 0 && (
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-3">
            <Home className="w-16 h-16 text-muted-foreground mx-auto" />
            <div>
              <Text weight="medium">No occupancy data available</Text>
              <Text size="sm" variant="muted">
                Add properties and units to see occupancy visualization
              </Text>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export { OccupancyHeatmap }