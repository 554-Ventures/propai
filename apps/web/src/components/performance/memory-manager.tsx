"use client"

import * as React from "react"
import { Text } from "../ui/atoms/text"

// Memory management types
export interface MemoryStats {
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
  memoryPressure: 'low' | 'medium' | 'high' | 'critical'
  componentCount: number
  listenerCount: number
  intervalCount: number
  observerCount: number
}

export interface ResourceCleanupTracker {
  id: string
  type: 'interval' | 'timeout' | 'listener' | 'observer' | 'subscription'
  cleanup: () => void
  createdAt: Date
  component?: string
}

// Memory management class
export class MemoryManager {
  private static instance: MemoryManager
  private cleanupTrackers = new Map<string, ResourceCleanupTracker>()
  private componentInstances = new Map<string, number>()
  private memoryWarningThreshold = 50 * 1024 * 1024 // 50MB
  private criticalThreshold = 100 * 1024 * 1024 // 100MB

  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager()
    }
    return MemoryManager.instance
  }

  // Track component instances
  trackComponent(componentName: string, mount: boolean = true) {
    const current = this.componentInstances.get(componentName) || 0
    const newCount = mount ? current + 1 : Math.max(0, current - 1)
    this.componentInstances.set(componentName, newCount)
  }

  // Register cleanup function
  registerCleanup(
    id: string, 
    type: ResourceCleanupTracker['type'],
    cleanup: () => void,
    component?: string
  ) {
    this.cleanupTrackers.set(id, {
      id,
      type,
      cleanup,
      createdAt: new Date(),
      component
    })
  }

  // Execute and remove cleanup
  executeCleanup(id: string) {
    const tracker = this.cleanupTrackers.get(id)
    if (tracker) {
      try {
        tracker.cleanup()
      } catch (error) {
        console.warn(`Cleanup failed for ${id}:`, error)
      }
      this.cleanupTrackers.delete(id)
    }
  }

  // Force cleanup all resources for a component
  cleanupComponent(componentName: string) {
    const toCleanup = Array.from(this.cleanupTrackers.values())
      .filter(tracker => tracker.component === componentName)
    
    toCleanup.forEach(tracker => {
      this.executeCleanup(tracker.id)
    })
    
    this.componentInstances.delete(componentName)
  }

  // Get current memory stats
  getMemoryStats(): MemoryStats {
    let memoryInfo = { usedJSHeapSize: 0, totalJSHeapSize: 0, jsHeapSizeLimit: 0 }
    
    if ('memory' in performance) {
      memoryInfo = (performance as any).memory
    }

    const memoryPressure = this.calculateMemoryPressure(memoryInfo.usedJSHeapSize)
    
    return {
      ...memoryInfo,
      memoryPressure,
      componentCount: Array.from(this.componentInstances.values()).reduce((sum, count) => sum + count, 0),
      listenerCount: Array.from(this.cleanupTrackers.values()).filter(t => t.type === 'listener').length,
      intervalCount: Array.from(this.cleanupTrackers.values()).filter(t => t.type === 'interval').length,
      observerCount: Array.from(this.cleanupTrackers.values()).filter(t => t.type === 'observer').length
    }
  }

  // Calculate memory pressure level
  private calculateMemoryPressure(usedMemory: number): MemoryStats['memoryPressure'] {
    if (usedMemory > this.criticalThreshold) return 'critical'
    if (usedMemory > this.memoryWarningThreshold) return 'high'
    if (usedMemory > this.memoryWarningThreshold * 0.7) return 'medium'
    return 'low'
  }

  // Force garbage collection (if available)
  forceGarbageCollection() {
    if ('gc' in window && typeof window.gc === 'function') {
      window.gc()
      return true
    }
    return false
  }

  // Memory leak detection
  detectPotentialLeaks(): Array<{ component: string; suspiciousResources: number }> {
    const suspiciousComponents: Array<{ component: string; suspiciousResources: number }> = []
    const componentResources = new Map<string, number>()

    // Count resources per component
    this.cleanupTrackers.forEach(tracker => {
      if (tracker.component) {
        const current = componentResources.get(tracker.component) || 0
        componentResources.set(tracker.component, current + 1)
      }
    })

    // Flag components with excessive resources
    componentResources.forEach((count, component) => {
      if (count > 10) { // Threshold for suspicious resource count
        suspiciousComponents.push({ component, suspiciousResources: count })
      }
    })

    return suspiciousComponents
  }

  // Clear all resources (emergency cleanup)
  emergencyCleanup() {
    const allCleanups = Array.from(this.cleanupTrackers.keys())
    allCleanups.forEach(id => this.executeCleanup(id))
    this.componentInstances.clear()
    this.forceGarbageCollection()
  }
}

