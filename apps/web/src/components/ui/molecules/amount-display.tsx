"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

import { cn } from "@/lib/utils"


const amountDisplayVariants = cva(
  "inline-flex items-center gap-1 font-medium",
  {
    variants: {
      type: {
        income: "text-green-700 dark:text-green-400",
        expense: "text-red-700 dark:text-red-400", 
        neutral: "text-foreground",
        profit: "text-green-700 dark:text-green-400",
        loss: "text-red-700 dark:text-red-400"
      },
      size: {
        xs: "text-xs",
        sm: "text-sm",
        md: "text-base", 
        lg: "text-lg font-semibold",
        xl: "text-xl font-semibold",
        "2xl": "text-2xl font-bold"
      },
      variant: {
        default: "",
        highlighted: "px-2 py-1 rounded-md bg-opacity-10",
        badge: "px-2 py-1 rounded-full text-xs font-medium",
        underlined: "border-b border-current border-opacity-30"
      }
    },
    compoundVariants: [
      {
        type: "income",
        variant: "highlighted",
        className: "bg-green-100 dark:bg-green-900/20"
      },
      {
        type: "expense", 
        variant: "highlighted",
        className: "bg-red-100 dark:bg-red-900/20"
      },
      {
        type: "neutral",
        variant: "highlighted", 
        className: "bg-muted"
      },
      {
        type: "income",
        variant: "badge",
        className: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      },
      {
        type: "expense",
        variant: "badge",
        className: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
      }
    ],
    defaultVariants: {
      type: "neutral",
      size: "md",
      variant: "default"
    }
  }
)

export interface AmountDisplayProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof amountDisplayVariants> {
  amount: number
  currency?: string
  showSign?: boolean
  showIcon?: boolean
  showCurrency?: boolean
  locale?: string
  precision?: number
  abbreviate?: boolean
  prefix?: string
  suffix?: string
}

function AmountDisplay({
  amount,
  currency = "USD",
  showSign = false,
  showIcon = false,
  showCurrency = true,
  locale = "en-US",
  precision = 2,
  abbreviate = false,
  prefix,
  suffix,
  type,
  size,
  variant,
  className,
  ...props
}: AmountDisplayProps) {
  // Determine type automatically if not provided
  const determinedType = React.useMemo(() => {
    if (type) return type
    if (amount > 0) return "income"
    if (amount < 0) return "expense"
    return "neutral"
  }, [amount, type])

  // Format the amount
  const formatAmount = React.useCallback(() => {
    const value = Math.abs(amount)
    
    if (abbreviate && value >= 1000) {
      const units = ['', 'K', 'M', 'B', 'T']
      const unitIndex = Math.floor(Math.log10(value) / 3)
      const scaledValue = value / Math.pow(1000, unitIndex)
      
      return new Intl.NumberFormat(locale, {
        style: showCurrency ? "currency" : "decimal",
        currency: showCurrency ? currency : undefined,
        maximumFractionDigits: scaledValue >= 100 ? 0 : 1
      }).format(scaledValue) + units[unitIndex]
    }

    return new Intl.NumberFormat(locale, {
      style: showCurrency ? "currency" : "decimal",
      currency: showCurrency ? currency : undefined,
      minimumFractionDigits: precision,
      maximumFractionDigits: precision
    }).format(value)
  }, [amount, currency, showCurrency, locale, precision, abbreviate])

  // Get the appropriate icon
  const getIcon = () => {
    if (!showIcon) return null
    
    switch (determinedType) {
      case "income":
      case "profit":
        return <TrendingUp className="h-4 w-4" />
      case "expense":
      case "loss":
        return <TrendingDown className="h-4 w-4" />
      default:
        return <Minus className="h-4 w-4" />
    }
  }

  // Determine if we should show a sign
  const shouldShowSign = showSign || (determinedType === "income" && amount > 0)
  const sign = shouldShowSign ? (amount >= 0 ? "+" : "-") : (amount < 0 ? "-" : "")

  return (
    <span
      className={cn(
        amountDisplayVariants({ 
          type: determinedType, 
          size, 
          variant 
        }), 
        className
      )}
      {...props}
    >
      {getIcon()}
      {prefix}
      {sign}
      {formatAmount()}
      {suffix}
    </span>
  )
}

// Specialized components for common patterns
export function IncomeAmount({ amount, ...props }: Omit<AmountDisplayProps, "type">) {
  return (
    <AmountDisplay
      amount={Math.abs(amount)}
      type="income"
      showIcon={true}
      {...props}
    />
  )
}

export function ExpenseAmount({ amount, ...props }: Omit<AmountDisplayProps, "type">) {
  return (
    <AmountDisplay
      amount={Math.abs(amount)}
      type="expense"
      showIcon={true}
      {...props}
    />
  )
}

export function ProfitLossAmount({ amount, ...props }: Omit<AmountDisplayProps, "type">) {
  return (
    <AmountDisplay
      amount={amount}
      type={amount >= 0 ? "profit" : "loss"}
      showSign={true}
      showIcon={true}
      {...props}
    />
  )
}

export function CurrencyBadge({ amount, ...props }: Omit<AmountDisplayProps, "variant">) {
  return (
    <AmountDisplay
      amount={amount}
      variant="badge"
      size="sm"
      {...props}
    />
  )
}

export { AmountDisplay }