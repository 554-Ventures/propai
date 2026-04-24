"use client"

import { ComponentDocs } from "./component-docs"
import { componentLibrary } from "./component-library-data"

export default function ComponentDocumentationPage() {
  return (
    <div className="min-h-screen bg-background">
      <ComponentDocs categories={componentLibrary} />
    </div>
  )
}