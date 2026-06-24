import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { search, SearchAbortedError } from './searchClient'

describe('searchClient', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('parses DRF field errors on 400', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ query: ['Ensure this field has at least 3 characters.'] }),
    } as Response)

    await expect(search('ab', 'users')).rejects.toMatchObject({
      status: 400,
      message: 'Ensure this field has at least 3 characters.',
    })
  })

  it('parses error object on 429', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({ error: 'GitHub API rate limit exceeded. Please try again later.' }),
    } as Response)

    await expect(search('django', 'repositories')).rejects.toMatchObject({
      status: 429,
      message: 'GitHub API rate limit exceeded. Please try again later.',
    })
  })

  it('returns successful response', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        results: [],
        total_count: 0,
        page: 1,
        per_page: 24,
        cached: false,
        search_type: 'users',
        query: 'django',
      }),
    } as Response)

    const result = await search('django', 'users')
    expect(result.total_count).toBe(0)
    expect(fetch).toHaveBeenCalledWith(
      '/api/search/',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }),
    )
  })

  it('maps network failure to friendly message', async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError('Failed to fetch'))

    await expect(search('django', 'users')).rejects.toMatchObject({
      status: 0,
      message: 'Unable to connect. Check your network.',
    })
  })

  it('sends page in request body', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        results: [],
        total_count: 0,
        page: 2,
        per_page: 24,
        cached: false,
        search_type: 'users',
        query: 'django',
      }),
    } as Response)

    await search('django', 'users', 2)

    const [, options] = vi.mocked(fetch).mock.calls[0]
    expect(JSON.parse((options as RequestInit).body as string)).toEqual({
      query: 'django',
      search_type: 'users',
      page: 2,
    })
  })

  it('maps AbortError to SearchAbortedError', async () => {
    vi.mocked(fetch).mockRejectedValue(new DOMException('Aborted', 'AbortError'))

    await expect(search('django', 'users', 1, new AbortController().signal)).rejects.toBeInstanceOf(
      SearchAbortedError,
    )
  })

  it('parses 502 error payload', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => ({ error: 'GitHub API error. Please try again.' }),
    } as Response)

    await expect(search('django', 'users')).rejects.toMatchObject({
      status: 502,
      message: 'GitHub API error. Please try again.',
    })
  })

  it('falls back when response json is null', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => null,
    } as Response)

    await expect(search('django', 'users')).rejects.toMatchObject({
      status: 500,
      message: 'Request failed with status 500',
    })
  })

  it('passes abort signal to fetch', async () => {
    const controller = new AbortController()
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        results: [],
        total_count: 0,
        page: 1,
        per_page: 24,
        cached: false,
        search_type: 'users',
        query: 'django',
      }),
    } as Response)

    await search('django', 'users', 1, controller.signal)

    expect(fetch).toHaveBeenCalledWith(
      '/api/search/',
      expect.objectContaining({ signal: controller.signal }),
    )
  })
})
