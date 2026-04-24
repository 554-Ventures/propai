"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Text } from "../ui/atoms/text"

// Define role hierarchy for PropTech organizations
export type Role = 'owner' | 'admin' | 'manager' | 'leasing_agent' | 'maintenance' | 'viewer' | 'guest'

// Permission mapping for common PropTech actions
export type Permission = 
  | 'property.create' | 'property.edit' | 'property.delete' | 'property.archive' | 'property.view'
  | 'unit.create' | 'unit.edit' | 'unit.delete' | 'unit.archive' | 'unit.view'
  | 'tenant.create' | 'tenant.edit' | 'tenant.delete' | 'tenant.view_sensitive' | 'tenant.view'
  | 'lease.create' | 'lease.edit' | 'lease.delete' | 'lease.approve'
  | 'maintenance.create' | 'maintenance.assign' | 'maintenance.complete'
  | 'financial.view' | 'financial.edit' | 'financial.export'
  | 'reports.view' | 'reports.export' | 'reports.advanced'
  | 'users.invite' | 'users.manage' | 'users.remove'
  | 'billing.view' | 'billing.manage'
  | 'organization.settings' | 'organization.delete'

// Role hierarchy levels (higher = more permissions)
const ROLE_HIERARCHY: Record<Role, number> = {
  guest: 0,
  viewer: 1,
  maintenance: 2,
  leasing_agent: 3,
  manager: 4,
  admin: 5,
  owner: 6,
}

// Default permissions by role
const DEFAULT_ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  guest: [],
  viewer: ['property.view', 'unit.view', 'tenant.view', 'reports.view'],
  maintenance: [
    'property.view', 'unit.view', 'unit.edit',
    'maintenance.create', 'maintenance.complete',
    'reports.view'
  ],
  leasing_agent: [
    'property.view', 'property.edit', 'unit.view', 'unit.edit',
    'tenant.create', 'tenant.edit', 'tenant.view_sensitive',
    'lease.create', 'lease.edit', 'reports.view'
  ],
  manager: [
    'property.create', 'property.edit', 'unit.create', 'unit.edit',
    'tenant.create', 'tenant.edit', 'tenant.delete', 'tenant.view_sensitive',
    'lease.create', 'lease.edit', 'lease.approve',
    'maintenance.create', 'maintenance.assign', 'maintenance.complete',
    'financial.view', 'reports.view', 'reports.export'
  ],
  admin: [
    'property.create', 'property.edit', 'property.delete', 'property.archive',
    'unit.create', 'unit.edit', 'unit.delete', 'unit.archive',
    'tenant.create', 'tenant.edit', 'tenant.delete', 'tenant.view_sensitive',
    'lease.create', 'lease.edit', 'lease.delete', 'lease.approve',
    'maintenance.create', 'maintenance.assign', 'maintenance.complete',
    'financial.view', 'financial.edit', 'financial.export',
    'reports.view', 'reports.export', 'reports.advanced',
    'users.invite', 'users.manage'
  ],
  owner: [
    // All permissions
    'property.create', 'property.edit', 'property.delete', 'property.archive',
    'unit.create', 'unit.edit', 'unit.delete', 'unit.archive',
    'tenant.create', 'tenant.edit', 'tenant.delete', 'tenant.view_sensitive',
    'lease.create', 'lease.edit', 'lease.delete', 'lease.approve',
    'maintenance.create', 'maintenance.assign', 'maintenance.complete',
    'financial.view', 'financial.edit', 'financial.export',
    'reports.view', 'reports.export', 'reports.advanced',
    'users.invite', 'users.manage', 'users.remove',
    'billing.view', 'billing.manage',
    'organization.settings', 'organization.delete'
  ],
}

export interface RoleContext {
  currentRole: Role
  organizationId: string
  userId: string
  permissions?: Permission[]
  customRoleRules?: Record<string, boolean>
}

const roleDisplayVariants = cva(
  "transition-all duration-200",
  {
    variants: {
      fallback: {
        hidden: "opacity-0 h-0 overflow-hidden",
        placeholder: "opacity-60 italic",
        blur: "blur-sm pointer-events-none select-none",
      },
    },
    defaultVariants: {
      fallback: "hidden",
    },
  }
)

export interface RoleBasedDisplayProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof roleDisplayVariants> {
  // Authorization conditions
  allowedRoles?: Role[]
  requiredRole?: Role
  requiredPermissions?: Permission[]
  customRule?: (context: RoleContext) => boolean
  
  // Access control logic
  requireAll?: boolean // For permissions: require ALL vs ANY
  
  // Current user context
  roleContext: RoleContext
  
  // Fallback content
  fallbackContent?: React.ReactNode
  fallbackMessage?: string
  
  // Content to display when authorized
  children: React.ReactNode
}

