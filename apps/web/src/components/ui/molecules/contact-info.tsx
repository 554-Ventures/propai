"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Mail, Phone, User, ExternalLink } from "lucide-react"

import { cn } from "@/lib/utils"
import { Text } from "../atoms/text"

const contactInfoVariants = cva(
  "space-y-2",
  {
    variants: {
      layout: {
        inline: "flex items-center gap-4 space-y-0",
        stacked: "space-y-2",
        grid: "grid grid-cols-2 gap-4 space-y-0"
      },
      variant: {
        default: "",
        card: "p-4 border border-border rounded-lg bg-background",
        compact: "space-y-1"
      }
    },
    defaultVariants: {
      layout: "stacked",
      variant: "default"
    }
  }
)

const contactItemVariants = cva(
  "flex items-center gap-2 text-sm",
  {
    variants: {
      clickable: {
        true: "cursor-pointer hover:text-primary transition-colors",
        false: ""
      }
    }
  }
)

export interface ContactInfoProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof contactInfoVariants> {
  email?: string
  phone?: string
  emergencyContact?: string
  emergencyPhone?: string
  name?: string
  showLabels?: boolean
  showIcons?: boolean
  enableActions?: boolean
  onEmailClick?: (email: string) => void
  onPhoneClick?: (phone: string) => void
  className?: string
}

function ContactInfo({
  email,
  phone,
  emergencyContact,
  emergencyPhone,
  name,
  showLabels = false,
  showIcons = true,
  enableActions = true,
  onEmailClick,
  onPhoneClick,
  layout,
  variant,
  className,
  ...props
}: ContactInfoProps) {
  const handleEmailClick = React.useCallback((emailAddress: string) => {
    if (onEmailClick) {
      onEmailClick(emailAddress)
    } else if (enableActions) {
      window.open(`mailto:${emailAddress}`, '_blank')
    }
  }, [onEmailClick, enableActions])

  const handlePhoneClick = React.useCallback((phoneNumber: string) => {
    if (onPhoneClick) {
      onPhoneClick(phoneNumber)
    } else if (enableActions) {
      window.open(`tel:${phoneNumber}`, '_blank')
    }
  }, [onPhoneClick, enableActions])

  const formatPhoneNumber = (phoneNumber: string) => {
    // Basic phone number formatting
    const cleaned = phoneNumber.replace(/\D/g, '')
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
    }
    return phoneNumber
  }

  const renderContactItem = React.useCallback((
    icon: React.ReactNode,
    label: string,
    value: string,
    onClick?: () => void,
    showExternal = false
  ) => (
    <div 
      className={cn(
        contactItemVariants({ clickable: !!onClick }),
        onClick && "group"
      )}
      onClick={onClick}
    >
      {showIcons && (
        <span className="text-muted-foreground group-hover:text-primary transition-colors">
          {icon}
        </span>
      )}
      
      <div className="flex-1 min-w-0">
        {showLabels && (
          <Text variant="muted" size="xs" className="block">
            {label}
          </Text>
        )}
        <Text 
          size="sm"
          className={cn(
            "block truncate",
            onClick && "group-hover:text-primary"
          )}
        >
          {value}
        </Text>
      </div>
      
      {onClick && showExternal && (
        <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </div>
  ), [showLabels, showIcons])

  const contactItems = React.useMemo(() => {
    const items = []

    if (name) {
      items.push(
        renderContactItem(
          <User className="h-4 w-4" />,
          "Name",
          name
        )
      )
    }

    if (email) {
      items.push(
        renderContactItem(
          <Mail className="h-4 w-4" />,
          "Email",
          email,
          enableActions ? () => handleEmailClick(email) : undefined,
          enableActions
        )
      )
    }

    if (phone) {
      items.push(
        renderContactItem(
          <Phone className="h-4 w-4" />,
          "Phone",
          formatPhoneNumber(phone),
          enableActions ? () => handlePhoneClick(phone) : undefined,
          enableActions
        )
      )
    }

    if (emergencyContact) {
      items.push(
        renderContactItem(
          <User className="h-4 w-4" />,
          "Emergency Contact",
          emergencyContact
        )
      )
    }

    if (emergencyPhone) {
      items.push(
        renderContactItem(
          <Phone className="h-4 w-4" />,
          "Emergency Phone",
          formatPhoneNumber(emergencyPhone),
          enableActions ? () => handlePhoneClick(emergencyPhone) : undefined,
          enableActions
        )
      )
    }

    return items
  }, [name, email, phone, emergencyContact, emergencyPhone, enableActions, handleEmailClick, handlePhoneClick, renderContactItem])

  if (contactItems.length === 0) {
    return (
      <div className={cn(contactInfoVariants({ layout, variant }), className)} {...props}>
        <Text variant="muted" size="sm">
          No contact information available
        </Text>
      </div>
    )
  }

  return (
    <div 
      className={cn(contactInfoVariants({ layout, variant }), className)} 
      {...props}
    >
      {contactItems}
    </div>
  )
}

// Quick action components for common patterns
export function ContactInfoCard({ className, ...props }: ContactInfoProps) {
  return (
    <ContactInfo
      variant="card"
      showLabels={true}
      className={className}
      {...props}
    />
  )
}

export function ContactInfoInline({ className, ...props }: ContactInfoProps) {
  return (
    <ContactInfo
      layout="inline"
      variant="compact"
      showLabels={false}
      className={className}
      {...props}
    />
  )
}

export { ContactInfo }