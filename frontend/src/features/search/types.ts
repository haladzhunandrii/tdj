export type SearchType = 'users' | 'repositories'

export interface UserResult {
  id: number
  login: string
  avatar_url: string
  html_url: string
  type: string
  location: string | null
}

export interface RepositoryResult {
  id: number
  name: string
  full_name: string
  html_url: string
  description: string | null
  stargazers_count: number
  stars_count: number
  forks_count: number
  language: string | null
  updated_at: string
  owner_login: string
  owner_avatar_url: string
  owner: { login: string; avatar_url: string }
}

export type SearchResult = UserResult | RepositoryResult

export interface SearchResponse<T> {
  results: T[]
  total_count: number
  page: number
  per_page: number
  cached: boolean
  search_type: string
  query: string
}

export interface CachedEntry<T> extends SearchResponse<T> {
  cachedAt: number
}

export type CacheKey = string

export interface FetchSearchPayload {
  query: string
  searchType: SearchType
  page: number
}

export interface FetchSearchResult {
  cacheKey: CacheKey
  results: SearchResult[]
  total_count: number
  page: number
  per_page: number
  cached: boolean
  search_type: string
  query: string
}
