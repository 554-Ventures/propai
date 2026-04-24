"use client"

import * as React from "react"

// Bundle analysis types
export interface BundleAnalytics {
  chunkName: string
  size: number
  gzipSize?: number
  loadTime: number
  cacheHit: boolean
  imports: string[]
  exports: string[]
  dependencies: string[]
  loadedAt: Date
  isAsync: boolean
  priority: 'critical' | 'high' | 'medium' | 'low'
}

export interface TreeShakingReport {
  totalSize: number
  unusedExports: string[]
  sideEffects: string[]
  optimizationPotential: number
  recommendations: string[]
}

// Tree-shaking optimization utilities
export class BundleOptimizer {
  private static instance: BundleOptimizer
  private bundleCache = new Map<string, BundleAnalytics>()
  private unusedExports = new Set<string>()
  private loadedModules = new Map<string, number>()

  static getInstance(): BundleOptimizer {
    if (!BundleOptimizer.instance) {
      BundleOptimizer.instance = new BundleOptimizer()
    }
    return BundleOptimizer.instance
  }

  // Track component usage for tree-shaking analysis
  trackComponentUsage(componentName: string, modulePath: string) {
    if (process.env.NODE_ENV !== 'development') return
    
    const count = this.loadedModules.get(componentName) || 0
    this.loadedModules.set(componentName, count + 1)
    
    // Track timing
    if (typeof performance !== 'undefined') {
      performance.mark(`component-loaded-${componentName}`)
    }
  }

  // Identify unused exports
  analyzeUnusedExports(exportMap: Record<string, boolean>): string[] {
    const unused: string[] = []
    
    Object.entries(exportMap).forEach(([exportName, isUsed]) => {
      if (!isUsed) {
        unused.push(exportName)
        this.unusedExports.add(exportName)
      }
    })
    
    return unused
  }

  // Generate tree-shaking report
  generateTreeShakingReport(): TreeShakingReport {
    const unusedExports = Array.from(this.unusedExports)
    const totalSize = Array.from(this.bundleCache.values())
      .reduce((sum, bundle) => sum + bundle.size, 0)
    
    const optimizationPotential = unusedExports.length / this.loadedModules.size * 100
    
    const recommendations = []
    if (unusedExports.length > 0) {
      recommendations.push(`Remove ${unusedExports.length} unused exports`)
    }
    if (optimizationPotential > 20) {
      recommendations.push('Consider code splitting for better performance')
    }
    
    return {
      totalSize,
      unusedExports,
      sideEffects: [], // Would be populated by bundler analysis
      optimizationPotential,
      recommendations
    }
  }

  // Bundle size monitoring
  recordBundleLoad(bundleInfo: Partial<BundleAnalytics>) {
    if (bundleInfo.chunkName) {
      const existing = this.bundleCache.get(bundleInfo.chunkName)
      this.bundleCache.set(bundleInfo.chunkName, {
        ...existing,
        ...bundleInfo,
        loadedAt: new Date(),
      } as BundleAnalytics)
    }
  }

  // Get performance metrics
  getPerformanceMetrics() {
    const bundles = Array.from(this.bundleCache.values())
    
    return {
      totalBundles: bundles.length,
      totalSize: bundles.reduce((sum, b) => sum + b.size, 0),
      avgLoadTime: bundles.reduce((sum, b) => sum + b.loadTime, 0) / bundles.length,
      cacheHitRate: bundles.filter(b => b.cacheHit).length / bundles.length * 100,
      asyncBundles: bundles.filter(b => b.isAsync).length,
      criticalBundles: bundles.filter(b => b.priority === 'critical').length
    }
  }

  // Clear performance data
  clearMetrics() {
    this.bundleCache.clear()
    this.unusedExports.clear()
    this.loadedModules.clear()
  }
}

// HOC for tracking component usage
export function withUsageTracking<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string,
  modulePath?: string
) {
  const TrackedComponent = React.forwardRef<any, P>((props, ref) => {
    React.useEffect(() => {
      const optimizer = BundleOptimizer.getInstance()
      optimizer.trackComponentUsage(componentName, modulePath || 'unknown')
    }, [])

    return <Component {...(props as any)} {...(ref ? { ref } : {})} />
  })

  TrackedComponent.displayName = `withUsageTracking(${Component.displayName || Component.name})`
  
  return TrackedComponent
}

// Hook for bundle performance monitoring
export function useBundlePerformance(chunkName?: string) {
  const [metrics, setMetrics] = React.useState<ReturnType<BundleOptimizer['getPerformanceMetrics']> | null>(null)
  const optimizer = BundleOptimizer.getInstance()

  React.useEffect(() => {
    // Record load start
    const loadStart = performance.now()
    
    return () => {
      // Record load completion
      const loadTime = performance.now() - loadStart
      
      if (chunkName) {
        optimizer.recordBundleLoad({
          chunkName,
          loadTime,
          loadedAt: new Date(),
          cacheHit: false, // Would be determined by bundler
          isAsync: true
        })
      }
      
      setMetrics(optimizer.getPerformanceMetrics())
    }
  }, [chunkName, optimizer])

  return {
    metrics,
    optimizer,
    clearMetrics: () => {
      optimizer.clearMetrics()
      setMetrics(null)
    }
  }
}

