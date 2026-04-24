"use client"

import * as React from "react"
import { Skeleton } from "../ui/atoms/skeleton"
import { Text } from "../ui/atoms/text"
import { Button } from "../ui/button"
import { AlertCircle, RefreshCw } from "lucide-react"

// Types for lazy loading
interface LazyComponentProps {
  loading?: React.ComponentType<any>
  error?: React.ComponentType<{ error: Error; retry: () => void }>
  fallback?: React.ComponentType<any>
  delay?: number
  timeout?: number
}

interface LazyLoadOptions extends LazyComponentProps {
  chunkName?: string
  preload?: boolean
  critical?: boolean
}

// Enhanced lazy loading utility with error boundaries and retries
export function createLazyComponent<T extends React.ComponentType<any>>(
  importFunction: () => Promise<{ default: T } | T>,
  options: LazyLoadOptions = {}
) {
  const {
    loading: LoadingComponent,
    error: ErrorComponent,
    fallback: FallbackComponent,
    delay = 200,
    timeout = 10000,
    preload = false,
    critical = false
  } = options

  const LazyComponent = React.lazy(() => {
    let importPromise = importFunction().then(module => {
      // Handle both default and named exports
      if (module && typeof module === 'object' && 'default' in module) {
        return module as { default: T }
      } else {
        // If it's not a default export, wrap it in default
        return { default: module as T }
      }
    })

    // Add timeout handling
    if (timeout > 0) {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Component load timeout')), timeout)
      )
      importPromise = Promise.race([importPromise, timeoutPromise])
    }

    return importPromise
  })

  // Preload functionality
  if (preload && typeof window !== 'undefined') {
    // Preload on idle or after a delay
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => importFunction())
    } else {
      setTimeout(() => importFunction(), 1000)
    }
  }

  // Wrapper component with enhanced error boundary
  const LazyWrapper = React.forwardRef<any, any>((props, ref) => {
    const [hasError, setHasError] = React.useState(false)
    const [isTimedOut, setIsTimedOut] = React.useState(false)
    const [retryCount, setRetryCount] = React.useState(0)

    const handleRetry = () => {
      setHasError(false)
      setIsTimedOut(false)
      setRetryCount(prev => prev + 1)
    }

    // Default loading component
    const DefaultLoading = React.useMemo(() => {
      return function DefaultLoadingComponent() {
        return (
          <div className="w-full h-32 p-4 flex items-center justify-center">
            <div className="text-center space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
              <Text size="sm" variant="muted">Loading component...</Text>
            </div>
          </div>
        )
      }
    }, [])

    // Default error component
    const DefaultError = React.useMemo(() => {
      return function DefaultErrorComponent({ error, retry }: { error: Error; retry: () => void }) {
        return (
          <div className="w-full h-32 p-4 flex items-center justify-center">
            <div className="text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-destructive mx-auto" />
              <div>
                <Text size="sm" weight="medium" className="text-destructive">
                  Failed to load component
                </Text>
                <Text size="xs" variant="muted">
                  {error.message}
                </Text>
              </div>
              <Button variant="outline" size="sm" onClick={retry}>
                <RefreshCw className="w-4 h-4 mr-1" />
                Retry
              </Button>
            </div>
          </div>
        )
      }
    }, [])

    // Error boundary effect
    React.useEffect(() => {
      const handleError = (event: ErrorEvent) => {
        if (event.message.includes('Loading chunk') || 
            event.message.includes('Loading CSS chunk')) {
          setHasError(true)
        }
      }

      const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
        if (event.reason?.message?.includes('timeout')) {
          setIsTimedOut(true)
        }
      }

      window.addEventListener('error', handleError)
      window.addEventListener('unhandledrejection', handleUnhandledRejection)
      
      return () => {
        window.removeEventListener('error', handleError)
        window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      }
    }, [])

    // If there's an error, show error component
    if (hasError || isTimedOut) {
      const ErrorComp = ErrorComponent || DefaultError
      const errorMessage = isTimedOut ? 'Component load timeout' : 'Component load failed'
      return (
        <ErrorComp 
          error={new Error(errorMessage)} 
          retry={handleRetry}
        />
      )
    }

    return (
      <React.Suspense 
        fallback={
          LoadingComponent ? <LoadingComponent /> : 
          FallbackComponent ? <FallbackComponent /> :
          <DefaultLoading />
        }
        key={retryCount} // Force re-mount on retry
      >
        <LazyComponent {...(props as any)} {...(ref ? { ref } : {})} />
      </React.Suspense>
    )
  })

  LazyWrapper.displayName = `LazyWrapper(Component)`

  return LazyWrapper
}

