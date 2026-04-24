"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { CheckCircle, Clock, XCircle, AlertTriangle, Archive, Home, User, FileText, DollarSign } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "../atoms/badge"

// Status mappings for different domains
type LeaseStatus = "DRAFT" | "ACTIVE" | "ENDED" | "EXPIRED"
type PropertyStatus = "ACTIVE" | "ARCHIVED" | "MAINTENANCE" 
type TenantStatus = "ACTIVE" | "INACTIVE" | "PENDING"
type PaymentStatus = "PAID" | "PENDING" | "OVERDUE" | "FAILED"
type Priority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"

type StatusType = LeaseStatus | PropertyStatus | TenantStatus | PaymentStatus | Priority

const statusConfig: Record<string, {
  variant: 'default' | 'secondary' | 'success' | 'warning' | 'error' | 'outline'
  icon?: React.ComponentType<{ className?: string }>
  label?: string
}> = {
  // Lease statuses
  DRAFT: { variant: 'outline', icon: FileText, label: 'Draft' },
  ACTIVE: { variant: 'success', icon: CheckCircle, label: 'Active' },
  ENDED: { variant: 'secondary', icon: XCircle, label: 'Ended' },
  EXPIRED: { variant: 'error', icon: AlertTriangle, label: 'Expired' },
  
  // Property statuses
  // ACTIVE is already defined above
  ARCHIVED: { variant: 'secondary', icon: Archive, label: 'Archived' },
  MAINTENANCE: { variant: 'warning', icon: AlertTriangle, label: 'Maintenance' },
  
  // Tenant statuses 
  // ACTIVE is already defined above
  INACTIVE: { variant: 'secondary', icon: User, label: 'Inactive' },
  PENDING: { variant: 'warning', icon: Clock, label: 'Pending' },
  
  // Payment statuses
  PAID: { variant: 'success', icon: CheckCircle, label: 'Paid' },
  // PENDING is already defined above
  OVERDUE: { variant: 'error', icon: AlertTriangle, label: 'Overdue' },
  FAILED: { variant: 'error', icon: XCircle, label: 'Failed' },
  
  // Priority levels
  LOW: { variant: 'outline', label: 'Low' },
  MEDIUM: { variant: 'secondary', label: 'Medium' },
  HIGH: { variant: 'warning', label: 'High' },
  CRITICAL: { variant: 'error', label: 'Critical' },
}

const statusBadgeVariants = cva(
  "inline-flex items-center gap-1.5",
  {
    variants: {
      size: {
        sm: "text-xs",
        md: "text-xs",
        lg: "text-sm",
      },
      showIcon: {
        true: "",
        false: "",
      },
    },
    defaultVariants: {
      size: "md",
      showIcon: true,
    },
  }
)

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusBadgeVariants> {
  status: StatusType
  priority?: Priority
  customLabel?: string
  showIcon?: boolean
  pulse?: boolean // For active/live statuses
}

function StatusBadge({
  className,
  size,
  status,
  priority,
  customLabel,
  showIcon = true,
  pulse = false,
  ...props
}: StatusBadgeProps) {
  const config = statusConfig[status]
  const priorityConfig = priority ? statusConfig[priority] : null
  
  if (!config) {
    console.warn(`Unknown status: ${status}. Using default configuration.`)
    return (
      <Badge variant="outline" size={size} className={className}>
        {customLabel || status}
      </Badge>
    )
  }
  
  const Icon = config.icon
  const label = customLabel || config.label || status
  
  // Use priority variant if provided, otherwise use status variant
  const variant = priorityConfig?.variant || config.variant
  
  return (
    <Badge
      variant={variant}
      size={size}
      className={cn(
        statusBadgeVariants({ size, showIcon }),
        pulse && "animate-pulse",
        className
      )}
      {...props}
    >
      {showIcon && Icon && (
        <Icon className={cn(
          "shrink-0",
          size === "sm" ? "h-3 w-3" : size === "lg" ? "h-4 w-4" : "h-3.5 w-3.5"
        )} />
      )}
      {label}
      {priority && priority !== status && (
        <span className="ml-1 opacity-75">({priorityConfig?.label || priority})</span>
      )}
    </Badge>
  )
}

// Convenience components for specific domains
const LeaseStatusBadge = ({ status, ...props }: { status: LeaseStatus } & Omit<StatusBadgeProps, 'status'>) => (
  <StatusBadge status={status} {...props} />
)

const PropertyStatusBadge = ({ status, ...props }: { status: PropertyStatus } & Omit<StatusBadgeProps, 'status'>) => (
  <StatusBadge status={status} {...props} />
)

const PaymentStatusBadge = ({ status, ...props }: { status: PaymentStatus } & Omit<StatusBadgeProps, 'status'>) => (
  <StatusBadge status={status} {...props} />
)

const PriorityBadge = ({ priority, ...props }: { priority: Priority } & Omit<StatusBadgeProps, 'status'>) => (
  <StatusBadge status={priority} {...props} />
)

export { 
  StatusBadge, 
  LeaseStatusBadge, 
  PropertyStatusBadge,  
  PaymentStatusBadge,
  PriorityBadge,
  statusBadgeVariants,
  type LeaseStatus,
  type PropertyStatus,
  type TenantStatus,
  type PaymentStatus,
  type Priority,
}
