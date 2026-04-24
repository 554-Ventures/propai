# 📋 Page Templates

**Version 4.0** - Enterprise-grade page templates for rapid PropTech development

## 🎯 Purpose

Page templates provide pre-built, consistent page structures that accelerate development from **2 days → 4 hours** for new pages. Each template follows PropTech best practices and integrates seamlessly with our atomic design system.

## 🏗️ Template Library

### 1. 📊 Dashboard Template
**Use Case**: Metrics overview pages, analytics dashboards, performance summaries

**Key Features**:
- Responsive metric cards with trend indicators
- Flexible section layouts (charts, lists, widgets)
- Loading states and error handling
- Configurable grid layouts (3/4/5 columns)

```tsx
import { DashboardTemplate } from '@/components/templates'

<DashboardTemplate
  title="Property Portfolio Overview"
  description="Monitor performance across your properties"
  metrics={[
    {
      id: 'occupancy',
      title: 'Occupancy Rate',
      value: '94.2%',
      trend: { direction: 'up', label: '+2.1%', color: 'success' }
    },
    {
      id: 'revenue',
      title: 'Monthly Revenue',
      value: '$125,400',
      status: 'success'
    }
  ]}
  sections={[
    {
      id: 'recent-activity',
      title: 'Recent Activity',
      content: <ActivityFeed />
    }
  ]}
/>
```

**Perfect For**: `/dashboard`, `/analytics`, `/overview`, portfolio summaries

---

### 2. 📋 List Template
**Use Case**: Data tables, entity listings, filterable collections

**Key Features**:
- Table and card view modes
- Advanced filtering with FilterBar integration
- Bulk selection and actions
- Pagination and sorting
- Empty states and loading skeletons

```tsx
import { ListTemplate } from '@/components/templates'

<ListTemplate
  title="Tenants"
  description="Manage tenant contacts and leases"
  data={tenants}
  displayMode="table"
  columns={[
    { id: 'name', header: 'Name', accessorKey: 'fullName', sortable: true },
    { id: 'unit', header: 'Unit', accessorKey: 'unit', sortable: true },
    { id: 'rent', header: 'Rent', cell: (tenant) => formatCurrency(tenant.rent) }
  ]}
  selectable={true}
  bulkActions={[
    { label: 'Send Notice', onClick: sendBulkNotice },
    { label: 'Export', onClick: exportSelected }
  ]}
  filters={[
    { type: 'select', key: 'status', label: 'Status', options: statusOptions },
    { type: 'search', key: 'query', placeholder: 'Search tenants...' }
  ]}
  headerAction={<Button href="/tenants/new">Add Tenant</Button>}
/>
```

**Perfect For**: `/tenants`, `/properties`, `/leases`, `/maintenance`, any listing page

---

### 3. 📋 Detail Template
**Use Case**: Individual entity pages, profiles, detailed views

**Key Features**:
- Flexible section layouts with field rendering
- Tab navigation for complex entities
- Status badges and metadata display
- Sidebar content support
- Collapsible sections

```tsx
import { DetailTemplate } from '@/components/templates'

<DetailTemplate
  title="Sunset Apartments - Unit 4B"
  status={{ variant: 'success', label: 'Occupied' }}
  badges={[
    { id: 'type', label: '2BR/1BA', variant: 'outline' }
  ]}
  sections={[
    {
      id: 'basic-info',
      title: 'Property Details',
      fields: [
        { id: 'address', label: 'Address', value: '123 Sunset Ave, Unit 4B' },
        { id: 'rent', label: 'Monthly Rent', value: '$2,400', type: 'currency' },
        { id: 'lease-end', label: 'Lease End', value: 'Dec 31, 2024', type: 'date' }
      ]
    }
  ]}
  tabs={[
    { id: 'overview', label: 'Overview', content: <PropertyOverview /> },
    { id: 'maintenance', label: 'Maintenance', badge: 3, content: <MaintenanceList /> }
  ]}
  headerAction={<Button variant="outline">Edit Property</Button>}
/>
```

**Perfect For**: `/properties/[id]`, `/tenants/[id]`, `/leases/[id]`, any detail page

---

### 4. ✏️ Form Template
**Use Case**: Create/edit workflows, settings forms, multi-step processes

