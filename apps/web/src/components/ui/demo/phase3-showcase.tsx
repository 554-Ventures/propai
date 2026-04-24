"use client"

import * as React from "react"
import { useState } from "react"

// Import all new Phase 3 components
import {
  Modal,
  FormModal,
  DataTable,
  FilterBar,
  ContactInfo,
  AmountDisplay,
  NotificationBanner,
  PageHeader,
  Button,
  Text,
  StatusBadge,
  Input,
  FormField,
  Label,
  type TableColumn,
  type FilterConfig
} from "@/components/ui"

// Sample data for testing
interface User {
  id: string
  name: string
  email: string
  phone: string
  status: "active" | "inactive" | "pending"
  rent: number
  property: string
  joinedDate: string
}

const sampleUsers: User[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    phone: "555-123-4567",
    status: "active",
    rent: 1500,
    property: "Sunset Apartments",
    joinedDate: "2024-01-15"
  },
  {
    id: "2", 
    name: "Jane Smith",
    email: "jane@example.com",
    phone: "555-987-6543",
    status: "pending",
    rent: 1800,
    property: "Oak Ridge Complex",
    joinedDate: "2024-02-20"
  },
  {
    id: "3",
    name: "Bob Johnson",
    email: "bob@example.com", 
    phone: "555-456-7890",
    status: "inactive",
    rent: 1200,
    property: "Pine Valley",
    joinedDate: "2023-12-10"
  }
]

