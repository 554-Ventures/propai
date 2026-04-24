"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Download, 
  DollarSign,
  AlertCircle,
  Filter
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Text } from "../ui/atoms/text"
import { Button } from "../ui/button"
import { Badge } from "../ui/atoms/badge"
import { Skeleton } from "../ui/atoms/skeleton"

// Data types for cashflow visualization
export interface CashflowData {
  month: string
  year: number
  income: {
    rent: number
    fees: number
    other: number
    total: number
  }
  expenses: {
    maintenance: number
    utilities: number
    management: number
    taxes: number
    insurance: number
    mortgage: number
    other: number
    total: number
  }
  netCashflow: number
  occupancyRate: number
  propertyCount: number
}

export interface CashflowMetrics {
  totalIncome: number
  totalExpenses: number
  netCashflow: number
  avgMonthlyIncome: number
  avgMonthlyExpenses: number
  growthRate: number
  occupancyTrend: number
  cashflowTrend: 'up' | 'down' | 'stable'
  riskLevel: 'low' | 'medium' | 'high'
}

const chartVariants = cva(
  "w-full bg-card border border-border rounded-lg p-6",
  {
    variants: {
      size: {
        sm: "h-64",
        md: "h-80", 
        lg: "h-96",
        xl: "h-[32rem]",
      },
      variant: {
        default: "shadow-sm",
        elevated: "shadow-lg",
        minimal: "border-0 shadow-none bg-transparent p-4",
      },
    },
    defaultVariants: {
      size: "lg",
      variant: "default",
    },
  }
)

export interface CashflowTrendsChartProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof chartVariants> {
  data: CashflowData[]
  metrics?: CashflowMetrics
  title?: string
  subtitle?: string
  timeframe?: '3m' | '6m' | '12m' | '24m' | 'ytd' | 'all'
  onTimeframeChange?: (timeframe: string) => void
  showBreakdown?: boolean
  showMetrics?: boolean
  showComparison?: boolean
  comparisonPeriod?: string
  onExport?: (format: 'csv' | 'pdf' | 'png') => void
  onFilter?: (filters: Record<string, any>) => void
  loading?: boolean
  error?: string
  interactive?: boolean
}

