"use client"

import { ComponentCategory } from "./component-docs"
import { 
  Atom, 
  Layers, 
  Layout, 
  Palette, 
  Database
} from "lucide-react"

// Import all components for examples
import { Badge } from "../ui/atoms/badge"
import { Input } from "../ui/atoms/input"
import { Text } from "../ui/atoms/text"
import { Skeleton } from "../ui/atoms/skeleton"
import { StatusBadge } from "../ui/molecules/status-badge"
import { PageHeader } from "../ui/molecules/page-header"
import { DataCard } from "../ui/molecules/data-card"
import { FormField } from "../ui/molecules/form-field"
import { DataTable } from "../ui/organisms/data-table"
import { Button } from "../ui/button"

export const componentLibrary: ComponentCategory[] = [
  // ============================================================================
  // ATOMS - Basic building blocks
  // ============================================================================
  {
    id: 'atoms',
    name: 'Atoms',
    description: 'Basic building blocks - the smallest functional components',
    icon: Atom,
    components: [
      {
        name: 'Badge',
        description: 'Small status indicators and labels',
        code: `<Badge variant="default">Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Error</Badge>
<Badge variant="outline">Outline</Badge>`,
        component: (
          <div className="flex items-center gap-2">
            <Badge variant="default">Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="error">Error</Badge>
            <Badge variant="outline">Outline</Badge>
          </div>
        ),
        variants: [
          {
            name: 'Status Indicators',
            description: 'Used for showing status, categories, or labels',
            props: { variant: 'default' },
            component: (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge>Active</Badge>
                  <Badge variant="secondary">Draft</Badge>
                  <Badge variant="error">Overdue</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge>4 Units</Badge>
                  <Badge variant="outline">Single Family</Badge>
                  <Badge>Furnished</Badge>
                </div>
              </div>
            )
          }
        ]
      },
      {
        name: 'Input',
        description: 'Text input fields with consistent styling',
        code: `<Input placeholder="Enter text..." />
<Input type="email" placeholder="Email address" />
<Input type="password" placeholder="Password" />`,
        component: (
          <div className="space-y-3 w-64">
            <Input placeholder="Property name..." />
            <Input type="email" placeholder="Email address" />
            <Input type="number" placeholder="Monthly rent" />
          </div>
        ),
        variants: [
          {
            name: 'Form Fields',
            description: 'Different input types for forms',
            props: { type: 'text' },
            component: (
              <div className="space-y-3 w-64">
                <Input placeholder="Property name..." />
                <Input type="tel" placeholder="Phone number" />
                <Input type="date" />
                <Input disabled placeholder="Disabled input" />
              </div>
            )
          }
        ]
      },
      {
        name: 'Text',
        description: 'Typography component with semantic variants',
        code: `<Text size="lg" weight="semibold">Heading Text</Text>
<Text variant="muted">Muted description text</Text>
<Text size="sm">Small detail text</Text>`,
        component: (
          <div className="space-y-2">
            <Text size="lg" weight="semibold">Property Overview</Text>
            <Text variant="muted">Comprehensive details about your property</Text>
            <Text size="sm">Last updated 2 hours ago</Text>
          </div>
        ),
        variants: [
          {
            name: 'Typography Hierarchy',
            description: 'Different text sizes and weights for content hierarchy',
            props: { size: 'base' },
            component: (
              <div className="space-y-3">
                <Text size="2xl" weight="bold">Main Title</Text>
                <Text size="lg" weight="semibold">Section Heading</Text>
                <Text size="md">Body text content</Text>
                <Text size="sm" variant="muted">Caption or metadata</Text>
              </div>
            )
          }
        ]
      },
      {
        name: 'Skeleton',
        description: 'Loading placeholders that match content structure',
        code: `<Skeleton className="h-4 w-32" />
<Skeleton variant="card" className="h-24" />
<Skeleton variant="avatar" className="w-12 h-12" />`,
        component: (
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton variant="card" className="h-24 w-full" />
          </div>
        ),
        variants: [
          {
            name: 'Content Placeholders',
            description: 'Loading states for different content types',
            props: { variant: 'default' },
            component: (
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <Skeleton variant="avatar" className="w-12 h-12" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton variant="card" className="h-32 w-full" />
              </div>
            )
          }
        ]
      }
    ]
  },

  // ============================================================================
  // MOLECULES - Component combinations
  // ============================================================================
  {
    id: 'molecules',
    name: 'Molecules',
    description: 'Groups of atoms functioning together as a unit',
    icon: Layers,
    components: [
      {
        name: 'StatusBadge',
        description: 'Specialized badges for status indication with consistent colors',
        code: `<StatusBadge status="ACTIVE" />
<StatusBadge status="PENDING" />
<StatusBadge status="EXPIRED" />`,
        component: (
          <div className="flex items-center gap-3">
            <StatusBadge status="ACTIVE" />
            <StatusBadge status="PENDING" />
            <StatusBadge status="EXPIRED" />
          </div>
        ),
        variants: [
          {
            name: 'Property Status',
            description: 'Status indicators for properties and units',
            props: { status: 'ACTIVE' },
            component: (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Text size="sm">Unit Status:</Text>
                  <StatusBadge status="ACTIVE" />
                  <StatusBadge status="INACTIVE" />
                  <StatusBadge status="MAINTENANCE" />
                </div>
                <div className="flex items-center gap-3">
                  <Text size="sm">Lease Status:</Text>
                  <StatusBadge status="ACTIVE" />
                  <StatusBadge status="EXPIRED" />
                  <StatusBadge status="EXPIRED" />
                </div>
              </div>
            )
          }
        ]
      },
      {
        name: 'PageHeader',
        description: 'Consistent page headers with title, description, and actions',
        code: `<PageHeader
  title="Properties"
  description="Manage your property portfolio"
  action={<Button>Add Property</Button>}
/>`,
        component: (
          <PageHeader
            title="Properties"
            description="Manage your property portfolio"
            action={<Button size="sm">Add Property</Button>}
          />
        ),
        variants: [
          {
            name: 'With Breadcrumb',
            description: 'Page header with navigation breadcrumb',
            props: { title: 'Properties' },
            component: (
              <PageHeader
                title="Sunset Apartments"
                description="Property details and management"
                breadcrumb={
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Properties</span>
                    <span>›</span>
                    <span>Sunset Apartments</span>
                  </div>
                }
                action={<Button size="sm" variant="outline">Edit</Button>}
              />
            )
          }
        ]
      },
      {
        name: 'DataCard',
        description: 'Flexible cards for displaying data with optional metrics and actions',
        code: `<DataCard
  title="Monthly Revenue"
  value="$12,450" 
  status="success"
  trend={{ direction: 'up', label: '+8.2%', color: 'success' }}
/>`,
        component: (
          <div className="w-72">
            <DataCard
              title="Monthly Revenue"
              value="$12,450"
              status="success"
              trend={{ direction: 'up', label: '+8.2%', color: 'success' }}
            />
          </div>
        ),
        variants: [
          {
            name: 'Property Metrics',
            description: 'Cards displaying property and financial metrics',
            props: { title: 'Metric Card' },
            component: (
              <div className="grid grid-cols-2 gap-4 w-full">
                <DataCard
                  title="Occupancy Rate"
                  value="94.2%"
                  status="success"
                  size="sm"
                />
                <DataCard
                  title="Maintenance Costs"
                  value="$3,240"
                  status="warning"
                  trend={{ direction: 'up', label: '+12%', color: 'warning' }}
                  size="sm"
                />
              </div>
            )
          }
        ]
      },
      {
        name: 'FormField',
        description: 'Form field wrapper with label, description, and error handling',
        code: `<FormField
  label="Property Name"
  description="Enter a descriptive name for your property"
  required
>
  <Input placeholder="Sunset Apartments" />
</FormField>`,
        component: (
          <div className="w-80">
            <FormField
              label="Property Name"
              description="Enter a descriptive name for your property"
              required
            >
              <Input placeholder="Sunset Apartments" />
            </FormField>
          </div>
        ),
        variants: [
          {
            name: 'With Error',
            description: 'Form field showing validation error',
            props: { label: 'Field' },
            component: (
              <div className="w-80 space-y-4">
                <FormField
                  label="Monthly Rent"
                  description="Enter the monthly rent amount"
                  required
                  error="Please enter a valid amount"
                >
                  <Input placeholder="0" value="invalid" />
                </FormField>
              </div>
            )
          }
        ]
      }
    ]
  },

  // ============================================================================
  // ORGANISMS - Complex components
  // ============================================================================
  {
    id: 'organisms',
    name: 'Organisms',
    description: 'Complex components made of molecules and atoms',
    icon: Database,
    components: [
      {
        name: 'DataTable',
        description: 'Advanced table component with sorting, filtering, and pagination',
        code: `<DataTable
  data={tenants}
  columns={[
    { id: 'name', header: 'Name', accessorKey: 'name' },
    { id: 'unit', header: 'Unit', accessorKey: 'unit' },
    { id: 'rent', header: 'Rent', cell: (row) => formatCurrency(row.rent) }
  ]}
  pagination={{ currentPage: 1, totalPages: 5 }}
/>`,
        component: (
          <div className="w-full">
            <DataTable
              data={[
                { id: '1', name: 'John Doe', unit: '4B', rent: 2400, status: 'active' },
                { id: '2', name: 'Jane Smith', unit: '2A', rent: 2200, status: 'active' },
                { id: '3', name: 'Mike Johnson', unit: '1C', rent: 1800, status: 'pending' }
              ]}
              columns={[
                { key: 'name', title: 'Tenant', render: (row) => row.name },
                { key: 'unit', title: 'Unit', render: (row) => row.unit },
                { 
                  key: 'rent', 
                  title: 'Rent', 
                  render: (row: { id: string; name: string; unit: string; rent: number; status: string; }) => `$${row.rent.toLocaleString()}`
                },
                {
                  key: 'status',
                  title: 'Status',
                  render: (row: { id: string; name: string; unit: string; rent: number; status: string; }) => <StatusBadge status={(row.status.toUpperCase() === 'VACANT' ? 'INACTIVE' : row.status.toUpperCase()) as 'ACTIVE' | 'INACTIVE' | 'PENDING'} />
                }
              ]}
            />
          </div>
        ),
        variants: [
          {
            name: 'With Selection',
            description: 'Table with row selection for bulk actions',
            props: { selectable: true },
            component: (
              <div className="w-full">
                <Text size="sm" variant="muted" className="mb-4">
                  Table with selection capabilities and bulk actions
                </Text>
                <DataTable
                  data={[
                    { id: '1', property: 'Sunset Apartments', units: 12, occupancy: 94.2 },
                    { id: '2', property: 'Pine Grove', units: 8, occupancy: 87.5 },
                    { id: '3', property: 'Oak Street Condos', units: 6, occupancy: 100 }
                  ]}
                  columns={[
                    { key: 'property', title: 'Property', render: (row) => row.property },
                    { key: 'units', title: 'Units', render: (row) => row.units },
                    { 
                      key: 'occupancy', 
                      title: 'Occupancy', 
                      render: (row) => `${row.occupancy}%`
                    }
                  ]}
                  selection={{
                    selectedRows: [],
                    onSelectionChange: () => {},
                    getRowId: (row: unknown) => (row as { id: string }).id
                  }}
                />
              </div>
            )
          }
        ]
      },
      {
        name: 'Modal',
        description: 'Accessible modal dialogs with backdrop and focus management',
        code: `const [isOpen, setIsOpen] = useState(false)

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirm Action"
>
  <p>Are you sure you want to continue?</p>
  <div className="flex gap-2 mt-4">
    <Button onClick={() => setIsOpen(false)}>Cancel</Button>
    <Button variant="destructive">Confirm</Button>
  </div>
</Modal>`,
        component: (
          <div className="space-y-4">
            <Button
              onClick={() => {
                // Demo purposes - would normally manage state
                alert('Modal would open here')
              }}
            >
              Open Modal
            </Button>
            <Text size="sm" variant="muted">
              Click to open a modal dialog (demo alert for documentation)
            </Text>
          </div>
        ),
        variants: [
          {
            name: 'Confirmation Dialog',
            description: 'Modal for confirming destructive actions',
            props: { title: 'Confirm' },
            component: (
              <div className="space-y-4">
                <Text variant="muted">
                  Modals provide focused interactions and prevent background interaction
                </Text>
                <div className="border border-border rounded-lg p-4 bg-card">
                  <Text weight="semibold" className="mb-2">Modal Features:</Text>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Accessible focus management</li>
                    <li>• Keyboard navigation (ESC to close)</li>
                    <li>• Click-outside to dismiss</li>
                    <li>• Various sizes and layouts</li>
                  </ul>
                </div>
              </div>
            )
          }
        ]
      }
    ]
  },

  // ============================================================================
  // TEMPLATES - Page-level patterns
  // ============================================================================
  {
    id: 'templates',
    name: 'Templates',
    description: 'Complete page templates for rapid development',
    icon: Layout,
    components: [
      {
        name: 'DashboardTemplate',
        description: 'Dashboard layout with metrics cards and content sections',
        code: `<DashboardTemplate
  title="Property Dashboard"
  description="Overview of your property portfolio"
  metrics={[
    {
      id: 'properties',
      title: 'Total Properties',
      value: '24',
      trend: { direction: 'up', label: '+2 this month' }
    }
  ]}
  sections={[
    {
      id: 'recent',
      title: 'Recent Activity',
      content: <ActivityFeed />
    }
  ]}
/>`,
        component: (
          <div className="w-full border border-border rounded-lg overflow-hidden">
            <div className="p-4 bg-card">
              <Text weight="semibold">Dashboard Template Preview</Text>
              <div className="mt-4 grid grid-cols-3 gap-4">
                <div className="p-3 border border-border rounded bg-background">
                  <Text size="xs" variant="muted">TOTAL PROPERTIES</Text>
                  <Text size="lg" weight="semibold">24</Text>
                </div>
                <div className="p-3 border border-border rounded bg-background">
                  <Text size="xs" variant="muted">OCCUPANCY</Text>
                  <Text size="lg" weight="semibold">94%</Text>
                </div>
                <div className="p-3 border border-border rounded bg-background">
                  <Text size="xs" variant="muted">REVENUE</Text>
                  <Text size="lg" weight="semibold">$45K</Text>
                </div>
              </div>
            </div>
          </div>
        ),
        variants: [
          {
            name: 'Property Overview',
            description: 'Dashboard specifically designed for property management',
            props: { title: 'Dashboard' },
            component: (
              <div className="space-y-4">
                <Text variant="muted">
                  Dashboard templates provide instant page structure with:
                </Text>
                <div className="grid gap-3 text-sm text-muted-foreground">
                  <div>• 🎯 Pre-configured metric card layouts</div>
                  <div>• 📊 Responsive grid systems (3/4/5 columns)</div>
                  <div>• 🏗️ Flexible content sections</div>
                  <div>• ⚡ Built-in loading and error states</div>
                  <div>• 📱 Mobile-responsive design</div>
                </div>
              </div>
            )
          }
        ]
      },
      {
        name: 'ListTemplate',
        description: 'List/table pages with filtering, search, and bulk actions',
        code: `<ListTemplate
  title="Properties" 
  description="Manage your property portfolio"
  data={properties}
  displayMode="table"
  columns={[
    { id: 'name', header: 'Name', accessorKey: 'name' },
    { id: 'units', header: 'Units', accessorKey: 'units' },
    { id: 'occupancy', header: 'Occupancy', cell: (row) => row.occupancy + '%' }
  ]}
  filters={[
    { type: 'select', key: 'type', label: 'Property Type', options: typeOptions }
  ]}
  bulkActions={[
    { label: 'Export', onClick: handleExport }
  ]}
/>`,
        component: (
          <div className="w-full border border-border rounded-lg overflow-hidden">
            <div className="border-b border-border p-4 bg-card">
              <Text weight="semibold">Property List</Text>
              <Text size="sm" variant="muted">Manage your property portfolio</Text>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Input placeholder="Search properties..." className="flex-1" />
                <Button size="sm" variant="outline">Filter</Button>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <div className="font-medium">Sunset Apartments</div>
                  <Badge>12 units</Badge>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <div className="font-medium">Pine Grove</div>
                  <Badge variant="secondary">8 units</Badge>
                </div>
              </div>
            </div>
          </div>
        ),
        variants: [
          {
            name: 'Advanced Filtering',
            description: 'List template with comprehensive filtering options',
            props: { filters: [] },
            component: (
              <div className="space-y-4">
                <Text variant="muted">
                  List templates accelerate development with:
                </Text>
                <div className="grid gap-3 text-sm text-muted-foreground">
                  <div>• 🔍 Integrated search and filtering</div>
                  <div>• 🗂️ Table and card view modes</div>
                  <div>• ✅ Bulk selection and actions</div>
                  <div>• 📄 Pagination and sorting</div>
                  <div>• 🎭 Empty states and loading skeletons</div>
                  <div>• 📱 Responsive design patterns</div>
                </div>
              </div>
            )
          }
        ]
      },
      {
        name: 'FormTemplate',
        description: 'Form pages with sections, validation, and sidebar content',
        code: `<FormTemplate
  title="Add Property"
  sections={[
    {
      id: 'basic',
      title: 'Property Information',
      fields: [
        { id: 'name', name: 'name', label: 'Name', type: 'text', required: true },
        { id: 'address', name: 'address', label: 'Address', type: 'text' }
      ]
    }
  ]}
  values={formData}
  errors={formErrors}
  onSubmit={handleSubmit}
  sidebarContent={<PropertyPreview />}
/>`,
        component: (
          <div className="w-full border border-border rounded-lg overflow-hidden">
            <div className="border-b border-border p-4 bg-card">
              <Text weight="semibold">Add New Property</Text>
              <Text size="sm" variant="muted">Create a new property in your portfolio</Text>
            </div>
            <div className="p-4 space-y-4">
              <FormField label="Property Name" required>
                <Input placeholder="Sunset Apartments" />
              </FormField>
              <FormField label="Property Address">
                <Input placeholder="123 Main Street" />
              </FormField>
              <div className="flex gap-2 pt-4 border-t border-border">
                <Button>Save Property</Button>
                <Button variant="outline">Cancel</Button>
              </div>
            </div>
          </div>
        ),
        variants: [
          {
            name: 'Multi-Section Form',
            description: 'Complex forms with collapsible sections and sidebar preview',
            props: { sections: [] },
            component: (
              <div className="space-y-4">
                <Text variant="muted">
                  Form templates provide comprehensive form building:
                </Text>
                <div className="grid gap-3 text-sm text-muted-foreground">
                  <div>• 📝 Multi-section form organization</div>
                  <div>• ✅ Built-in validation and error display</div>
                  <div>• 🎛️ Comprehensive field type support</div>
                  <div>• 🔄 Form state management</div>
                  <div>• 📱 Responsive layouts (sidebar, split, stacked)</div>
                  <div>• 💾 Sticky action buttons</div>
                </div>
              </div>
            )
          }
        ]
      }
    ]
  },

  // ============================================================================
  // DESIGN SYSTEM - Colors, Typography, etc.
  // ============================================================================
  {
    id: 'design-system',
    name: 'Design System',
    description: 'Colors, typography, spacing, and design tokens',
    icon: Palette,
    components: [
      {
        name: 'Colors',
        description: 'Semantic color system with light and dark theme support',
        code: `// CSS Variables
--background: 0 0% 100%
--foreground: 240 10% 3.9%
--primary: 240 5.9% 10%
--secondary: 240 4.8% 95.9%
--muted: 240 4.8% 95.9%
--accent: 240 4.8% 95.9%
--destructive: 0 62.8% 30.6%`,
        component: (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="w-full h-12 bg-primary rounded"></div>
                <Text size="sm">Primary</Text>
              </div>
              <div className="space-y-2">
                <div className="w-full h-12 bg-secondary rounded"></div>
                <Text size="sm">Secondary</Text>
              </div>
              <div className="space-y-2">
                <div className="w-full h-12 bg-accent rounded"></div>
                <Text size="sm">Accent</Text>
              </div>
              <div className="space-y-2">
                <div className="w-full h-12 bg-destructive rounded"></div>
                <Text size="sm">Destructive</Text>
              </div>
            </div>
          </div>
        ),
        variants: [
          {
            name: 'Status Colors',
            description: 'Semantic colors for different states and status indicators',
            props: { type: 'status' },
            component: (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-green-500 rounded"></div>
                    <Text size="sm">Success / Active</Text>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-yellow-500 rounded"></div>
                    <Text size="sm">Warning / Pending</Text>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-red-500 rounded"></div>
                    <Text size="sm">Error / Destructive</Text>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-blue-500 rounded"></div>
                    <Text size="sm">Info / Primary</Text>
                  </div>
                </div>
              </div>
            )
          }
        ]
      },
      {
        name: 'Typography',
        description: 'Typography scale and semantic text variants',
        code: `<Text size="2xl" weight="bold">Heading</Text>
<Text size="lg" weight="semibold">Subheading</Text>
<Text size="base">Body text</Text>
<Text size="sm" variant="muted">Caption</Text>`,
        component: (
          <div className="space-y-3">
            <Text size="2xl" weight="bold">Large Heading</Text>
            <Text size="lg" weight="semibold">Section Heading</Text>
            <Text size="md">Body text for paragraphs and content</Text>
            <Text size="sm" variant="muted">Small caption or metadata text</Text>
          </div>
        ),
        variants: [
          {
            name: 'Content Hierarchy',
            description: 'Typography system for proper content hierarchy',
            props: { hierarchy: true },
            component: (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Text size="2xl" weight="bold">Property Portfolio Overview</Text>
                  <Text variant="muted">Comprehensive dashboard for property management</Text>
                </div>
                <div className="space-y-2">
                  <Text size="lg" weight="semibold">Recent Activity</Text>
                  <Text size="md">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</Text>
                  <Text size="sm" variant="muted">Last updated 2 hours ago</Text>
                </div>
              </div>
            )
          }
        ]
      }
    ]
  }
]