// Selective import helper for tree-shaking
export function createSelectiveImporter<T extends Record<string, any>>(
  moduleImporter: () => Promise<T>,
  selectors: (keyof T)[]
) {
  return async (): Promise<Partial<T>> => {
    const fullModule = await moduleImporter()
    const selectedExports: Partial<T> = {}
    
    selectors.forEach(selector => {
      if (selector in fullModule) {
        selectedExports[selector] = fullModule[selector]
      }
    })
    
    // Track which exports were actually used
    const optimizer = BundleOptimizer.getInstance()
    const allExports = Object.keys(fullModule)
    const usedExports = Object.keys(selectedExports)
    const unusedExports = allExports.filter(exp => !usedExports.includes(exp))
    
    const exportMap: Record<string, boolean> = {}
    allExports.forEach(exp => {
      exportMap[exp] = usedExports.includes(exp)
    })
    
    optimizer.analyzeUnusedExports(exportMap)
    
    return selectedExports
  }
}

// Bundle loading priority manager
export class LoadingPriorityManager {
  private priorityQueue: Array<{
    loader: () => Promise<any>
    priority: number
    chunkName: string
  }> = []

  private isLoading = false

  addToQueue(
    loader: () => Promise<any>, 
    priority: number, 
    chunkName: string
  ) {
    this.priorityQueue.push({ loader, priority, chunkName })
    this.priorityQueue.sort((a, b) => b.priority - a.priority)
    
    if (!this.isLoading) {
      this.processQueue()
    }
  }

  private async processQueue() {
    if (this.priorityQueue.length === 0) {
      this.isLoading = false
      return
    }

    this.isLoading = true
    const next = this.priorityQueue.shift()
    
    if (next) {
      try {
        const startTime = performance.now()
        await next.loader()
        const loadTime = performance.now() - startTime
        
        BundleOptimizer.getInstance().recordBundleLoad({
          chunkName: next.chunkName,
          loadTime,
          priority: this.getPriorityLabel(next.priority),
          isAsync: true
        })
      } catch (error) {
        console.error(`Failed to load chunk ${next.chunkName}:`, error)
      }
    }
    
    // Continue processing queue
    await new Promise(resolve => setTimeout(resolve, 10)) // Brief pause
    this.processQueue()
  }

  private getPriorityLabel(priority: number): 'critical' | 'high' | 'medium' | 'low' {
    if (priority >= 90) return 'critical'
    if (priority >= 70) return 'high'
    if (priority >= 50) return 'medium'
    return 'low'
  }

  clear() {
    this.priorityQueue = []
    this.isLoading = false
  }
}

// Hook for managing loading priorities
export function useLoadingPriority() {
  const [manager] = React.useState(() => new LoadingPriorityManager())
  
  const loadWithPriority = React.useCallback((
    loader: () => Promise<any>,
    priority: number,
    chunkName: string
  ) => {
    manager.addToQueue(loader, priority, chunkName)
  }, [manager])

  React.useEffect(() => {
    return () => {
      manager.clear()
    }
  }, [manager])

  return { loadWithPriority }
}

// Development-only bundle analyzer component
export function BundleAnalyzer() {
  const [report, setReport] = React.useState<TreeShakingReport | null>(null)
  const { metrics } = useBundlePerformance()

  React.useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return

    const optimizer = BundleOptimizer.getInstance()
    const interval = setInterval(() => {
      setReport(optimizer.generateTreeShakingReport())
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed top-4 right-4 p-4 bg-card border rounded-lg shadow-lg max-w-sm z-50">
      <div className="text-xs space-y-3">
        <h4 className="font-semibold">Bundle Analysis</h4>
        
        {metrics && (
          <div className="space-y-1">
            <div>Total Size: {(metrics.totalSize / 1024).toFixed(1)}KB</div>
            <div>Bundles: {metrics.totalBundles}</div>
            <div>Cache Hit: {metrics.cacheHitRate.toFixed(1)}%</div>
            <div>Avg Load: {metrics.avgLoadTime.toFixed(0)}ms</div>
          </div>
        )}
        
        {report && (
          <div className="space-y-1 border-t pt-2">
            <div>Unused Exports: {report.unusedExports.length}</div>
            <div>Optimization: {report.optimizationPotential.toFixed(1)}%</div>
            {report.recommendations.length > 0 && (
              <div className="text-yellow-600 text-xs">
                {report.recommendations[0]}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Utility for measuring component render performance
export function withRenderPerformance<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) {
  const PerformantComponent = React.forwardRef<any, P>((props, ref) => {
    const renderCount = React.useRef(0)
    const lastRenderTime = React.useRef(0)

    React.useEffect(() => {
      renderCount.current++
      
      if (process.env.NODE_ENV === 'development') {
        const renderTime = performance.now() - lastRenderTime.current
        if (renderTime > 16) { // More than one frame
          console.warn(`Slow render detected: ${componentName} took ${renderTime.toFixed(2)}ms`)
        }
      }
    })

    // Measure render start
    React.useLayoutEffect(() => {
      lastRenderTime.current = performance.now()
    })

    return <Component {...(props as any)} {...(ref ? { ref } : {})} />
  })

  PerformantComponent.displayName = `withRenderPerformance(${Component.displayName || Component.name})`
  
  return PerformantComponent
}

// Export singleton instance
export const bundleOptimizer = BundleOptimizer.getInstance()