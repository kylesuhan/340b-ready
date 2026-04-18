export interface ContentSource {
  id: string
  label: string
  url: string
  related_module_slugs: string[]
}

export const CONTENT_SOURCES: ContentSource[] = [
  {
    id: 'hrsa-340b-program',
    label: 'HRSA 340B Drug Pricing Program',
    url: 'https://www.hrsa.gov/opa/index.html',
    related_module_slugs: ['module-1', 'module-2'],
  },
  {
    id: 'hrsa-340b-faq',
    label: 'HRSA 340B Frequently Asked Questions',
    url: 'https://www.hrsa.gov/opa/faqs/index.html',
    related_module_slugs: ['module-1', 'module-2', 'module-3'],
  },
  {
    id: 'hrsa-integrity',
    label: 'HRSA 340B Program Integrity',
    url: 'https://www.hrsa.gov/opa/integrity/index.html',
    related_module_slugs: ['module-3', 'module-4', 'module-5'],
  },
  {
    id: 'federal-register-340b',
    label: 'Federal Register: 340B Drug Program',
    url: 'https://www.federalregister.gov/documents/search?conditions%5Bterm%5D=340B+drug+pricing',
    related_module_slugs: ['module-4', 'module-5'],
  },
]