// Hook for memory-aware component lifecycle
export function useMemoryManagement(componentName: string) {
  const manager = React.useMemo(() => MemoryManager.getInstance(), [])
  const componentId = React.useRef(`${componentName}_${Date.now()}_${Math.random()}`)

  // Track component mount/unmount
  React.useEffect(() => {
    manager.trackComponent(componentName, true)
    
    return () => {
      manager.trackComponent(componentName, false)
      manager.cleanupComponent(componentName)
    }
  }, [manager, componentName])

  // Helper to register interval with cleanup
  const setManagedInterval = React.useCallback((callback: () => void, delay: number) => {
    const intervalId = setInterval(callback, delay)
    const cleanupId = `interval_${componentId.current}_${intervalId}`
    
    manager.registerCleanup(
      cleanupId,
      'interval', 
      () => clearInterval(intervalId),
      componentName
    )
    
    return intervalId
  }, [manager, componentName])

  // Helper to register timeout with cleanup
  const setManagedTimeout = React.useCallback((callback: () => void, delay: number) => {
    const timeoutId = setTimeout(callback, delay)
    const cleanupId = `timeout_${componentId.current}_${timeoutId}`
    
    manager.registerCleanup(
      cleanupId,
      'timeout',
      () => clearTimeout(timeoutId),
      componentName
    )
    
    return timeoutId
  }, [manager, componentName])

  // Helper to register event listener with cleanup
  const addManagedEventListener = React.useCallback((
    element: EventTarget, 
    event: string, 
    handler: EventListener,
    options?: AddEventListenerOptions
  ) => {
    element.addEventListener(event, handler, options)
    const cleanupId = `listener_${componentId.current}_${event}_${Date.now()}`
    
    manager.registerCleanup(
      cleanupId,
      'listener',
      () => element.removeEventListener(event, handler, options),
      componentName
    )
    
    return cleanupId
  }, [manager, componentName])

  // Helper to register observer with cleanup
  const createManagedObserver = React.useCallback(<T extends { disconnect(): void }>(observer: T) => {
    const cleanupId = `observer_${componentId.current}_${Date.now()}`
    
    manager.registerCleanup(
      cleanupId,
      'observer',
      () => observer.disconnect(),
      componentName
    )
    
    return observer
  }, [manager, componentName])

  return {
    setManagedInterval,
    setManagedTimeout,
    addManagedEventListener,
    createManagedObserver,
    forceCleanup: () => manager.cleanupComponent(componentName)
  }
}

// Hook for monitoring memory usage
export function useMemoryMonitoring(options: {
  interval?: number
  warningThreshold?: number
  onMemoryWarning?: (stats: MemoryStats) => void
} = {}) {
  const {
    interval = 5000,
    warningThreshold = 50 * 1024 * 1024,
    onMemoryWarning
  } = options

  const [memoryStats, setMemoryStats] = React.useState<MemoryStats | null>(null)
  const manager = MemoryManager.getInstance()

  React.useEffect(() => {
    if (typeof window === 'undefined') return

    const checkMemory = () => {
      const stats = manager.getMemoryStats()
      setMemoryStats(stats)
      
      if (stats.usedJSHeapSize > warningThreshold) {
        onMemoryWarning?.(stats)
      }
    }

    // Initial check
    checkMemory()

    // Regular monitoring
    const intervalId = setInterval(checkMemory, interval)
    
    return () => clearInterval(intervalId)
  }, [interval, warningThreshold, manager, onMemoryWarning])

  return {
    memoryStats,
    forceGarbageCollection: () => manager.forceGarbageCollection(),
    detectLeaks: () => manager.detectPotentialLeaks(),
    emergencyCleanup: () => manager.emergencyCleanup()
  }
}

// HOC for automatic memory management
export function withMemoryManagement<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) {
  const ManagedComponent = React.forwardRef<any, P>((props, ref) => {
    useMemoryManagement(componentName)
    return <Component {...(props as any)} {...(ref ? { ref } : {})} />
  })

  ManagedComponent.displayName = `withMemoryManagement(${Component.displayName || Component.name})`
  
  return ManagedComponent
}

