// Page Templates - Reusable page patterns for rapid development
// These templates provide consistent structure and behavior for common PropTech workflows

export * from './dashboard-template'
export * from './list-template'
export * from './detail-template'
export * from './form-template'
export * from './settings-template'

// Template Type Guards
export const isTemplateProps = {
  dashboard: (props: any): props is import('./dashboard-template').DashboardTemplateProps => 
    typeof props?.title === 'string' && Array.isArray(props?.metrics),
  
  list: (props: any): props is import('./list-template').ListTemplateProps => 
    typeof props?.title === 'string' && Array.isArray(props?.data),
  
  detail: (props: any): props is import('./detail-template').DetailTemplateProps => 
    typeof props?.title === 'string' && (Array.isArray(props?.sections) || Array.isArray(props?.tabs)),
  
  form: (props: any): props is import('./form-template').FormTemplateProps => 
    typeof props?.title === 'string' && (Array.isArray(props?.sections) || Array.isArray(props?.fields)),
  
  settings: (props: any): props is import('./settings-template').SettingsTemplateProps => 
    typeof props?.title === 'string' && (Array.isArray(props?.sections) || Array.isArray(props?.tabs) || Array.isArray(props?.navigation))
}