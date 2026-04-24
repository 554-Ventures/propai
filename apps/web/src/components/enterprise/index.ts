// Enterprise Multi-Tenant Components for PropTech
export { 
  OrganizationSwitcher,
  type OrganizationSwitcherProps,
  type Organization
} from "./organization-switcher"

export { 
  RoleBasedDisplay,
  OwnerOnly,
  AdminOrHigher,
  ManagerOrHigher,
  FinancialAccess,
  MaintenanceAccess,
  TenantSensitiveAccess,
  useRoleContext,
  RoleUtils,
  ROLE_HIERARCHY,
  DEFAULT_ROLE_PERMISSIONS,
  type RoleBasedDisplayProps,
  type RoleContext,
  type Role,
  type Permission
} from "./role-based-display"

export {
  PermissionBoundary,
  PermissionProvider,
  usePermissionContext,
  withPermissionBoundary,
  PropertyManagementBoundary,
  FinancialDataBoundary,
  AdminSettingsBoundary,
  type PermissionBoundaryProps,
  type BoundaryViolation,
  type BoundaryError,
  type PermissionProviderProps
} from "./permission-boundary"

export {
  MultiTenantLayout,
  useTenantConfig,
  type MultiTenantLayoutProps,
  type TenantConfig,
  type TenantBranding,
  type NavItem
} from "./multi-tenant-layout"