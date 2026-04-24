"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Check, ChevronDown, Building2, Plus, Settings } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "../ui/atoms/badge"
import { Text } from "../ui/atoms/text"
import { Skeleton } from "../ui/atoms/skeleton"

const orgSwitcherVariants = cva(
  "relative inline-block text-left",
  {
    variants: {
      size: {
        sm: "text-sm",
        md: "text-base",
        lg: "text-lg",
      },
      variant: {
        default: "bg-background border border-border",
        ghost: "bg-transparent",
        outline: "bg-background border-2 border-primary/20",
      },
    },
    defaultVariants: {
      size: "md",
      variant: "default",
    },
  }
)

export interface Organization {
  id: string
  name: string
  slug: string
  logo?: string
  plan?: 'free' | 'pro' | 'enterprise'
  role: 'owner' | 'admin' | 'manager' | 'viewer'
  isActive: boolean
  propertyCount?: number
  unitCount?: number
  // Billing status for tenant isolation
  status?: 'active' | 'trial' | 'suspended' | 'delinquent'
}

export interface OrganizationSwitcherProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof orgSwitcherVariants> {
  organizations: Organization[]
  currentOrgId: string
  onOrganizationChange: (orgId: string) => void
  onCreateOrganization?: () => void
  onManageOrganization?: (orgId: string) => void
  loading?: boolean
  maxDisplayLength?: number
  showBadges?: boolean
  showMetrics?: boolean
}

function OrganizationSwitcher({
  className,
  size,
  variant,
  organizations = [],
  currentOrgId,
  onOrganizationChange,
  onCreateOrganization,
  onManageOrganization,
  loading = false,
  maxDisplayLength = 30,
  showBadges = true,
  showMetrics = false,
  ...props
}: OrganizationSwitcherProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  const currentOrg = organizations.find(org => org.id === currentOrgId)

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleOrganizationSelect = (orgId: string) => {
    onOrganizationChange(orgId)
    setIsOpen(false)
  }

  const truncateName = (name: string) => {
    if (name.length <= maxDisplayLength) return name
    return name.substring(0, maxDisplayLength - 3) + '...'
  }

  const getPlanBadgeVariant = (plan?: string): 'default' | 'secondary' | 'error' | 'outline' | 'success' | 'warning' => {
    switch (plan) {
      case 'enterprise': return 'default'
      case 'pro': return 'secondary'
      case 'free': return 'outline'
      default: return 'outline'
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return 'text-green-600'
      case 'trial': return 'text-blue-600'
      case 'suspended': return 'text-red-600'
      case 'delinquent': return 'text-yellow-600'
      default: return 'text-muted-foreground'
    }
  }

  if (loading) {
    return (
      <div className={cn(orgSwitcherVariants({ size, variant }), "rounded-md px-3 py-2", className)}>
        <div className="flex items-center space-x-3">
          <Skeleton className="w-8 h-8 rounded" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("relative", className)} ref={dropdownRef} {...props}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          orgSwitcherVariants({ size, variant }),
          "w-full rounded-md px-3 py-2 transition-colors hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          isOpen && "ring-2 ring-ring ring-offset-2"
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0">
            {/* Organization Logo/Icon */}
            <div className="flex-shrink-0">
              {currentOrg?.logo ? (
                <img
                  src={currentOrg.logo}
                  alt={`${currentOrg.name} logo`}
                  className="w-8 h-8 rounded object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-primary" />
                </div>
              )}
            </div>

            {/* Organization Info */}
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center space-x-2">
                <Text
                  weight="medium"
                  className="truncate text-foreground"
                  title={currentOrg?.name}
                >
                  {currentOrg ? truncateName(currentOrg.name) : 'Select Organization'}
                </Text>
                {showBadges && currentOrg?.plan && (
                  <Badge variant={getPlanBadgeVariant(currentOrg.plan)} className="text-xs">
                    {currentOrg.plan}
                  </Badge>
                )}
              </div>
              {currentOrg && (
                <div className="flex items-center space-x-2 mt-1">
                  <Text size="sm" variant="muted" className="capitalize">
                    {currentOrg.role}
                  </Text>
                  {currentOrg.status && (
                    <span className={cn("text-xs font-medium", getStatusColor(currentOrg.status))}>
                      • {currentOrg.status}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <ChevronDown className={cn(
            "w-4 h-4 text-muted-foreground transition-transform",
            isOpen && "rotate-180"
          )} />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border border-border rounded-md shadow-lg max-h-80 overflow-y-auto">
          <div className="py-1">
            {/* Organization List */}
            {organizations.map((org) => (
              <button
                key={org.id}
                onClick={() => handleOrganizationSelect(org.id)}
                className={cn(
                  "w-full px-3 py-3 text-left hover:bg-accent transition-colors flex items-center space-x-3",
                  org.id === currentOrgId && "bg-accent/50"
                )}
              >
                {/* Check Mark */}
                <div className="flex-shrink-0 w-4 h-4">
                  {org.id === currentOrgId && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </div>

                {/* Organization Logo */}
                <div className="flex-shrink-0">
                  {org.logo ? (
                    <img
                      src={org.logo}
                      alt={`${org.name} logo`}
                      className="w-8 h-8 rounded object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-primary" />
                    </div>
                  )}
                </div>

                {/* Organization Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <Text weight="medium" className="truncate">
                      {truncateName(org.name)}
                    </Text>
                    {showBadges && org.plan && (
                      <Badge variant={getPlanBadgeVariant(org.plan)} className="text-xs">
                        {org.plan}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center space-x-2">
                      <Text size="sm" variant="muted" className="capitalize">
                        {org.role}
                      </Text>
                      {org.status && (
                        <span className={cn("text-xs font-medium", getStatusColor(org.status))}>
                          • {org.status}
                        </span>
                      )}
                    </div>
                    
                    {showMetrics && (org.propertyCount || org.unitCount) && (
                      <Text size="xs" variant="muted">
                        {org.propertyCount && `${org.propertyCount} properties`}
                        {org.propertyCount && org.unitCount && ' • '}
                        {org.unitCount && `${org.unitCount} units`}
                      </Text>
                    )}
                  </div>
                </div>

                {/* Settings Button */}
                {onManageOrganization && (org.role === 'owner' || org.role === 'admin') && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onManageOrganization(org.id)
                    }}
                    className="flex-shrink-0 p-1 rounded hover:bg-accent-foreground/10 transition-colors"
                    title="Manage organization"
                  >
                    <Settings className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
              </button>
            ))}

            {/* Divider */}
            {organizations.length > 0 && onCreateOrganization && (
              <div className="border-t border-border my-1" />
            )}

            {/* Create Organization */}
            {onCreateOrganization && (
              <button
                onClick={() => {
                  onCreateOrganization()
                  setIsOpen(false)
                }}
                className="w-full px-3 py-3 text-left hover:bg-accent transition-colors flex items-center space-x-3 text-muted-foreground"
              >
                <Plus className="w-4 h-4" />
                <Text size="sm">Create Organization</Text>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export { OrganizationSwitcher }