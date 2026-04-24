"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { Button } from "../button"
import { Modal, type ModalProps } from "./modal"

const formFooterVariants = cva(
  "flex items-center gap-3",
  {
    variants: {
      align: {
        left: "justify-start",
        center: "justify-center", 
        right: "justify-end",
        between: "justify-between"
      }
    },
    defaultVariants: {
      align: "right"
    }
  }
)

export interface FormModalProps 
  extends Omit<ModalProps, "footer" | "children"> {
  children: React.ReactNode
  onSubmit: (e: React.FormEvent) => void | Promise<void>
  submitLabel?: string
  cancelLabel?: string 
  isSubmitting?: boolean
  submitDisabled?: boolean
  validateForm?: () => boolean
  showCancel?: boolean
  customFooter?: React.ReactNode
  preventClose?: boolean
  footerAlign?: VariantProps<typeof formFooterVariants>["align"]
}

function FormModal({
  children,
  onSubmit,
  submitLabel = "Save",
  cancelLabel = "Cancel",
  isSubmitting = false,
  submitDisabled = false,
  validateForm,
  showCancel = true,
  customFooter,
  preventClose = false,
  footerAlign = "right",
  onClose,
  ...modalProps
}: FormModalProps) {
  const [isFormValid, setIsFormValid] = React.useState(true)

  // Validate form on mount and when validateForm changes
  React.useEffect(() => {
    if (validateForm) {
      setIsFormValid(validateForm())
    }
  }, [validateForm])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Run validation if provided
    if (validateForm && !validateForm()) {
      setIsFormValid(false)
      return
    }
    
    try {
      await onSubmit(e)
    } catch (error) {
      console.error("Form submission error:", error)
      // Don't close modal on error - let parent handle error state
    }
  }

  const handleCancel = () => {
    if (!isSubmitting && !preventClose) {
      onClose()
    }
  }

  // Prevent closing modal while submitting
  const shouldPreventClose = preventClose || isSubmitting

  const defaultFooter = (
    <div className={formFooterVariants({ align: footerAlign })}>
      {footerAlign === "between" && (
        <div className="text-sm text-muted-foreground">
          {isSubmitting && "Saving..."}
        </div>
      )}
      
      <div className="flex items-center gap-3">
        {showCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            {cancelLabel}
          </Button>
        )}
        <Button
          type="submit"
          form="form-modal-form"
          disabled={submitDisabled || !isFormValid || isSubmitting}
          className="min-w-[80px]"
        >
          {isSubmitting ? "Saving..." : submitLabel}
        </Button>
      </div>
    </div>
  )

  return (
    <Modal
      {...modalProps}
      onClose={onClose}
      preventClose={shouldPreventClose}
      closeOnBackdropClick={!shouldPreventClose}
      footer={customFooter || defaultFooter}
    >
      <form 
        id="form-modal-form"
        onSubmit={handleSubmit} 
        className="space-y-6"
        noValidate
      >
        {children}
      </form>
    </Modal>
  )
}

export { FormModal }