**Key Features**:
- Sectioned forms with collapsible groups
- Comprehensive field type support
- Form validation and error display
- Sidebar content for help/preview
- Sticky action buttons

```tsx
import { FormTemplate } from '@/components/templates'

<FormTemplate
  title="Add New Property"
  description="Create a new property in your portfolio"
  sections={[
    {
      id: 'basic',
      title: 'Property Information',
      fields: [
        { id: 'name', name: 'name', label: 'Property Name', type: 'text', required: true },
        { id: 'address', name: 'address', label: 'Address', type: 'text', required: true },
        { id: 'units', name: 'units', label: 'Number of Units', type: 'number', min: 1 }
      ]
    },
    {
      id: 'financial',
      title: 'Financial Details',
      collapsible: true,
      fields: [
        { id: 'purchase-price', name: 'purchasePrice', label: 'Purchase Price', type: 'number' },
        { id: 'expenses', name: 'monthlyExpenses', label: 'Monthly Expenses', type: 'number' }
      ]
    }
  ]}
  values={formData}
  errors={formErrors}
  onChange={handleFieldChange}
  onSubmit={handleSubmit}
  isSubmitting={saving}
  sidebarContent={<PropertyPreview data={formData} />}
  sidebarTitle="Property Preview"
/>
```

**Perfect For**: `/properties/new`, `/tenants/new`, `/settings/profile`, any form-based workflow

---

### 5. ⚙️ Settings Template
**Use Case**: Configuration pages, admin panels, preferences

**Key Features**:
- Sidebar navigation for complex settings
- Tab-based organization
- Specialized form controls (switches, color pickers)
- Section-level or global save operations
- Badge indicators for settings status

```tsx
import { SettingsTemplate } from '@/components/templates'

<SettingsTemplate
  title="Organization Settings"
  description="Configure your organization preferences"
  layout="sidebar"
  navigation={[
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'billing', label: 'Billing & Usage', badge: '2', icon: CreditCardIcon },
    { id: 'integrations', label: 'Integrations', icon: PlugIcon }
  ]}
  sections={[
    {
      id: 'company',
      title: 'Company Information',
      fields: [
        { id: 'name', name: 'companyName', label: 'Company Name', type: 'text' },
        { id: 'logo', name: 'logo', label: 'Company Logo', type: 'file' },
        { id: 'theme', name: 'theme', label: 'Dark Mode', type: 'switch' }
      ]
    }
  ]}
  values={settings}
  onChange={handleSettingChange}
  onSave={saveSettings}
  showGlobalSave={true}
  hasChanges={settingsChanged}
/>
```

**Perfect For**: `/settings/*`, `/admin/*`, configuration workflows

---

## 🚀 Quick Start Guide

### 1. Choose the Right Template
Match your page type to the appropriate template:
- **Metrics/Overview** → Dashboard
- **Data Collections** → List  
- **Individual Records** → Detail
- **Create/Edit Forms** → Form
- **Configuration** → Settings

### 2. Import and Configure
```tsx
import { DashboardTemplate } from '@/components/templates'

export default function MyPage() {
  return (
    <DashboardTemplate
      title="My Page"
      // ...configure props
    />
  )
}
```

### 3. Customize with Props
Each template provides extensive customization through props:
- **Layout variants**: `layout="sidebar"`, `spacing="compact"`
- **Content structure**: `sections`, `tabs`, `fields`
- **Behavioral props**: `loading`, `error`, `onSubmit`

## 🎨 Design Patterns

### Consistent Props
All templates share common patterns:
```tsx
{
  title: string              // Page title
  description?: string       // Page description  
  loading?: boolean         // Loading state
  error?: string           // Error message
  headerAction?: ReactNode  // Action buttons
  className?: string       // Custom styling
}
```

### Section Structure
Most templates use sections for content organization:
```tsx
{
  id: string              // Unique identifier
  title: string          // Section title
  description?: string   // Section description
  content?: ReactNode    // Custom content
  loading?: boolean     // Section loading
  className?: string    // Section styling
}
```

### Field Definitions
Form and Settings templates use field definitions:
```tsx
{
  id: string                    // Unique field ID
  name: string                 // Form field name
  label: string               // Display label
  type: 'text' | 'select' ... // Field type
  required?: boolean          // Validation
  value?: any                // Current value
  onChange?: (value) => void  // Change handler
}
```

