"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Home,
  Users,
  Wrench,
  Calendar,
  Target,
  AlertTriangle,
  ThumbsUp,
  Clock,
  MapPin,
  RefreshCw,
  Download,
  Settings,
  Info,
  ChevronUp,
  ChevronDown
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Text } from "../ui/atoms/text"
import { Button } from "../ui/button"
import { Badge } from "../ui/atoms/badge"
import { Skeleton } from "../ui/atoms/skeleton"
// import { Separator } from "../ui/atoms/separator"

// KPI Data Types
export interface KPIMetric {
  id: string
  label: string
  value: number | string
  previousValue?: number | string
  change?: number
  changeType?: 'increase' | 'decrease'
  trending?: 'up' | 'down' | 'stable'
  target?: number
  unit?: 'currency' | 'percentage' | 'number' | 'days'
  icon?: React.ComponentType<{ className?: string }>
  color?: 'green' | 'red' | 'blue' | 'yellow' | 'purple' | 'gray'
  priority?: 'high' | 'medium' | 'low'
  category?: 'financial' | 'operational' | 'tenant' | 'maintenance'
}

export interface PerformanceAlert {
  id: string
  type: 'critical' | 'warning' | 'info' | 'success'
  title: string
  description: string
  metric?: string
  value?: string
  threshold?: string
  actionRequired?: boolean
  timestamp: Date
  propertyId?: string
  propertyName?: string
}

export interface BenchmarkData {
  metric: string
  currentValue: number
  marketAverage: number
  topPercentile: number
  bottomPercentile: number
  rank?: number
  totalProperties?: number
}

const dashboardVariants = cva(
  "w-full bg-background",
  {
    variants: {
      layout: {
        grid: "space-y-6",
        compact: "space-y-4",
        executive: "space-y-8",
      },
      density: {
        comfortable: "p-6",
        normal: "p-4",
        compact: "p-3",
      },
    },
    defaultVariants: {
      layout: "grid",
      density: "normal",
    },
  }
)

const metricCardVariants = cva(
  "bg-card border border-border rounded-lg transition-all duration-200",
  {
    variants: {
      size: {
        sm: "p-3",
        md: "p-4",
        lg: "p-6",
      },
      variant: {
        default: "hover:shadow-md",
        elevated: "shadow-lg",
        minimal: "border-0 bg-transparent",
        alert: "ring-2 ring-destructive/20 bg-destructive/5",
        success: "ring-2 ring-green-500/20 bg-green-50 dark:bg-green-900/20",
      },
      interactive: {
        true: "cursor-pointer hover:shadow-lg hover:scale-[1.02]",
        false: "",
      },
    },
    defaultVariants: {
      size: "md",
      variant: "default",
      interactive: false,
    },
  }
)

export interface PerformanceMetricsDashboardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof dashboardVariants> {
  metrics: KPIMetric[]
  alerts?: PerformanceAlert[]
  benchmarks?: BenchmarkData[]
  title?: string
  subtitle?: string
  timeframe?: '24h' | '7d' | '30d' | '90d' | '12m' | 'ytd'
  onTimeframeChange?: (timeframe: string) => void
  onMetricClick?: (metric: KPIMetric) => void
  onAlertClick?: (alert: PerformanceAlert) => void
  onExport?: (format: 'csv' | 'pdf' | 'png') => void
  onRefresh?: () => void
  showAlerts?: boolean
  showBenchmarks?: boolean
  showTrends?: boolean
  autoRefresh?: boolean
  refreshInterval?: number
  loading?: boolean
  error?: string
  organizationName?: string
}

