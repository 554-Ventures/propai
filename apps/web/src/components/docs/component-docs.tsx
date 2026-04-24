"use client"

import * as React from "react"
import { ChevronRight, Code2, Copy, ExternalLink, Eye, Palette, Search, Settings } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "../ui/button"
import { Input } from "../ui/atoms/input"
import { Badge } from "../ui/atoms/badge"
import { Text } from "../ui/atoms/text"

export interface ComponentExample {
  name: string
  description: string
  code: string
  component: React.ReactNode
  props?: Record<string, unknown>
  variants?: Array<{
    name: string
    description?: string
    props: Record<string, unknown>
    component: React.ReactNode
  }>
}

export interface ComponentCategory {
  id: string
  name: string
  description: string
  icon?: React.ComponentType<{ className?: string }>
  components: ComponentExample[]
}

export interface ComponentDocsProps {
  categories: ComponentCategory[]
  className?: string
}

function ComponentDocs({ categories, className }: ComponentDocsProps) {
  const [activeCategory, setActiveCategory] = React.useState(categories[0]?.id || '')
  const [activeComponent, setActiveComponent] = React.useState<string | null>(null)
  const [activeVariant, setActiveVariant] = React.useState<string>('default')
  const [showCode, setShowCode] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [theme, setTheme] = React.useState<'light' | 'dark'>('light')

  // Filter components based on search
  const filteredCategories = React.useMemo(() => {
    if (!searchQuery) return categories
    
    return categories.map(category => ({
      ...category,
      components: category.components.filter(component =>
        component.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        component.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })).filter(category => category.components.length > 0)
  }, [categories, searchQuery])

  const currentCategory = filteredCategories.find(cat => cat.id === activeCategory)
  const currentComponent = currentCategory?.components.find(comp => comp.name === activeComponent)
  const currentVariant = currentComponent?.variants?.find(variant => variant.name === activeVariant) || {
    name: 'default',
    props: currentComponent?.props || {},
    component: currentComponent?.component
  }

  const handleCopyCode = () => {
    const code = currentComponent?.code || ''
    navigator.clipboard.writeText(code)
  }

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark')
  }

  return (
    <div className={cn("flex h-screen bg-background max-h-screen", className)}>
      {/* Sidebar */}
      <div className="w-80 border-r border-border bg-card overflow-y-auto">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg font-semibold text-card-foreground">Component Docs</h1>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={toggleTheme}
                className="p-2"
              >
                <Palette className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="p-2"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search components..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <nav className="p-2">
          {filteredCategories.map((category) => {
            const isActive = activeCategory === category.id

            return (
              <div key={category.id} className="mb-2">
                <button
                  onClick={() => {
                    setActiveCategory(category.id)
                    setActiveComponent(null)
                  }}
                  className={cn(
                    "flex items-center w-full p-2 text-left rounded-md transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  {category.icon && <category.icon className="w-4 h-4 mr-2" />}
                  <span className="flex-1">{category.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {category.components.length}
                  </Badge>
                  <ChevronRight className={cn(
                    "w-4 h-4 ml-2 transition-transform",
                    isActive && "rotate-90"
                  )} />
                </button>

                {isActive && (
                  <div className="ml-6 mt-1 space-y-1">
                    {category.components.map((component) => (
                      <button
                        key={component.name}
                        onClick={() => {
                          setActiveComponent(component.name)
                          setActiveVariant('default')
                          setShowCode(false)
                        }}
                        className={cn(
                          "block w-full p-2 text-left text-sm rounded-md transition-colors",
                          activeComponent === component.name
                            ? "bg-primary/5 text-primary"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                        )}
                      >
                        {component.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeComponent && currentComponent ? (
          <>
            {/* Header */}
            <div className="p-6 border-b border-border bg-card">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-card-foreground mb-2">
                    {currentComponent.name}
                  </h2>
                  <Text variant="muted" className="text-base">
                    {currentComponent.description}
                  </Text>
                </div>
                
                <div className="flex items-center gap-2">
                  {currentComponent.variants && (
                    <select
                      value={activeVariant}
                      onChange={(e) => setActiveVariant(e.target.value)}
                      className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
                    >
                      <option value="default">Default</option>
                      {currentComponent.variants.map((variant) => (
                        <option key={variant.name} value={variant.name}>
                          {variant.name}
                        </option>
                      ))}
                    </select>
                  )}
                  
                  <Button
                    size="sm"
                    variant={showCode ? "default" : "outline"}
                    onClick={() => setShowCode(!showCode)}
                  >
                    <Code2 className="w-4 h-4 mr-2" />
                    {showCode ? "Hide Code" : "Show Code"}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyCode}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open
                  </Button>
                </div>
              </div>

              {/* Variant Description */}
              {activeVariant !== 'default' && currentComponent.variants?.find(v => v.name === activeVariant)?.description && (
                <div className="mt-4 p-3 bg-accent/50 rounded-md">
                  <Text variant="muted" size="sm">
                    {currentComponent.variants?.find(v => v.name === activeVariant)?.description}
                  </Text>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
                {/* Preview */}
                <div className="p-6 bg-background">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-foreground">Preview</h3>
                    <Badge variant="outline" className="text-xs">
                      <Eye className="w-3 h-3 mr-1" />
                      {theme}
                    </Badge>
                  </div>
                  
                  <div className="border border-border rounded-lg p-6 bg-card min-h-[300px] flex items-center justify-center">
                    {currentVariant?.component}
                  </div>
                  
                  {/* Props Display */}
                  {currentVariant?.props && Object.keys(currentVariant.props).length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-foreground mb-2">Props</h4>
                      <div className="bg-accent/20 rounded-md p-4">
                        <pre className="text-xs text-muted-foreground">
                          {JSON.stringify(currentVariant.props, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>

                {/* Code */}
                {showCode && (
                  <div className="p-6 bg-accent/5 border-l border-border">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-foreground">Code</h3>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCopyCode}
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Copy
                      </Button>
                    </div>
                    
                    <div className="bg-background border border-border rounded-lg overflow-hidden">
                      <div className="p-2 bg-accent/50 border-b border-border">
                        <Text variant="muted" size="xs">TypeScript</Text>
                      </div>
                      <div className="p-4 overflow-x-auto">
                        <pre className="text-sm text-foreground">
                          <code>{currentComponent.code}</code>
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          // Overview when no component selected
          <div className="flex-1 p-6">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-foreground mb-4">
                  PropAI Component Library
                </h2>
                <Text variant="muted" size="lg">
                  Interactive documentation for our enterprise-grade UI components
                </Text>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {filteredCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className="p-6 border border-border rounded-lg bg-card hover:bg-accent/50 transition-colors text-left"
                  >
                    <div className="flex items-center mb-3">
                      {category.icon && <category.icon className="w-6 h-6 mr-3 text-primary" />}
                      <h3 className="text-lg font-semibold text-card-foreground">
                        {category.name}
                      </h3>
                      <Badge variant="secondary" className="ml-auto">
                        {category.components.length}
                      </Badge>
                    </div>
                    <Text variant="muted" size="sm">
                      {category.description}
                    </Text>
                  </button>
                ))}
              </div>

              <div className="mt-12 p-6 bg-accent/20 rounded-lg">
                <h4 className="text-lg font-semibold text-foreground mb-3">
                  Quick Start
                </h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>• Browse components by category in the sidebar</p>
                  <p>• Click any component to see interactive examples</p>
                  <p>• Toggle between variants to explore different configurations</p>
                  <p>• Copy code snippets directly to your project</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export { ComponentDocs }