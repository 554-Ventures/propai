"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { AlertTriangle, Lock, ShieldAlert, UserX } from "lucide-react"

import { cn } from "@/lib/utils"
import { Text } from "../ui/atoms/text"
import { Button } from "../ui/button"
import { type RoleContext, type Role, type Permission, RoleUtils } from "./role-based-display"

// Permission boundary errors
export type BoundaryError = 
  | 'insufficient_role'
  | 'missing_permission'
  | 'organization_access_denied'
  | 'account_suspended'
  | 'trial_expired'
  | 'billing_issue'
  | 'custom_restriction'

export interface BoundaryViolation {
  type: BoundaryError
  message: string
  details?: string
  actionRequired?: string
  canRetry?: boolean
}

const boundaryVariants = cva(
  "w-full rounded-lg border p-6 text-center",
  {
    variants: {
      variant: {
        error: "border-destructive/50 bg-destructive/5",
        warning: "border-yellow-500/50 bg-yellow-50 dark:bg-yellow-900/10",
        info: "border-blue-500/50 bg-blue-50 dark:bg-blue-900/10",
        blocked: "border-muted bg-muted/20",
      },
      size: {
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
      },
    },
    defaultVariants: {
      variant: "blocked",
      size: "md",
    },
  }
)

export interface PermissionBoundaryProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof boundaryVariants> {
  // Authorization requirements
  requiredRole?: Role
  requiredPermissions?: Permission[]
  allowedRoles?: Role[]
  requireAll?: boolean
  
  // Organization/tenant isolation
  organizationId?: string
  allowCrossTenant?: boolean
  
  // Custom validation
  customValidator?: (context: RoleContext) => BoundaryViolation | null
  
  // Current context
  roleContext: RoleContext
  
  // Fallback handling
  errorFallback?: React.ComponentType<{ error: BoundaryViolation; retry: () => void }>
  onViolation?: (violation: BoundaryViolation) => void
  
  // Retry mechanism
  onRetry?: () => void
  retryLabel?: string
  
  // Content
  children: React.ReactNode
  loadingContent?: React.ReactNode
}