## ⚡ Performance Tips

1. **Lazy Load Content**: Use `loading` props for sections that fetch data
2. **Memoize Expensive Calculations**: Wrap metrics/data processing in `useMemo`
3. **Optimize Re-renders**: Use `useCallback` for event handlers
4. **Virtual Scrolling**: For large lists, consider virtual scrolling in List Template

## 🔧 Customization

### Layout Variants
Most templates support layout customization:
- `layout="default"` - Standard single-column
- `layout="sidebar"` - Two-column with navigation
- `layout="split"` - Split content areas
- `spacing="compact|comfortable|spacious"` - Vertical spacing

### Styling Override
Templates use CVA (Class Variance Authority) for consistent styling:
```tsx
<DashboardTemplate
  className="my-custom-styles"
  layout="wide" 
  spacing="compact"
/>
```

### Custom Rendering
Many templates support custom render functions:
```tsx
fields={[
  {
    id: 'custom',
    name: 'customField',
    label: 'Custom Field',
    type: 'custom',
    render: (field, props) => <CustomComponent {...props} />
  }
]}
```

## 📖 Examples

### Complete Property Dashboard
```tsx
function PropertyDashboard({ propertyId }: { propertyId: string }) {
  const { property, metrics, loading } = useProperty(propertyId)
  
  return (
    <DashboardTemplate
      title={property.name}
      description={`${property.units} units • ${property.address}`}
      loading={loading}
      metrics={[
        {
          id: 'occupancy',
          title: 'Occupancy',
          value: `${metrics.occupancy}%`,
          trend: { direction: 'up', label: '+2%', color: 'success' }
        },
        {
          id: 'revenue',
          title: 'Monthly Revenue', 
          value: formatCurrency(metrics.revenue),
          status: metrics.revenue > metrics.target ? 'success' : 'warning'
        }
      ]}
      sections={[
        {
          id: 'units',
          title: 'Unit Status',
          content: <UnitStatusGrid units={property.units} />
        }
      ]}
      headerAction={<Button href={`/properties/${propertyId}/edit`}>Edit Property</Button>}
    />
  )
}
```

### Tenant Management List
```tsx
function TenantsPage() {
  const { tenants, loading, filters, setFilters } = useTenants()
  
  return (
    <ListTemplate
      title="Tenants"
      description="Manage tenant contacts and lease information"
      data={tenants}
      loading={loading}
      displayMode="table"
      columns={[
        { id: 'name', header: 'Name', accessorKey: 'fullName' },
        { id: 'unit', header: 'Unit', cell: (tenant) => <UnitLink unit={tenant.unit} /> },
        { id: 'rent', header: 'Rent', cell: (tenant) => formatCurrency(tenant.rent) },
        { id: 'status', header: 'Status', cell: (tenant) => <StatusBadge status={tenant.status} /> }
      ]}
      filters={[
        { type: 'select', key: 'status', label: 'Status', options: tenantStatusOptions },
        { type: 'select', key: 'property', label: 'Property', options: propertyOptions }
      ]}
      searchValue={filters.query}
      onSearchChange={(query) => setFilters({ ...filters, query })}
      onFiltersChange={setFilters}
      headerAction={<Button href="/tenants/new">Add Tenant</Button>}
      emptyState={{
        title: "No tenants found",
        description: "Get started by adding your first tenant",
        action: <Button href="/tenants/new">Add Tenant</Button>
      }}
    />
  )
}
```

## 🔍 Troubleshooting

**Template not rendering correctly?**
- Check that all required props are provided
- Verify data structure matches expected format
- Check browser console for TypeScript errors

**Styling issues?**
- Ensure parent container allows proper layout
- Check for conflicting CSS classes
- Verify theme CSS variables are defined

**Performance problems?**
- Use loading states for async data
- Memoize expensive calculations
- Consider pagination for large datasets

## 📚 Related Documentation

- [Component Library](../ui/README.md) - Atomic design system
- [Theme Guide](../../styles/README.md) - Styling and theming
- [API Integration](../../lib/api/README.md) - Data fetching patterns
- [Form Handling](../../lib/forms/README.md) - Form validation and state

---

*Templates are designed to be the fastest path from concept to functional page. When you need something custom, start with the closest template and extend it.*