"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Skeleton } from "../atoms/skeleton"

export interface SkeletonCardProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

// SkeletonCard for loading states
export function SkeletonCard({ className, ...props }: SkeletonCardProps) {
  return (
    <div className={cn("rounded-lg border border-border bg-card p-4 space-y-3", className)} {...props}>
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-6 w-1/2" />
      <div className="flex justify-between">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-3 w-8" />
      </div>
    </div>
  )
}