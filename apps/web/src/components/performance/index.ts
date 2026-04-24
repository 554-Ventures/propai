// Performance Optimization Utilities for React Components

// Lazy Loading & Code Splitting
export {
  createLazyComponent,
  usePreloadComponents,
  ProgressiveEnhancement,
  BundleLoader,
  useLazyLoadingStats,
  LazyLoadingDebugger
} from "./lazy-component-loader"

// Bundle Optimization & Tree Shaking
export {
  BundleOptimizer,
  withUsageTracking,
  useBundlePerformance,
  createSelectiveImporter,
  LoadingPriorityManager,
  useLoadingPriority,
  BundleAnalyzer,
  withRenderPerformance,
  bundleOptimizer,
  type BundleAnalytics,
  type TreeShakingReport
} from "./bundle-optimizer"

// Memory Management & Leak Prevention
export {
  MemoryManager,
  useMemoryManagement,
  useMemoryMonitoring,
  withMemoryManagement,
  MemoryPressureIndicator,
  useVirtualizedMemoryManagement,
  MemoryLeakDetector,
  memoryManager,
  type MemoryStats,
  type ResourceCleanupTracker
} from "./memory-manager"