"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { 
  Building2, 
  Bell,
  Search,
  Menu,
  LogOut,
  User
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Text } from "../ui/atoms/text"
import { Button } from "../ui/button"
import { Badge } from "../ui/atoms/badge"
// import { Separator } from "../ui"
import { OrganizationSwitcher, type Organization } from "./organization-switcher"
import { PermissionProvider } from "./permission-boundary"
import { type RoleContext } from "./role-based-display"

// Tenant branding configuration
export interface TenantBranding {
  organizationId: string
  primaryColor: string
  secondaryColor: string
  logo?: string
  logoUrl?: string
  favicon?: string
  customCss?: string
  theme?: 'light' | 'dark' | 'auto'
  companyName: string
  domain?: string
}

// Navigation item for tenant-specific menus
export interface NavItem {
  id: string
  label: string
  href: string
  icon?: React.ComponentType<{ className?: string }>
  badge?: string
  badgeVariant?: 'default' | 'secondary' | 'error' | 'outline' | 'success' | 'warning'
  requiredRole?: string
  requiredPermissions?: string[]
  children?: NavItem[]
  isActive?: boolean
  isCollapsed?: boolean
}

// Tenant configuration
export interface TenantConfig {
  organizationId: string
  branding: TenantBranding
  features: string[] // Feature flags per tenant
  limits: {
    maxProperties?: number
    maxUsers?: number
    maxStorageGB?: number
    maxApiCalls?: number
  }
  customFields?: Record<string, unknown>
  integrations?: string[] // Enabled integrations
  billing: {
    plan: 'free' | 'pro' | 'enterprise'
    status: 'active' | 'trial' | 'suspended' | 'delinquent'
    trialEndsAt?: Date
    billingEmail?: string
  }
}

const multiTenantLayoutVariants = cva(
  "min-h-screen bg-background",
  {
    variants: {
      layout: {
        sidebar: "lg:grid lg:grid-cols-[240px_1fr]",
        collapsed: "lg:grid lg:grid-cols-[64px_1fr]",
        fullwidth: "w-full",
        centered: "container mx-auto",
      },
      branded: {
        default: "",
        custom: "custom-tenant-theme", // Applied via CSS custom properties
      },
    },
    defaultVariants: {
      layout: "sidebar",
      branded: "default",
    },
  }
)

export interface MultiTenantLayoutProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof multiTenantLayoutVariants> {
  // Tenant configuration
  tenantConfig: TenantConfig
  currentTenant: Organization
  availableOrganizations: Organization[]
  
  // User context
  roleContext: RoleContext
  
  // Navigation
  navigation: NavItem[]
  
  // Layout options
  sidebarCollapsed?: boolean
  onSidebarToggle?: () => void
  
  // Organization switching
  onOrganizationChange: (orgId: string) => void
  onCreateOrganization?: () => void
  onManageOrganization?: (orgId: string) => void
  
  // Header actions
  onSearch?: (query: string) => void
  onNotificationClick?: () => void
  onProfileClick?: () => void
  onLogout?: () => void
  
  // Content
  children: React.ReactNode
  
  // Customization
  headerContent?: React.ReactNode
  sidebarFooterContent?: React.ReactNode
  
  // Loading states
  navigationLoading?: boolean
  tenantLoading?: boolean
}