export function Phase3ComponentDemo() {
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  
  // Table states
  const [tableData] = useState(sampleUsers)
  const [loading] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  
  // Form states
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Table columns definition
  const columns: TableColumn<User>[] = [
    {
      key: "name",
      title: "Name", 
      render: (user) => <Text weight="semibold">{user.name}</Text>,
      sortable: true
    },
    {
      key: "contact",
      title: "Contact",
      render: (user) => (
        <ContactInfo
          email={user.email}
          phone={user.phone}
          layout="stacked"
          variant="compact"
          showLabels={false}
        />
      )
    },
    {
      key: "status",
      title: "Status", 
      render: (user) => <StatusBadge status={user.status.toUpperCase() as "ACTIVE" | "INACTIVE" | "PENDING"} />,
      align: "center"
    },
    {
      key: "rent",
      title: "Monthly Rent",
      render: (user) => (
        <AmountDisplay 
          amount={user.rent}
          type="income"
          variant="highlighted"
        />
      ),
      align: "right",
      sortable: true
    },
    {
      key: "property",
      title: "Property",
      render: (user) => <Text variant="muted">{user.property}</Text>
    }
  ]

  // Filter configuration
  const filters: FilterConfig[] = [
    {
      key: "status",
      label: "Status",
      type: "select",
      value: statusFilter,
      onChange: (value: unknown) => setStatusFilter(value as string),
      options: [
        { label: "All Statuses", value: "" },
        { label: "Active", value: "active" },
        { label: "Pending", value: "pending" },
        { label: "Inactive", value: "inactive" }
      ]
    }
  ]

  // Filter the data based on search and filters
  const filteredData = React.useMemo(() => {
    return tableData.filter(user => {
      const matchesSearch = searchValue === "" || 
        user.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        user.email.toLowerCase().includes(searchValue.toLowerCase())
      
      const matchesStatus = statusFilter === "" || user.status === statusFilter
      
      return matchesSearch && matchesStatus
    })
  }, [tableData, searchValue, statusFilter])

  // Form submission handler
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    console.log("Form submitted:", formData)
    setIsSubmitting(false)
    setIsFormModalOpen(false)
    
    // Reset form
    setFormData({ name: "", email: "", phone: "" })
  }

  const validateForm = () => {
    return formData.name.trim() !== "" && 
           formData.email.trim() !== "" && 
           formData.phone.trim() !== ""
  }

  const handleRowClick = (user: User) => {
    console.log("Row clicked:", user)
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Phase 3 Component Showcase"
        description="Demonstrating all new organisms and advanced molecules"
        action={
          <div className="flex gap-2">
            <Button
              variant="outline" 
              onClick={() => setIsModalOpen(true)}
            >
              Open Modal
            </Button>
            <Button 
              onClick={() => setIsFormModalOpen(true)}
            >
              Open Form Modal
            </Button>
          </div>
        }
      />

      {/* Notification Banners */}
      <div className="space-y-4">
        <Text variant="primary" weight="semibold" size="md">Notification Banners</Text>
        <div className="grid gap-4">
          <NotificationBanner
            variant="success"
            title="Phase 3 Implementation Complete!"
            description="All organisms and molecules have been successfully implemented."
            dismissible
          />
          
          <NotificationBanner
            variant="info"
            title="PropAI UI Transformation"
            description="Your component library is now industry-leading with enterprise-grade patterns."
            actions={
              <Button variant="ghost" size="sm">
                Learn More
              </Button>
            }
          />
        </div>
      </div>

      {/* Amount Display Examples */}
      <div className="space-y-4">
        <Text variant="primary" weight="semibold" size="md">Amount Display Patterns</Text>
        <div className="flex flex-wrap gap-4">
          <AmountDisplay amount={1500} type="income" showIcon variant="highlighted" />
          <AmountDisplay amount={-800} type="expense" showIcon variant="highlighted" />
          <AmountDisplay amount={2450.75} type="profit" showSign showIcon size="lg" />
          <AmountDisplay amount={-150} variant="badge" />
          <AmountDisplay amount={1250000} abbreviate showIcon variant="highlighted" />
        </div>
      </div>

      {/* Contact Info Examples */} 
      <div className="space-y-4">
        <Text variant="primary" weight="semibold" size="md">Contact Information Patterns</Text>
        <div className="grid md:grid-cols-3 gap-4">
          <ContactInfo
            name="John Doe"
            email="john@example.com" 
            phone="555-123-4567"
            variant="card"
            showLabels
          />
          
          <ContactInfo
            email="jane@example.com"
            phone="555-987-6543"
            emergencyContact="Emergency: Mike Smith"
            emergencyPhone="555-111-2222" 
            layout="stacked"
            showLabels
          />
          
          <ContactInfo
            email="quick@example.com"
            phone="555-999-8888"
            layout="inline"
            variant="compact"
          />
        </div>
      </div>

      {/* Data Table with Filter Bar */}
      <div className="space-y-4">
        <Text variant="primary" weight="semibold" size="md">Advanced Data Table</Text>
        
        <FilterBar
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          searchPlaceholder="Search tenants..."
          filters={filters}
          totalCount={tableData.length}
          filteredCount={filteredData.length}
          actions={
            <Button variant="outline" size="sm">
              Export CSV
            </Button>
          }
        />

        <DataTable
          data={filteredData}
          columns={columns}
          loading={loading}
          onRowClick={handleRowClick}
          pagination={{
            currentPage: 1,
            pageSize: 10,
            totalItems: filteredData.length,
            onPageChange: (page) => console.log("Page changed:", page)
          }}
          sorting={{
            onSort: (key, direction) => console.log("Sort:", key, direction)
          }}
        />
      </div>

      {/* Basic Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Enterprise Modal"
        description="This modal demonstrates our sophisticated overlay patterns with proper focus management and accessibility."
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={() => setIsModalOpen(false)}>
              Understood
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Text>
            This modal showcases our enterprise-grade overlay patterns with:
          </Text>
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
            <li>Backdrop blur and sophisticated styling</li>
            <li>Focus management and keyboard navigation</li>
            <li>Escape key handling</li>
            <li>Accessible ARIA patterns</li>
            <li>Responsive sizing options</li>
          </ul>
        </div>
      </Modal>

      {/* Form Modal */}
      <FormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title="Add New Tenant"
        description="Enter tenant information to add them to your property management system."
        size="md"
        onSubmit={handleFormSubmit}
        submitLabel="Add Tenant"
        isSubmitting={isSubmitting}
        validateForm={validateForm}
      >
        <div className="space-y-4">
          <FormField>
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              placeholder="Enter full name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: (e.target as HTMLInputElement).value }))}
              required
            />
          </FormField>

          <FormField>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter email address"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: (e.target as HTMLInputElement).value }))}
              required
            />
          </FormField>

          <FormField>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="Enter phone number"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: (e.target as HTMLInputElement).value }))}
              required
            />
          </FormField>
        </div>
      </FormModal>
    </div>
  )
}