function CashflowTrendsChart({
  className,
  size,
  variant,
  data = [],
  metrics,
  title = "Cashflow Trends",
  subtitle,
  timeframe = '12m',
  onTimeframeChange,
  showBreakdown = true,
  showMetrics = true,
  showComparison: showComparison = false,
  comparisonPeriod: comparisonPeriod,
  onExport,
  onFilter,
  loading = false,
  error,
  interactive: interactive = true,
  ...props
}: CashflowTrendsChartProps) {
  const [_selectedPeriod, _setSelectedPeriod] = React.useState<string | null>(null)
  const [showIncomeBreakdown, setShowIncomeBreakdown] = React.useState(false)
  const [showExpenseBreakdown, setShowExpenseBreakdown] = React.useState(false)

  const timeframes = [
    { value: '3m', label: '3 Months' },
    { value: '6m', label: '6 Months' },
    { value: '12m', label: '12 Months' },
    { value: '24m', label: '24 Months' },
    { value: 'ytd', label: 'YTD' },
    { value: 'all', label: 'All Time' },
  ]

  // Calculate chart dimensions and data processing
  const chartData = React.useMemo(() => {
    if (!data.length) return []
    
    // Process data based on timeframe
    const now = new Date()
    const cutoffDate = new Date()
    
    switch (timeframe) {
      case '3m':
        cutoffDate.setMonth(now.getMonth() - 3)
        break
      case '6m':
        cutoffDate.setMonth(now.getMonth() - 6)
        break
      case '12m':
        cutoffDate.setMonth(now.getMonth() - 12)
        break
      case '24m':
        cutoffDate.setMonth(now.getMonth() - 24)
        break
      case 'ytd':
        cutoffDate.setMonth(0, 1) // January 1st of current year
        break
      default:
        return data
    }
    
    return data.filter(item => {
      const itemDate = new Date(item.year, new Date(`${item.month} 1`).getMonth())
      return itemDate >= cutoffDate
    })
  }, [data, timeframe])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-600" />
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-600" />
      default:
        return <BarChart3 className="w-4 h-4 text-muted-foreground" />
    }
  }

  const getRiskBadgeVariant = (level: string) => {
    switch (level) {
      case 'high': return 'error'
      case 'medium': return 'secondary'
      case 'low': return 'outline'
      default: return 'outline'
    }
  }

  if (loading) {
    return (
      <div className={cn(chartVariants({ size, variant }), className)} {...props}>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-9 w-24" />
          </div>
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="p-4 border rounded-lg">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-full" />
              </div>
            ))}
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn(chartVariants({ size, variant }), className)} {...props}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center space-y-3">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
            <div>
              <Text weight="medium" className="text-destructive">
                Error loading cashflow data
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
    <div className={cn(chartVariants({ size, variant }), className)} {...props}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center space-x-2">
            <Text size="lg" weight="semibold">
              {title}
            </Text>
            {metrics && (
              <div className="flex items-center space-x-1">
                {getTrendIcon(metrics.cashflowTrend)}
                <Badge variant={getRiskBadgeVariant(metrics.riskLevel)}>
                  {metrics.riskLevel} risk
                </Badge>
              </div>
            )}
          </div>
          {subtitle && (
            <Text size="sm" variant="muted">
              {subtitle}
            </Text>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Timeframe selector */}
          <select
            value={timeframe}
            onChange={(e) => onTimeframeChange?.(e.target.value)}
            className="px-3 py-1.5 text-sm border border-border rounded-md bg-background"
          >
            {timeframes.map(tf => (
              <option key={tf.value} value={tf.value}>
                {tf.label}
              </option>
            ))}
          </select>

          {onFilter && (
            <Button variant="outline" size="sm" onClick={() => onFilter({})}>
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

      {/* Key Metrics */}
      {showMetrics && metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-900/20">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              <Text size="sm" variant="muted">Total Income</Text>
            </div>
            <Text size="lg" weight="semibold" className="text-green-700 dark:text-green-400">
              {formatCurrency(metrics.totalIncome)}
            </Text>
          </div>

          <div className="p-4 border rounded-lg bg-red-50 dark:bg-red-900/20">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-red-600" />
              <Text size="sm" variant="muted">Total Expenses</Text>
            </div>
            <Text size="lg" weight="semibold" className="text-red-700 dark:text-red-400">
              {formatCurrency(metrics.totalExpenses)}
            </Text>
          </div>

          <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <Text size="sm" variant="muted">Net Cashflow</Text>
            </div>
            <Text size="lg" weight="semibold" className={cn(
              metrics.netCashflow >= 0 ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"
            )}>
              {formatCurrency(metrics.netCashflow)}
            </Text>
          </div>

          <div className="p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-yellow-600" />
              <Text size="sm" variant="muted">Growth Rate</Text>
            </div>
            <Text size="lg" weight="semibold" className={cn(
              metrics.growthRate >= 0 ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"
            )}>
              {formatPercentage(metrics.growthRate)}
            </Text>
          </div>
        </div>
      )}

      {/* Chart Area - Placeholder for actual chart library */}
      <div className="flex-1 bg-muted/10 rounded-lg p-6 min-h-64">
        <div className="h-full flex items-center justify-center">
          <div className="text-center space-y-3">
            <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto" />
            <div>
              <Text weight="medium">Chart Visualization</Text>
              <Text size="sm" variant="muted">
                Integrate with Chart.js, D3, or Recharts for interactive cashflow visualization
              </Text>
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown Toggle */}
      {showBreakdown && (
        <div className="mt-6 pt-6 border-t">
          <div className="flex space-x-4">
            <Button
              variant={showIncomeBreakdown ? "default" : "outline"}
              size="sm"
              onClick={() => setShowIncomeBreakdown(!showIncomeBreakdown)}
            >
              Income Breakdown
            </Button>
            <Button
              variant={showExpenseBreakdown ? "default" : "outline"}
              size="sm"
              onClick={() => setShowExpenseBreakdown(!showExpenseBreakdown)}
            >
              Expense Breakdown
            </Button>
          </div>

          {/* Breakdown Details */}
          {(showIncomeBreakdown || showExpenseBreakdown) && chartData.length > 0 && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {showIncomeBreakdown && (
                <div className="p-4 border rounded-lg">
                  <Text weight="medium" className="mb-3 text-green-700 dark:text-green-400">
                    Income Breakdown
                  </Text>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Rent Revenue</span>
                      <span>{formatCurrency(chartData.reduce((sum, d) => sum + d.income.rent, 0))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Fees & Charges</span>
                      <span>{formatCurrency(chartData.reduce((sum, d) => sum + d.income.fees, 0))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Other Income</span>
                      <span>{formatCurrency(chartData.reduce((sum, d) => sum + d.income.other, 0))}</span>
                    </div>
                  </div>
                </div>
              )}

              {showExpenseBreakdown && (
                <div className="p-4 border rounded-lg">
                  <Text weight="medium" className="mb-3 text-red-700 dark:text-red-400">
                    Expense Breakdown
                  </Text>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Maintenance</span>
                      <span>{formatCurrency(chartData.reduce((sum, d) => sum + d.expenses.maintenance, 0))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Utilities</span>
                      <span>{formatCurrency(chartData.reduce((sum, d) => sum + d.expenses.utilities, 0))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Property Tax</span>
                      <span>{formatCurrency(chartData.reduce((sum, d) => sum + d.expenses.taxes, 0))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Insurance</span>
                      <span>{formatCurrency(chartData.reduce((sum, d) => sum + d.expenses.insurance, 0))}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export { CashflowTrendsChart }