function MultiTenantLayout({
  className,
  layout,
  branded,
  tenantConfig,
  currentTenant,
  availableOrganizations,
  roleContext,
  navigation,
  sidebarCollapsed = false,
  onSidebarToggle,
  onOrganizationChange,
  onCreateOrganization,
  onManageOrganization,
  onSearch,
  onNotificationClick,
  onProfileClick,
  onLogout,
  children,
  headerContent,
  sidebarFooterContent,
  navigationLoading = false,
  tenantLoading = false,
  ...props
}: MultiTenantLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

  // Apply tenant branding
  React.useEffect(() => {
    if (branded === 'custom' && tenantConfig.branding) {
      const root = document.documentElement
      root.style.setProperty('--primary', tenantConfig.branding.primaryColor)
      root.style.setProperty('--secondary', tenantConfig.branding.secondaryColor)
      
      // Update favicon if provided
      if (tenantConfig.branding.favicon) {
        const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement
        if (link) {
          link.href = tenantConfig.branding.favicon
        }
      }
      
      // Inject custom CSS if provided
      if (tenantConfig.branding.customCss) {
        const style = document.createElement('style')
        style.textContent = tenantConfig.branding.customCss
        document.head.appendChild(style)
        
        return () => {
          document.head.removeChild(style)
        }
      }
    }
  }, [branded, tenantConfig.branding])

  // Permission context value
  const permissionContextValue = React.useMemo(() => ({
    roleContext,
    organizationBoundary: tenantConfig.organizationId,
    globalBoundaryRules: {
      // Add any global boundary rules based on tenant config
      billingActive: tenantConfig.billing.status === 'active',
      trialActive: tenantConfig.billing.status === 'trial',
    }
  }), [roleContext, tenantConfig])

  // Filter navigation based on permissions
  const filteredNavigation = React.useMemo(() => {
    const filterNavItems = (items: NavItem[]): NavItem[] => {
      return items.filter(item => {
        // Check if tenant has access to this feature
        if (item.id && tenantConfig.features && !tenantConfig.features.includes(item.id)) {
          return false
        }
        
        // Check role requirements
        if (item.requiredRole && roleContext.currentRole !== item.requiredRole) {
          return false
        }
        
        // Additional permission checks would go here
        return true
      }).map(item => ({
        ...item,
        children: item.children ? filterNavItems(item.children) : undefined
      }))
    }
    
    return filterNavItems(navigation)
  }, [navigation, tenantConfig.features, roleContext.currentRole])

  const renderLogo = () => {
    const logo = tenantConfig.branding.logo || tenantConfig.branding.logoUrl
    const name = tenantConfig.branding.companyName || currentTenant.name

    return (
      <div className="flex items-center space-x-3">
        {logo ? (
          <img
            src={logo}
            alt={`${name} logo`}
            className="h-8 w-auto"
          />
        ) : (
          <Building2 className="h-8 w-8 text-primary" />
        )}
        {!sidebarCollapsed && (
          <Text weight="semibold" className="text-lg">
            {name}
          </Text>
        )}
      </div>
    )
  }

  const renderNavItem = (item: NavItem, level = 0) => {
    const Icon = item.icon
    const isActive = item.isActive || false
    const hasChildren = item.children && item.children.length > 0

    return (
      <div key={item.id}>
        <button
          onClick={() => {
            // Handle navigation
            if (item.href && !hasChildren) {
              // Navigate to href
            }
          }}
          className={cn(
            "w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors",
            "hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring",
            isActive && "bg-accent text-accent-foreground",
            level > 0 && "ml-4 text-sm",
            sidebarCollapsed && "justify-center px-2"
          )}
        >
          {Icon && (
            <Icon className={cn(
              "flex-shrink-0",
              sidebarCollapsed ? "h-5 w-5" : "h-4 w-4"
            )} />
          )}
          {!sidebarCollapsed && (
            <>
              <span className="flex-1 truncate">{item.label}</span>
              {item.badge && (
                <Badge variant={item.badgeVariant || 'secondary'} className="text-xs">
                  {item.badge}
                </Badge>
              )}
            </>
          )}
        </button>
        
        {hasChildren && !sidebarCollapsed && !item.isCollapsed && (
          <div className="mt-1 space-y-1">
            {item.children!.map(child => renderNavItem(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  const renderBillingStatus = () => {
    if (sidebarCollapsed) return null
    
    const { billing } = tenantConfig
    
    if (billing.status === 'trial' && billing.trialEndsAt) {
      const daysLeft = Math.ceil((billing.trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      return (
        <div className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <Text size="xs" weight="medium" className="text-blue-700 dark:text-blue-300">
            Trial: {daysLeft} days left
          </Text>
        </div>
      )
    }
    
    if (billing.status === 'delinquent') {
      return (
        <div className="px-3 py-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <Text size="xs" weight="medium" className="text-yellow-700 dark:text-yellow-300">
            Payment Required
          </Text>
        </div>
      )
    }
    
    return null
  }

  return (
    <PermissionProvider value={permissionContextValue}>
      <div 
        className={cn(
          multiTenantLayoutVariants({ 
            layout: sidebarCollapsed ? 'collapsed' : layout, 
            branded 
          }), 
          className
        )} 
        {...props}
      >
        {/* Sidebar */}
        <aside className={cn(
          "border-r border-border bg-card",
          "hidden lg:flex lg:flex-col",
          sidebarCollapsed && "items-center"
        )}>
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="p-4">
              {renderLogo()}
            </div>

            {/* Organization Switcher */}
            <div className="px-4 pb-4">
              <OrganizationSwitcher
                organizations={availableOrganizations}
                currentOrgId={currentTenant.id}
                onOrganizationChange={onOrganizationChange}
                onCreateOrganization={onCreateOrganization}
                onManageOrganization={onManageOrganization}
                size={sidebarCollapsed ? "sm" : "md"}
                variant="ghost"
                showBadges={!sidebarCollapsed}
                showMetrics={!sidebarCollapsed}
              />
            </div>

            {/* <Separator /> */}

            {/* Navigation */}
            <div className="flex-1 p-4 space-y-1 overflow-y-auto">
              {navigationLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-10 bg-muted/50 rounded animate-pulse" />
                  ))}
                </div>
              ) : (
                filteredNavigation.map(item => renderNavItem(item))
              )}
            </div>

            {/* Sidebar Footer */}
            <div className="p-4 space-y-3">
              {renderBillingStatus()}
              
              {sidebarFooterContent}
              
              {!sidebarCollapsed && (
                <Text size="xs" variant="muted" className="text-center">
                  {currentTenant.name} • {roleContext.currentRole}
                </Text>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex flex-col min-h-screen lg:min-h-0">
          {/* Header */}
          <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center justify-between h-14 px-4 lg:px-6">
              <div className="flex items-center space-x-4">
                {/* Mobile menu button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="lg:hidden"
                >
                  <Menu className="h-4 w-4" />
                </Button>

                {/* Desktop sidebar toggle */}
                {onSidebarToggle && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onSidebarToggle}
                    className="hidden lg:flex"
                  >
                    <Menu className="h-4 w-4" />
                  </Button>
                )}

                {/* Custom header content */}
                {headerContent}
              </div>

              {/* Header Actions */}
              <div className="flex items-center space-x-2">
                {onSearch && (
                  <Button variant="ghost" size="sm" onClick={() => onSearch('')}>
                    <Search className="h-4 w-4" />
                  </Button>
                )}

                {onNotificationClick && (
                  <Button variant="ghost" size="sm" onClick={onNotificationClick}>
                    <Bell className="h-4 w-4" />
                  </Button>
                )}

                <div className="flex items-center space-x-2 border-l pl-2">
                  {onProfileClick && (
                    <Button variant="ghost" size="sm" onClick={onProfileClick}>
                      <User className="h-4 w-4" />
                    </Button>
                  )}

                  {onLogout && (
                    <Button variant="ghost" size="sm" onClick={onLogout}>
                      <LogOut className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 overflow-auto">
            {tenantLoading ? (
              <div className="flex items-center justify-center h-96">
                <div className="text-center space-y-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                  <Text variant="muted">Loading tenant data...</Text>
                </div>
              </div>
            ) : (
              children
            )}
          </main>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="fixed inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
            <div className="fixed top-0 left-0 w-80 h-full bg-card border-r border-border">
              {/* Mobile navigation content would go here */}
              <div className="p-4">
                <Text weight="semibold">Mobile Menu</Text>
                {/* Add mobile navigation items */}
              </div>
            </div>
          </div>
        )}
      </div>
    </PermissionProvider>
  )
}

// Tenant configuration hook
function useTenantConfig(organizationId: string): TenantConfig | null {
  const [config, setConfig] = React.useState<TenantConfig | null>(null)

  React.useEffect(() => {
    // In a real app, fetch tenant configuration from API
    // This would include branding, features, limits, etc.
    
    // Mock implementation
    const mockConfig: TenantConfig = {
      organizationId,
      branding: {
        organizationId,
        primaryColor: '#3b82f6',
        secondaryColor: '#64748b',
        companyName: 'Property Management Co',
        theme: 'auto'
      },
      features: ['property_management', 'tenant_portal', 'maintenance', 'financial_reports'],
      limits: {
        maxProperties: 100,
        maxUsers: 25,
        maxStorageGB: 50,
        maxApiCalls: 10000
      },
      billing: {
        plan: 'pro',
        status: 'active'
      }
    }
    
    setConfig(mockConfig)
  }, [organizationId])

  return config
}

export {
  MultiTenantLayout,
  useTenantConfig,
}