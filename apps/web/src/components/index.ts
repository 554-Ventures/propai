// Main component index - Centralized exports for all application components
// This file provides a single import source for the entire component library

// ============================================================================
// UI COMPONENT LIBRARY - Atomic Design System
// ============================================================================
export * from './ui'

// ============================================================================
// TEMPLATES - Page-level composition patterns
// ============================================================================
export * from './templates'

// ============================================================================
// DOCUMENTATION SYSTEM - Interactive component showcase
// ============================================================================
export * from './docs'

// ============================================================================
// ENTERPRISE COMPONENTS - Multi-tenant PropTech patterns
// ============================================================================
export * from './enterprise'

// ============================================================================
// VISUALIZATION COMPONENTS - Advanced PropTech analytics & charts
// ============================================================================
export * from './visualization'

// ============================================================================
// PERFORMANCE OPTIMIZATION - Bundle optimization, lazy loading & memory mgmt
// ============================================================================
export * from './performance'

// ============================================================================
// APPLICATION COMPONENTS - Feature-specific components
// ============================================================================

// Authentication & Authorization
export { default as AuthForm } from './auth-form'
export { AuthProvider } from './auth-provider'

// Layout & Navigation
export { default as AppShell } from './app-shell'
export { ThemeToggle } from './theme-toggle'

// AI & Chat
export { default as ChatPane } from './chat-pane'
export { default as DashboardAIChat } from './dashboard-ai-chat'

// Modals & Dialogs
export { ArchiveConfirmModal } from './ArchiveConfirmModal'

// ============================================================================
// TYPE EXPORTS - For TypeScript consumers
// ============================================================================

// Re-export key types for convenience
export type { 
  Organization,
  RoleContext,
  Role,
  Permission,
  TenantConfig,
  TenantBranding,
  NavItem
} from './enterprise'

export type {
  CashflowData,
  CashflowMetrics,
  PropertyOccupancyData,
  UnitOccupancy,
  KPIMetric,
  PerformanceAlert,
  BenchmarkData
} from './visualization'

export type {
  BundleAnalytics,
  TreeShakingReport,
  MemoryStats,
  ResourceCleanupTracker
} from './performance'