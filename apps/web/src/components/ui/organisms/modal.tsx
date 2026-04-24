"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "../button"
import { Text } from "../atoms/text"

const modalVariants = cva(
  "relative z-50 bg-background border border-border shadow-2xl", 
  {
    variants: {
      size: {
        sm: "max-w-md",
        md: "max-w-lg",
        lg: "max-w-2xl", 
        xl: "max-w-4xl",
        full: "max-w-[95vw] max-h-[95vh]"
      },
      variant: {
        default: "rounded-lg",
        sheet: "rounded-t-lg h-auto max-h-[85vh] sm:rounded-lg",
        fullscreen: "rounded-none w-full h-full max-w-none max-h-none"
      }
    },
    defaultVariants: {
      size: "md",
      variant: "default"
    }
  }
)

const backdropVariants = cva(
  "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-all duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
)

const panelVariants = cva(
  "fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] transition-all duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]"
) 

export interface ModalProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof modalVariants> {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  preventClose?: boolean
  closeOnBackdropClick?: boolean
  className?: string
  "aria-labelledby"?: string
  "aria-describedby"?: string
}

function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  preventClose = false,
  closeOnBackdropClick = true,
  size,
  variant,
  className,
  "aria-labelledby": ariaLabelledby,
  "aria-describedby": ariaDescribedby,
  ...props
}: ModalProps) {
  const titleId = React.useId()
  const descriptionId = React.useId()

  // Handle escape key
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isOpen && event.key === "Escape" && !preventClose) {
        event.preventDefault()
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown)
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = ""
    }
  }, [isOpen, onClose, preventClose])

  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget && closeOnBackdropClick && !preventClose) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className={backdropVariants()}
        onClick={handleBackdropClick}
        data-testid="modal-backdrop"
      />
      
      {/* Modal Panel */}
      <div 
        className={cn(panelVariants(), modalVariants({ size, variant }), className)}
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabelledby || titleId}
        aria-describedby={ariaDescribedby || (description ? descriptionId : undefined)}
        {...props}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-border">
          <div className="space-y-1.5">
            <Text 
              id={titleId}
              variant="primary"
              weight="semibold"
              size="lg"
              className="leading-none tracking-tight"
            >
              {title}
            </Text>
            {description && (
              <Text
                id={descriptionId}
                variant="muted"
                size="sm"
                className="leading-relaxed"
              >
                {description}
              </Text>
            )}
          </div>
          
          {!preventClose && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
              className="opacity-70 hover:opacity-100 focus:opacity-100"
              aria-label="Close modal"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto max-h-[calc(85vh-8rem)]">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-between p-6 border-t border-border bg-muted/50">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export { Modal }