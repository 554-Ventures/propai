// Centralized UI component exports
// This file provides a single import source for all UI components

// ============================================================================
// ATOMS - Basic building blocks
// ============================================================================
export * from './atoms/badge'
export * from './atoms/input' 
export * from './atoms/label'
export * from './atoms/text'
export * from './atoms/skeleton'

// ============================================================================
// MOLECULES - Composed components combining multiple atoms
// ============================================================================
export * from './molecules/page-header'
export * from './molecules/data-card'
export * from './molecules/status-badge'  
export * from './molecules/form-field'
export * from './molecules/filter-bar'
export * from './molecules/contact-info'
export * from './molecules/amount-display'
export * from './molecules/notification-banner'
export * from './molecules/skeleton-card'

// ============================================================================
// ORGANISMS - Complex composed components
// ============================================================================
export * from './organisms'

// ============================================================================
// TEMPLATES - Page-level composition patterns
// ============================================================================
export * from '../templates'

// ============================================================================
// EXISTING COMPONENTS - Maintain backward compatibility  
// ============================================================================
export * from './button'

// ============================================================================
// FUTURE EXPORTS - Placeholder for upcoming phases
// ============================================================================
// Phase 2: Organisms
// export * from './organisms/data-table'
// export * from './organisms/property-form' 
// export * from './organisms/tenant-dashboard'

// Phase 3: Templates
// export * from './templates/property-detail'
// export * from './templates/dashboard-layout'

// ============================================================================
// CONVENIENCE RE-EXPORTS - Common component combinations
// ============================================================================

// Common form field patterns
export { FormInput as Input } from './molecules/form-field'
export { FormSelect as Select } from './molecules/form-field' 
export { FormTextarea as Textarea } from './molecules/form-field'

// Status badge shortcuts for domain-specific usage
export {
  LeaseStatusBadge,
  PropertyStatusBadge, 
  PaymentStatusBadge,
  PriorityBadge,
} from './molecules/status-badge'

// Page header action helpers
export { PageHeaderAction } from './molecules/page-header'

// Data card helpers
export { DataCardAction } from './molecules/data-card'

// Skeleton patterns for common loading states
export { SkeletonText, SkeletonCard, SkeletonTable } from './atoms/skeleton'