import type { SearchType } from '../features/search/types'

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')
const SEARCH_URL = `${API_BASE}/api/search/`

export class SearchAbortedError extends Error {
  constructor() {
    super('Search aborted')
    this.name = 'SearchAbortedError'
  }
}

export interface ApiError {
  status: number
  message: string
  fieldErrors?: Record<string, string[]>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function parseFieldErrors(data: unknown): Record<string, string[]> | undefined {
  if (!isRecord(data)) return undefined

  const fieldErrors: Record<string, string[]> = {}
  for (const [key, value] of Object.entries(data)) {
    if (key === 'error') continue
    if (Array.isArray(value) && value.every((item) => typeof item === 'string')) {
      fieldErrors[key] = value
    }
  }

  return Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined
}

function formatApiError(status: number, data: unknown): ApiError {
  if (isRecord(data) && typeof data.error === 'string') {
    return { status, message: data.error }
  }

  const fieldErrors = parseFieldErrors(data)
  if (fieldErrors) {
    const firstMessage = Object.values(fieldErrors).flat()[0]
    return {
      status,
      message: firstMessage ?? 'Validation error',
      fieldErrors,
    }
  }

  return { status, message: `Request failed with status ${status}` }
}

export async function search(
  query: string,
  searchType: SearchType,
  page = 1,
  signal?: AbortSignal,
): Promise<{
  results: unknown[]
  total_count: number
  page: number
  per_page: number
  cached: boolean
  search_type: string
  query: string
}> {
  try {
    const response = await fetch(SEARCH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: query.trim(), search_type: searchType, page }),
      signal,
    })

    const data: unknown = await response.json().catch(() => null)

    if (!response.ok) {
      throw formatApiError(response.status, data)
    }

    return data as {
      results: unknown[]
      total_count: number
      page: number
      per_page: number
      cached: boolean
      search_type: string
      query: string
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new SearchAbortedError()
    }
    if (error instanceof SearchAbortedError) {
      throw error
    }
    if (isRecord(error) && typeof error.status === 'number' && typeof error.message === 'string') {
      throw error as unknown as ApiError
    }
    throw {
      status: 0,
      message: 'Unable to connect. Check your network.',
    } satisfies ApiError
  }
}