// Memory pressure indicator component
export function MemoryPressureIndicator() {
  const { memoryStats } = useMemoryMonitoring({
    interval: 2000,
    onMemoryWarning: (stats) => {
      console.warn('Memory pressure detected:', stats)
    }
  })

  if (!memoryStats || process.env.NODE_ENV !== 'development') {
    return null
  }

  const getColor = (pressure: MemoryStats['memoryPressure']) => {
    switch (pressure) {
      case 'critical': return 'text-red-600 bg-red-50'
      case 'high': return 'text-orange-600 bg-orange-50'
      case 'medium': return 'text-yellow-600 bg-yellow-50'
      case 'low': return 'text-green-600 bg-green-50'
    }
  }

  return (
    <div className="fixed bottom-4 left-4 p-3 border rounded-lg shadow-lg bg-card z-50">
      <div className="text-xs space-y-2">
        <Text weight="semibold" size="xs">Memory Status</Text>
        
        <div className={`px-2 py-1 rounded text-xs ${getColor(memoryStats.memoryPressure)}`}>
          {memoryStats.memoryPressure.toUpperCase()} pressure
        </div>
        
        <div className="space-y-1 font-mono">
          <div>Used: {(memoryStats.usedJSHeapSize / 1024 / 1024).toFixed(1)}MB</div>
          <div>Components: {memoryStats.componentCount}</div>
          <div>Listeners: {memoryStats.listenerCount}</div>
          <div>Intervals: {memoryStats.intervalCount}</div>
        </div>
        
        {memoryStats.memoryPressure !== 'low' && (
          <button
            onClick={() => MemoryManager.getInstance().forceGarbageCollection()}
            className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded"
          >
            Force GC
          </button>
        )}
      </div>
    </div>
  )
}

// Hook for large list virtualization memory management
export function useVirtualizedMemoryManagement(
  items: any[],
  options: {
    visibleRange?: [number, number]
    bufferSize?: number
    onMemoryPressure?: () => void
  } = {}
) {
  const { visibleRange = [0, 50], bufferSize = 10, onMemoryPressure } = options
  const [visibleItems, setVisibleItems] = React.useState(items.slice(0, 50))
  const { memoryStats } = useMemoryMonitoring()

  React.useEffect(() => {
    // Only keep visible items plus buffer in memory
    const [start, end] = visibleRange
    const startIndex = Math.max(0, start - bufferSize)
    const endIndex = Math.min(items.length, end + bufferSize)
    
    const newVisibleItems = items.slice(startIndex, endIndex)
    setVisibleItems(newVisibleItems)
    
    // Trigger cleanup on memory pressure
    if (memoryStats?.memoryPressure === 'high' || memoryStats?.memoryPressure === 'critical') {
      onMemoryPressure?.()
    }
  }, [items, visibleRange, bufferSize, memoryStats?.memoryPressure, onMemoryPressure])

  return {
    visibleItems,
    memoryPressure: memoryStats?.memoryPressure || 'low',
    totalItems: items.length
  }
}

// Development tools
export function MemoryLeakDetector() {
  const [leaks, setLeaks] = React.useState<Array<{ component: string; suspiciousResources: number }>>([])
  
  React.useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return

    const interval = setInterval(() => {
      const manager = MemoryManager.getInstance()
      const detectedLeaks = manager.detectPotentialLeaks()
      setLeaks(detectedLeaks)
    }, 10000) // Check every 10 seconds

    return () => clearInterval(interval)
  }, [])

  if (process.env.NODE_ENV !== 'development' || leaks.length === 0) {
    return null
  }

  return (
    <div className="fixed top-4 left-4 p-3 border rounded-lg shadow-lg bg-card text-xs z-50 max-w-sm">
      <Text weight="semibold" size="xs" className="text-red-600 mb-2">
        Potential Memory Leaks Detected
      </Text>
      <div className="space-y-1">
        {leaks.map(leak => (
          <div key={leak.component} className="text-red-600">
            {leak.component}: {leak.suspiciousResources} resources
          </div>
        ))}
      </div>
    </div>
  )
}

// Export singleton instance
export const memoryManager = MemoryManager.getInstance()