// Hook for preloading components
export function usePreloadComponents(
  preloadFunctions: Array<() => Promise<any>>,
  options: {
    delay?: number
    onIdle?: boolean
    priority?: 'high' | 'low'
  } = {}
) {
  const { delay = 0, onIdle = true, priority = 'low' } = options
  const [preloaded, setPreloaded] = React.useState(false)

  React.useEffect(() => {
    if (preloaded) return

    const preload = async () => {
      try {
        if (priority === 'high') {
          // Preload immediately for high priority
          await Promise.all(preloadFunctions.map(fn => fn()))
        } else {
          // Preload with delay for low priority
          for (const fn of preloadFunctions) {
            await fn()
            // Small delay between preloads to avoid blocking
            await new Promise(resolve => setTimeout(resolve, 50))
          }
        }
        setPreloaded(true)
      } catch (error) {
        console.warn('Component preload failed:', error)
      }
    }

    if (onIdle && 'requestIdleCallback' in window) {
      requestIdleCallback(() => {
        if (delay > 0) {
          setTimeout(preload, delay)
        } else {
          preload()
        }
      })
    } else {
      setTimeout(preload, delay)
    }
  }, [preloadFunctions, delay, onIdle, priority, preloaded])

  return { preloaded }
}

// Component for progressive enhancement
interface ProgressiveEnhancementProps {
  baseline: React.ComponentType<any>
  enhanced?: React.ComponentType<any>
  condition?: () => boolean
  loading?: React.ComponentType<any>
  children?: React.ReactNode
  [key: string]: any
}

export function ProgressiveEnhancement({
  baseline: BaselineComponent,
  enhanced: EnhancedComponent,
  condition = () => true,
  loading: LoadingComponent,
  children,
  ...props
}: ProgressiveEnhancementProps) {
  const [shouldEnhance, setShouldEnhance] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)

  React.useEffect(() => {
    const checkCondition = async () => {
      try {
        setIsLoading(true)
        const result = await Promise.resolve(condition())
        setShouldEnhance(result)
      } catch (error) {
        console.warn('Enhancement condition check failed:', error)
        setShouldEnhance(false)
      } finally {
        setIsLoading(false)
      }
    }

    // Check conditions on mount and when they might change
    checkCondition()
  }, [condition])

  if (isLoading && LoadingComponent) {
    return <LoadingComponent {...props}>{children}</LoadingComponent>
  }

  if (shouldEnhance && EnhancedComponent) {
    return <EnhancedComponent {...props}>{children}</EnhancedComponent>
  }

  return <BaselineComponent {...props}>{children}</BaselineComponent>
}

// Bundle loading utilities
export const BundleLoader = {
  // Preload specific chunks
  preloadChunk: async (chunkName: string) => {
    try {
      // This would be implemented based on your bundler
      // For webpack: __webpack_preload__(chunkName)
      // For vite: import(/* webpackChunkName: "chunk-name" */ './path')
      console.log(`Preloading chunk: ${chunkName}`)
    } catch (error) {
      console.warn(`Failed to preload chunk ${chunkName}:`, error)
    }
  },

  // Check if chunk is loaded
  isChunkLoaded: (chunkName: string): boolean => {
    // Implementation depends on bundler
    return false
  },

  // Get loading stats
  getLoadingStats: () => {
    return {
      totalChunks: 0,
      loadedChunks: 0,
      failedChunks: 0,
    }
  }
}

// Performance monitoring for lazy loading
export function useLazyLoadingStats() {
  const [stats, setStats] = React.useState({
    totalLoads: 0,
    successfulLoads: 0,
    failedLoads: 0,
    avgLoadTime: 0,
    loadTimes: [] as number[]
  })

  const recordLoad = React.useCallback((success: boolean, loadTime: number) => {
    setStats(prev => {
      const newLoadTimes = [...prev.loadTimes.slice(-19), loadTime] // Keep last 20
      const newTotalLoads = prev.totalLoads + 1
      const newSuccessfulLoads = success ? prev.successfulLoads + 1 : prev.successfulLoads
      const newFailedLoads = success ? prev.failedLoads : prev.failedLoads + 1
      const newAvgLoadTime = newLoadTimes.reduce((sum, time) => sum + time, 0) / newLoadTimes.length

      return {
        totalLoads: newTotalLoads,
        successfulLoads: newSuccessfulLoads,
        failedLoads: newFailedLoads,
        avgLoadTime: newAvgLoadTime,
        loadTimes: newLoadTimes
      }
    })
  }, [])

  return { stats, recordLoad }
}

// Debug component for lazy loading
export function LazyLoadingDebugger() {
  const { stats } = useLazyLoadingStats()

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 p-3 bg-card border rounded-lg shadow-lg text-xs z-50">
      <Text weight="semibold" size="xs" className="mb-2">
        Lazy Loading Stats
      </Text>
      <div className="space-y-1 font-mono">
        <div>Total: {stats.totalLoads}</div>
        <div className="text-green-600">Success: {stats.successfulLoads}</div>
        <div className="text-red-600">Failed: {stats.failedLoads}</div>
        <div>Avg Time: {stats.avgLoadTime.toFixed(0)}ms</div>
      </div>
    </div>
  )
}