import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { preloadedStateWithResults, renderWithProviders } from '../../../test/testUtils'
import { SearchStatus } from './SearchStatus'

describe('SearchStatus', () => {
  it('renders nothing while loading', () => {
    const { container } = renderWithProviders(<SearchStatus onRetry={vi.fn()} />, {
      preloadedState: preloadedStateWithResults({ status: 'loading' }),
    })

    expect(container).toBeEmptyDOMElement()
  })

  it('shows error and triggers retry', () => {
    const onRetry = vi.fn()
    const preloadedState = preloadedStateWithResults({ status: 'failed' })
    preloadedState.searchUi!.error = 'GitHub API error'

    renderWithProviders(<SearchStatus onRetry={onRetry} />, { preloadedState })

    expect(screen.getByRole('alert')).toHaveTextContent('GitHub API error')
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('shows empty results message', () => {
    renderWithProviders(<SearchStatus onRetry={vi.fn()} />, {
      preloadedState: preloadedStateWithResults({
        query: 'zzzznotfound',
        results: [],
      }),
    })

    expect(screen.getByText(/No results found for/)).toHaveTextContent('zzzznotfound')
  })
})
