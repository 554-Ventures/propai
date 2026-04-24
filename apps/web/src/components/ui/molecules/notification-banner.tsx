"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Info,
  X
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "../button"
import { Text } from "../atoms/text"

const notificationBannerVariants = cva(
  "relative flex items-start gap-3 p-4 border rounded-lg transition-all",
  {
    variants: {
      variant: {
        success: "bg-green-50 border-green-200 text-green-900 dark:bg-green-900/10 dark:border-green-700 dark:text-green-100",
        warning: "bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-900/10 dark:border-amber-700 dark:text-amber-100",
        error: "bg-red-50 border-red-200 text-red-900 dark:bg-red-900/10 dark:border-red-700 dark:text-red-100",
        info: "bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-900/10 dark:border-blue-700 dark:text-blue-100"
      },
      size: {
        sm: "p-3 text-sm",
        md: "p-4",
        lg: "p-6 text-lg"
      }
    },
    defaultVariants: {
      variant: "info",
      size: "md"
    }
  }
)

const iconVariants = cva("flex-shrink-0 mt-0.5", {
  variants: {
    size: {
      sm: "h-4 w-4",
      md: "h-5 w-5", 
      lg: "h-6 w-6"
    }
  },
  defaultVariants: {
    size: "md"
  }
})

export interface NotificationBannerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof notificationBannerVariants> {
  title: string
  description?: string
  actions?: React.ReactNode
  dismissible?: boolean
  onDismiss?: () => void
  persistent?: boolean
  icon?: React.ReactNode | boolean
  className?: string
}

function NotificationBanner({
  variant = "info",
  size = "md",
  title,
  description,
  actions,
  dismissible = false,
  onDismiss,
  persistent = false,
  icon,
  className,
  ...props
}: NotificationBannerProps) {
  const [isVisible, setIsVisible] = React.useState(true)

  // Auto-dismiss after 5 seconds if not persistent and dismissible
  React.useEffect(() => {
    if (!persistent && dismissible && !onDismiss) {
      const timer = setTimeout(() => {
        setIsVisible(false)
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [persistent, dismissible, onDismiss])

  const handleDismiss = () => {
    setIsVisible(false)
    onDismiss?.()
  }

  const getIcon = () => {
    if (icon === false) return null
    if (icon && icon !== true) return icon

    const iconClass = iconVariants({ size })
    
    switch (variant) {
      case "success":
        return <CheckCircle className={cn(iconClass, "text-green-600 dark:text-green-400")} />
      case "warning":
        return <AlertTriangle className={cn(iconClass, "text-amber-600 dark:text-amber-400")} />
      case "error":
        return <XCircle className={cn(iconClass, "text-red-600 dark:text-red-400")} />
      case "info":
      default:
        return <Info className={cn(iconClass, "text-blue-600 dark:text-blue-400")} />
    }
  }

  if (!isVisible) return null

  return (
    <div
      className={cn(notificationBannerVariants({ variant, size }), className)}
      role="alert"
      aria-live="polite"
      {...props}
    >
      {/* Icon */}
      {getIcon()}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <Text 
          variant="default"
          size={size === "lg" ? "md" : "sm"}
          className="font-medium leading-tight mb-1"
        >
          {title}
        </Text>
        
        {description && (
          <Text
            variant="muted"
            size={size === "lg" ? "sm" : "xs"}
            className="leading-relaxed"
          >
            {description}
          </Text>
        )}

        {/* Actions */}
        {actions && (
          <div className="flex items-center gap-2 mt-3">
            {actions}
          </div>
        )}
      </div>

      {/* Dismiss Button */}
      {dismissible && (
        <Button
          variant="ghost"
          size={size === "lg" ? "icon-sm" : "icon-xs"}
          onClick={handleDismiss}
          className="absolute top-3 right-3 opacity-70 hover:opacity-100"
          aria-label="Dismiss notification"
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  )
}

// Convenience components for common patterns
export function SuccessBanner({ 
  title = "Success", 
  ...props 
}: Omit<NotificationBannerProps, "variant">) {
  return <NotificationBanner variant="success" title={title} {...props} />
}

export function ErrorBanner({ 
  title = "Error", 
  ...props 
}: Omit<NotificationBannerProps, "variant">) {
  return <NotificationBanner variant="error" title={title} {...props} />
}

export function WarningBanner({ 
  title = "Warning", 
  ...props 
}: Omit<NotificationBannerProps, "variant">) {
  return <NotificationBanner variant="warning" title={title} {...props} />
}

export function InfoBanner({ 
  title = "Information", 
  ...props 
}: Omit<NotificationBannerProps, "variant">) {
  return <NotificationBanner variant="info" title={title} {...props} />
}

export { NotificationBanner }