function PerformanceMetricsDashboard({
  className,
  layout,
  density,
  metrics = [],
  alerts = [],
  benchmarks = [],
  title = "Performance Dashboard",
  subtitle,
  timeframe = '30d',
  onTimeframeChange,
  onMetricClick,
  onAlertClick,
  onExport,
  onRefresh,
  showAlerts = true,
  showBenchmarks = false,
  showTrends = true,
  autoRefresh = false,
  refreshInterval = 300000, // 5 minutes
  loading = false,
  error,
  organizationName,
  ...props
}: PerformanceMetricsDashboardProps) {
  const [expandedMetrics, setExpandedMetrics] = React.useState<Set<string>>(new Set())
  const [refreshing, setRefreshing] = React.useState(false)

  // Auto-refresh functionality
  React.useEffect(() => {
    if (!autoRefresh || !onRefresh) return

    const interval = setInterval(() => {
      onRefresh()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, onRefresh, refreshInterval])

  // Group metrics by category
  const metricsByCategory = React.useMemo(() => {
    return metrics.reduce((acc, metric) => {
      const category = metric.category || 'operational'
      if (!acc[category]) acc[category] = []
      acc[category].push(metric)
      return acc
    }, {} as Record<string, KPIMetric[]>)
  }, [metrics])

  // Critical alerts
  const criticalAlerts = React.useMemo(() => {
    return alerts.filter(alert => alert.type === 'critical').length
  }, [alerts])

  // Format values based on unit
  const formatValue = (value: number | string, unit?: string) => {
    if (typeof value === 'string') return value

    switch (unit) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(value)
      case 'percentage':
        return `${value.toFixed(1)}%`
      case 'days':
        return `${value} days`
      case 'number':
      default:
        return value.toLocaleString()
    }
  }

  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : ''
    return `${sign}${change.toFixed(1)}%`
  }

  const getTrendIcon = (trending?: string, change?: number) => {
    if (!trending && change !== undefined) {
      if (change > 0) return <TrendingUp className="w-4 h-4 text-green-600" />
      if (change < 0) return <TrendingDown className="w-4 h-4 text-red-600" />
    }
    
    switch (trending) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-600" />
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-600" />
      default:
        return null
    }
  }

  const getMetricIcon = (metric: KPIMetric) => {
    if (metric.icon) {
      const Icon = metric.icon
      return <Icon className="w-5 h-5" />
    }

    // Default icons by category
    switch (metric.category) {
      case 'financial':
        return <DollarSign className="w-5 h-5 text-green-600" />
      case 'operational':
        return <Home className="w-5 h-5 text-blue-600" />
      case 'tenant':
        return <Users className="w-5 h-5 text-purple-600" />
      case 'maintenance':
        return <Wrench className="w-5 h-5 text-yellow-600" />
      default:
        return <BarChart3 className="w-5 h-5 text-gray-600" />
    }
  }

  const getAlertIcon = (type: PerformanceAlert['type']) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle className="w-5 h-5 text-red-600" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />
      case 'success':
        return <ThumbsUp className="w-5 h-5 text-green-600" />
      default:
        return <Info className="w-5 h-5 text-blue-600" />
    }
  }

  const handleRefresh = async () => {
    if (!onRefresh) return
    
    setRefreshing(true)
    try {
      await onRefresh()
    } finally {
      setRefreshing(false)
    }
  }

  const toggleMetricExpanded = (metricId: string) => {
    const newExpanded = new Set(expandedMetrics)
    if (newExpanded.has(metricId)) {
      newExpanded.delete(metricId)
    } else {
      newExpanded.add(metricId)
    }
    setExpandedMetrics(newExpanded)
  }

  if (loading) {
    return (
      <div className={cn(dashboardVariants({ layout, density }), className)} {...props}>
        {/* Header skeleton */}
        <div className="flex justify-between items-center mb-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        {/* KPI cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="p-4 border rounded-lg space-y-3">
              <div className="flex justify-between items-start">
                <Skeleton className="w-8 h-8" />
                <Skeleton className="w-12 h-4" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          ))}
        </div>

        {/* Alerts skeleton */}
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Skeleton className="w-5 h-5" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-64" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn(dashboardVariants({ layout, density }), className)} {...props}>
        <div className="flex items-center justify-center h-96">
          <div className="text-center space-y-3">
            <AlertTriangle className="w-16 h-16 text-destructive mx-auto" />
            <div>
              <Text weight="semibold" className="text-destructive">
                Failed to load dashboard
              </Text>
              <Text size="sm" variant="muted">
                {error}
              </Text>
            </div>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(dashboardVariants({ layout, density }), className)} {...props}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <Text size="xl" weight="bold">
              {title}
            </Text>
            {organizationName && (
              <Badge variant="outline">
                {organizationName}
              </Badge>
            )}
            {criticalAlerts > 0 && (
              <Badge variant="error" className="animate-pulse">
                {criticalAlerts} Critical
              </Badge>
            )}
          </div>
          {subtitle && (
            <Text variant="muted" className="mt-1">
              {subtitle}
            </Text>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Timeframe selector */}
          <select
            value={timeframe}
            onChange={(e) => onTimeframeChange?.(e.target.value)}
            className="px-3 py-2 text-sm border border-border rounded-md bg-background"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="12m">Last 12 Months</option>
            <option value="ytd">Year to Date</option>
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
          </Button>

          {onExport && (
            <Button variant="outline" size="sm" onClick={() => onExport('pdf')}>
              <Download className="w-4 h-4" />
            </Button>
          )}

          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Critical Alerts Notice */}
      {criticalAlerts > 0 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <Text weight="semibold" className="text-destructive">
              {criticalAlerts} Critical Alert{criticalAlerts === 1 ? '' : 's'} Require Attention
            </Text>
          </div>
        </div>
      )}

      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(metricsByCategory).map(([category, categoryMetrics]) =>
          categoryMetrics.map((metric) => {
            const isExpanded = expandedMetrics.has(metric.id)
            const hasTarget = metric.target !== undefined
            const targetAchievement = hasTarget && typeof metric.value === 'number' 
              ? (metric.value / metric.target!) * 100 
              : null

            return (
              <div
                key={metric.id}
                className={cn(
                  metricCardVariants({
                    size: layout === 'compact' ? 'sm' : 'md',
                    variant: metric.priority === 'high' && metric.changeType === 'decrease' ? 'alert' : 'default',
                    interactive: !!onMetricClick,
                  })
                )}
                onClick={() => onMetricClick?.(metric)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    {getMetricIcon(metric)}
                    <div>
                      <Text size="sm" variant="muted">
                        {metric.label}
                      </Text>
                      {metric.category && (
                        <Badge variant="outline" className="text-xs capitalize">
                          {metric.category}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    {showTrends && getTrendIcon(metric.trending, metric.change)}
                    {onMetricClick && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation()
                          toggleMetricExpanded(metric.id)
                        }}
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                <div className="mt-3 space-y-1">
                  <Text size="lg" weight="bold">
                    {formatValue(metric.value, metric.unit)}
                  </Text>

                  {metric.change !== undefined && (
                    <div className="flex items-center space-x-2">
                      <Text
                        size="sm"
                        className={cn(
                          metric.change >= 0 ? "text-green-600" : "text-red-600"
                        )}
                      >
                        {formatChange(metric.change)}
                      </Text>
                      <Text size="sm" variant="muted">
                        vs previous period
                      </Text>
                    </div>
                  )}

                  {hasTarget && targetAchievement && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Target Progress</span>
                        <span>{targetAchievement.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className={cn(
                            "h-2 rounded-full transition-all",
                            targetAchievement >= 100 ? "bg-green-500" : 
                            targetAchievement >= 75 ? "bg-yellow-500" : "bg-red-500"
                          )}
                          style={{ width: `${Math.min(targetAchievement, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t space-y-2">
                    <Text size="sm" variant="muted">
                      Additional metric details would be shown here.
                    </Text>
                    {/* Add trend charts, historical data, etc. */}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Performance Alerts */}
      {showAlerts && alerts.length > 0 && (
        <div className="space-y-4">
          <Text size="lg" weight="semibold">
            Performance Alerts
          </Text>
          <div className="space-y-3">
            {alerts.slice(0, 5).map((alert) => (
              <div
                key={alert.id}
                className={cn(
                  "p-4 border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors",
                  alert.type === 'critical' && "border-red-200 bg-red-50 dark:bg-red-900/20",
                  alert.type === 'warning' && "border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20",
                  alert.type === 'success' && "border-green-200 bg-green-50 dark:bg-green-900/20"
                )}
                onClick={() => onAlertClick?.(alert)}
              >
                <div className="flex items-start space-x-3">
                  {getAlertIcon(alert.type)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <Text weight="semibold">{alert.title}</Text>
                      <div className="flex items-center space-x-2">
                        {alert.propertyName && (
                          <Badge variant="outline" className="text-xs">
                            <MapPin className="w-3 h-3 mr-1" />
                            {alert.propertyName}
                          </Badge>
                        )}
                        <Text size="xs" variant="muted">
                          {alert.timestamp.toLocaleTimeString()}
                        </Text>
                      </div>
                    </div>
                    <Text size="sm" variant="muted" className="mt-1">
                      {alert.description}
                    </Text>
                    {alert.value && alert.threshold && (
                      <Text size="xs" variant="muted" className="mt-1">
                        Current: {alert.value} | Threshold: {alert.threshold}
                      </Text>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {alerts.length > 5 && (
              <div className="text-center">
                <Button variant="outline" size="sm">
                  View All {alerts.length} Alerts
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Benchmarks */}
      {showBenchmarks && benchmarks.length > 0 && (
        <div className="space-y-4">
          <Text size="lg" weight="semibold">
            Industry Benchmarks
          </Text>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {benchmarks.map((benchmark, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <Text weight="semibold" size="sm" className="mb-3">
                  {benchmark.metric}
                </Text>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Your Performance:</span>
                    <span className="font-medium">{benchmark.currentValue.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Market Average:</span>
                    <span>{benchmark.marketAverage.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Top 10%:</span>
                    <span>{benchmark.topPercentile.toFixed(1)}%</span>
                  </div>
                  {benchmark.rank && benchmark.totalProperties && (
                    <div className="pt-2 border-t">
                      <Text size="xs" variant="muted">
                        Ranked #{benchmark.rank} of {benchmark.totalProperties} properties
                      </Text>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {metrics.length === 0 && !loading && (
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-3">
            <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto" />
            <div>
              <Text weight="semibold">No performance data available</Text>
              <Text size="sm" variant="muted">
                Check your data sources or contact support
              </Text>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export { PerformanceMetricsDashboard }