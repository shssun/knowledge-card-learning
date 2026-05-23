export const ROUTES = {
  HOME: '/',
  MATERIALS: '/materials',
  STUDY: '/study',
  ARCHIVE: '/archive',
  REVIEW: '/review',
  OUTPUT: '/output',
  SETTINGS: '/settings',
  GRAPH: '/graph/:domain',
  LEVEL: '/level/:domain',
  CASE_ANALYSIS: '/case-analysis',
  META_CONCEPTS: '/meta-concepts',
  DECONSTRUCTOR: '/deconstructor',
  BOOK_DECONSTRUCTOR: '/deconstructor/book',
  DOMAIN_TERMS: '/domain-terms',
  MECE_TRAINER: '/mece-trainer',
  MENTAL_MODELS: '/mental-models',
  TRANSLATION_PRACTICE: '/translation-practice',
  VAULT: '/vault',
  // 管理后台
  ADMIN: '/admin',
  ADMIN_DOMAINS: '/admin/domains',
  ADMIN_TERMS: '/admin/terms',
  ADMIN_PODCASTS: '/admin/podcasts',
  ADMIN_DATA: '/admin/data',
} as const

export type RouteKey = keyof typeof ROUTES