function PermissionBoundary({
  className,
  variant,
  size,
  requiredRole,
  requiredPermissions = [],
  allowedRoles = [],
  requireAll = false,
  organizationId,
  allowCrossTenant = false,
  customValidator,
  roleContext,
  errorFallback: ErrorFallback,
  onViolation,
  onRetry,
  retryLabel = "Try Again",
  children,
  loadingContent,
  ...props
}: PermissionBoundaryProps) {
  const [violation, setViolation] = React.useState<BoundaryViolation | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)

  // Validate permissions
  const validateAccess = React.useCallback((): BoundaryViolation | null => {
    // Custom validation first
    if (customValidator) {
      const customViolation = customValidator(roleContext)
      if (customViolation) return customViolation
    }

    // Organization/tenant isolation check
    if (!allowCrossTenant && organizationId && roleContext.organizationId !== organizationId) {
      return {
        type: 'organization_access_denied',
        message: 'Access Denied',
        details: 'You do not have access to this organization\'s data',
        actionRequired: 'Switch to the correct organization or contact your administrator',
        canRetry: false,
      }
    }

    // Role-based validation
    if (requiredRole && !RoleUtils.hasMinimumRole(roleContext, requiredRole)) {
      return {
        type: 'insufficient_role',
        message: 'Insufficient Permissions',
        details: `This feature requires ${requiredRole} role or higher. Your current role: ${roleContext.currentRole}`,
        actionRequired: 'Contact your administrator to upgrade your role',
        canRetry: false,
      }
    }

    // Specific role allowlist
    if (allowedRoles.length > 0 && !allowedRoles.includes(roleContext.currentRole)) {
      return {
        type: 'insufficient_role',
        message: 'Role Not Authorized',
        details: `This feature is only available to: ${allowedRoles.join(', ')}`,
        actionRequired: 'Contact your administrator for access',
        canRetry: false,
      }
    }

    // Permission-based validation
    if (requiredPermissions.length > 0) {
      const hasRequiredPermissions = requireAll
        ? requiredPermissions.every(p => RoleUtils.hasPermission(roleContext, p))
        : requiredPermissions.some(p => RoleUtils.hasPermission(roleContext, p))

      if (!hasRequiredPermissions) {
        const missingPermissions = requiredPermissions.filter(p => !RoleUtils.hasPermission(roleContext, p))
        return {
          type: 'missing_permission',
          message: 'Missing Permissions',
          details: `Required permissions: ${missingPermissions.join(', ')}`,
          actionRequired: 'Contact your administrator to grant these permissions',
          canRetry: false,
        }
      }
    }

    return null
  }, [
    customValidator,
    roleContext,
    allowCrossTenant,
    organizationId,
    requiredRole,
    allowedRoles,
    requiredPermissions,
    requireAll
  ])

  // Check access on mount and when dependencies change
  React.useEffect(() => {
    const accessViolation = validateAccess()
    setViolation(accessViolation)
    
    if (accessViolation && onViolation) {
      onViolation(accessViolation)
    }
  }, [validateAccess, onViolation])

  // Retry handler
  const handleRetry = React.useCallback(async () => {
    if (!onRetry) return

    setIsLoading(true)
    try {
      await onRetry()
      // Re-validate after retry
      const accessViolation = validateAccess()
      setViolation(accessViolation)
    } catch (error) {
      console.error('Retry failed:', error)
    } finally {
      setIsLoading(false)
    }
  }, [onRetry, validateAccess])

  // Loading state
  if (isLoading && loadingContent) {
    return (
      <div className={cn(className)} {...props}>
        {loadingContent}
      </div>
    )
  }

  // Access granted - render children
  if (!violation) {
    return (
      <div className={cn(className)} {...props}>
        {children}
      </div>
    )
  }

  // Custom error fallback
  if (ErrorFallback) {
    return (
      <div className={cn(className)} {...props}>
        <ErrorFallback error={violation} retry={handleRetry} />
      </div>
    )
  }

  // Default error display
  const getErrorIcon = (type: BoundaryError) => {
    switch (type) {
      case 'insufficient_role':
      case 'missing_permission':
        return <UserX className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
      case 'organization_access_denied':
        return <ShieldAlert className="w-12 h-12 text-destructive mx-auto mb-4" />
      case 'account_suspended':
      case 'billing_issue':
        return <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
      default:
        return <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
    }
  }

  const getErrorVariant = (type: BoundaryError): typeof variant => {
    switch (type) {
      case 'account_suspended':
      case 'trial_expired':
      case 'billing_issue':
        return 'warning'
      case 'organization_access_denied':
        return 'error'
      case 'custom_restriction':
        return 'info'
      default:
        return 'blocked'
    }
  }

  return (
    <div className={cn(className)} {...props}>
      <div className={cn(
        boundaryVariants({
          variant: variant || getErrorVariant(violation.type),
          size
        })
      )}>
        {getErrorIcon(violation.type)}
        
        <div className="space-y-3">
          <Text size="lg" weight="semibold" className="text-foreground">
            {violation.message}
          </Text>
          
          {violation.details && (
            <Text variant="muted" className="max-w-md mx-auto">
              {violation.details}
            </Text>
          )}
          
          {violation.actionRequired && (
            <div className="pt-2">
              <Text size="sm" variant="muted" className="italic">
                {violation.actionRequired}
              </Text>
            </div>
          )}
          
          {(violation.canRetry || onRetry) && (
            <div className="pt-4">
              <Button
                onClick={handleRetry}
                disabled={isLoading}
                variant="outline"
                size="sm"
              >
                {isLoading ? 'Retrying...' : retryLabel}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Context provider for permission boundaries
interface PermissionContextValue {
  roleContext: RoleContext
  organizationBoundary?: string
  globalBoundaryRules?: Record<string, boolean>
}

const PermissionContext = React.createContext<PermissionContextValue | null>(null)

export interface PermissionProviderProps {
  value: PermissionContextValue
  children: React.ReactNode
}

function PermissionProvider({ value, children }: PermissionProviderProps) {
  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  )
}

// Hook to access permission context
function usePermissionContext(): PermissionContextValue {
  const context = React.useContext(PermissionContext)
  if (!context) {
    throw new Error('usePermissionContext must be used within a PermissionProvider')
  }
  return context
}

// Higher-order component for page-level boundaries
interface withPermissionBoundaryOptions {
  requiredRole?: Role
  requiredPermissions?: Permission[]
  allowedRoles?: Role[]
  organizationScope?: boolean
  customValidator?: (context: RoleContext) => BoundaryViolation | null
}

function withPermissionBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options: withPermissionBoundaryOptions = {}
) {
  const WrappedComponent = (props: P) => {
    const permissionContext = usePermissionContext()
    
    return (
      <PermissionBoundary
        {...options}
        roleContext={permissionContext.roleContext}
        organizationId={options.organizationScope ? permissionContext.organizationBoundary : undefined}
      >
        <Component {...props} />
      </PermissionBoundary>
    )
  }
  
  WrappedComponent.displayName = `withPermissionBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

// Convenience boundaries for common PropTech scenarios
interface QuickBoundaryProps {
  children: React.ReactNode
  className?: string
  onViolation?: (violation: BoundaryViolation) => void
}

// Property management boundary (manager+)
function PropertyManagementBoundary({ children, ...props }: QuickBoundaryProps) {
  const { roleContext } = usePermissionContext()
  
  return (
    <PermissionBoundary
      requiredRole="manager"
      roleContext={roleContext}
      {...props}
    >
      {children}
    </PermissionBoundary>
  )
}

// Financial data boundary
function FinancialDataBoundary({ children, ...props }: QuickBoundaryProps) {
  const { roleContext } = usePermissionContext()
  
  return (
    <PermissionBoundary
      requiredPermissions={['financial.view']}
      roleContext={roleContext}
      {...props}
    >
      {children}
    </PermissionBoundary>
  )
}

// Admin settings boundary
function AdminSettingsBoundary({ children, ...props }: QuickBoundaryProps) {
  const { roleContext } = usePermissionContext()
  
  return (
    <PermissionBoundary
      requiredRole="admin"
      roleContext={roleContext}
      {...props}
    >
      {children}
    </PermissionBoundary>
  )
}

export {
  PermissionBoundary,
  PermissionProvider,
  usePermissionContext,
  withPermissionBoundary,
  PropertyManagementBoundary,
  FinancialDataBoundary,
  AdminSettingsBoundary,
}