function RoleBasedDisplay({
  className,
  fallback,
  allowedRoles = [],
  requiredRole,
  requiredPermissions = [],
  customRule,
  requireAll = false,
  roleContext,
  fallbackContent,
  fallbackMessage,
  children,
  ...props
}: RoleBasedDisplayProps) {
  // Helper functions
  const hasRole = (role: Role): boolean => {
    return roleContext.currentRole === role
  }

  const hasMinimumRole = (minimumRole: Role): boolean => {
    return ROLE_HIERARCHY[roleContext.currentRole] >= ROLE_HIERARCHY[minimumRole]
  }

  const hasPermission = (permission: Permission): boolean => {
    const userPermissions = roleContext.permissions || DEFAULT_ROLE_PERMISSIONS[roleContext.currentRole] || []
    return userPermissions.includes(permission)
  }

  const hasPermissions = (permissions: Permission[]): boolean => {
    if (permissions.length === 0) return true
    
    if (requireAll) {
      return permissions.every(permission => hasPermission(permission))
    } else {
      return permissions.some(permission => hasPermission(permission))
    }
  }

  // Authorization logic
  const isAuthorized = (): boolean => {
    // Custom rule takes precedence
    if (customRule) {
      return customRule(roleContext)
    }

    // Check specific role requirement
    if (requiredRole && !hasMinimumRole(requiredRole)) {
      return false
    }

    // Check allowed roles
    if (allowedRoles.length > 0 && !allowedRoles.some(role => hasRole(role))) {
      return false
    }

    // Check required permissions
    if (requiredPermissions.length > 0 && !hasPermissions(requiredPermissions)) {
      return false
    }

    // If no restrictions specified, allow access
    if (
      !customRule &&
      !requiredRole &&
      allowedRoles.length === 0 &&
      requiredPermissions.length === 0
    ) {
      return true
    }

    return true
  }

  const authorized = isAuthorized()

  // Render authorized content
  if (authorized) {
    return (
      <div className={cn(className)} {...props}>
        {children}
      </div>
    )
  }

  // Render fallback content
  const renderFallback = () => {
    if (fallbackContent) {
      return fallbackContent
    }

    if (fallbackMessage) {
      return (
        <div className={cn(roleDisplayVariants({ fallback }))}>
          <Text variant="muted" size="sm">
            {fallbackMessage}
          </Text>
        </div>
      )
    }

    if (fallback === 'placeholder') {
      return (
        <div className={cn(roleDisplayVariants({ fallback }))}>
          <Text variant="muted" size="sm">
            Content restricted based on your role ({roleContext.currentRole})
          </Text>
        </div>
      )
    }

    if (fallback === 'blur') {
      return (
        <div className={cn(roleDisplayVariants({ fallback }))}>
          {children}
        </div>
      )
    }

    return null
  }

  return (
    <div className={cn(className)} {...props}>
      {renderFallback()}
    </div>
  )
}

// Convenience components for common PropTech roles
interface ConditionalRoleProps {
  roleContext: RoleContext
  fallback?: VariantProps<typeof roleDisplayVariants>['fallback']
  fallbackContent?: React.ReactNode
  children: React.ReactNode
}

// Owner-only content
function OwnerOnly({ roleContext, ...props }: ConditionalRoleProps) {
  return (
    <RoleBasedDisplay
      requiredRole="owner"
      roleContext={roleContext}
      {...props}
    />
  )
}

// Admin or higher
function AdminOrHigher({ roleContext, ...props }: ConditionalRoleProps) {
  return (
    <RoleBasedDisplay
      requiredRole="admin"
      roleContext={roleContext}
      {...props}
    />
  )
}

// Manager or higher (common for operational features)
function ManagerOrHigher({ roleContext, ...props }: ConditionalRoleProps) {
  return (
    <RoleBasedDisplay
      requiredRole="manager"
      roleContext={roleContext}
      {...props}
    />
  )
}

// Financial data access
function FinancialAccess({ roleContext, ...props }: ConditionalRoleProps) {
  return (
    <RoleBasedDisplay
      requiredPermissions={['financial.view']}
      roleContext={roleContext}
      fallbackMessage="Financial data access restricted"
      {...props}
    />
  )
}

// Maintenance workflows
function MaintenanceAccess({ roleContext, ...props }: ConditionalRoleProps) {
  return (
    <RoleBasedDisplay
      allowedRoles={['maintenance', 'manager', 'admin', 'owner']}
      roleContext={roleContext}
      fallbackMessage="Maintenance access required"
      {...props}
    />
  )
}

// Tenant sensitive information
function TenantSensitiveAccess({ roleContext, ...props }: ConditionalRoleProps) {
  return (
    <RoleBasedDisplay
      requiredPermissions={['tenant.view_sensitive']}
      roleContext={roleContext}
      fallbackMessage="Sensitive tenant information restricted"
      fallback="blur"
      {...props}
    />
  )
}

// Hook for role context
function useRoleContext(): RoleContext | null {
  const [roleContext, _setRoleContext] = React.useState<RoleContext | null>(null)

  React.useEffect(() => {
    // In a real app, this would come from your auth/state management
    // For now, return null and expect it to be provided via props
  }, [])

  return roleContext
}

// Utility functions for role checking (can be used outside components)
export const RoleUtils = {
  hasRole: (context: RoleContext, role: Role) => context.currentRole === role,
  hasMinimumRole: (context: RoleContext, minimumRole: Role) => 
    ROLE_HIERARCHY[context.currentRole] >= ROLE_HIERARCHY[minimumRole],
  hasPermission: (context: RoleContext, permission: Permission) => {
    const permissions = context.permissions || DEFAULT_ROLE_PERMISSIONS[context.currentRole] || []
    return permissions.includes(permission)
  },
  canPerformAction: (context: RoleContext, requiredPermissions: Permission[], requireAll = false) => {
    if (requireAll) {
      return requiredPermissions.every(p => RoleUtils.hasPermission(context, p))
    }
    return requiredPermissions.some(p => RoleUtils.hasPermission(context, p))
  }
}

export {
  RoleBasedDisplay,
  OwnerOnly,
  AdminOrHigher,
  ManagerOrHigher,
  FinancialAccess,
  MaintenanceAccess,
  TenantSensitiveAccess,
  useRoleContext,
  ROLE_HIERARCHY,
  DEFAULT_ROLE_PERMISSIONS,
}