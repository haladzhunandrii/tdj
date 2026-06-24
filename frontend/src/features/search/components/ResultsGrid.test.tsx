import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  mockRepository,
  mockUser,
  preloadedStateWithResults,
  renderWithProviders,
} from '../../../test/testUtils'
import { ResultsGrid } from './ResultsGrid'

describe('ResultsGrid', () => {
  it('shows skeleton cards while loading', () => {
    const { container } = renderWithProviders(<ResultsGrid />, {
      preloadedState: preloadedStateWithResults({ status: 'loading' }),
    })

    expect(screen.getByLabelText(/Searching for/)).toHaveAttribute('aria-busy', 'true')
    expect(container.querySelectorAll('[class*="skeleton"]')).toHaveLength(6)
  })

  it('renders user cards for user search', () => {
    renderWithProviders(<ResultsGrid />, {
      preloadedState: preloadedStateWithResults({
        searchType: 'users',
        results: [mockUser({ login: 'octocat' })],
      }),
    })

    expect(screen.getByText('octocat')).toBeInTheDocument()
  })

  it('renders repository cards for repository search', () => {
    renderWithProviders(<ResultsGrid />, {
      preloadedState: preloadedStateWithResults({
        results: [mockRepository({ name: 'hello-world' })],
      }),
    })

    expect(screen.getByText('hello-world')).toBeInTheDocument()
  })

  it('renders nothing when there are no results and not loading', () => {
    const { container } = renderWithProviders(<ResultsGrid />, {
      preloadedState: preloadedStateWithResults({ results: [] }),
    })

    expect(container).toBeEmptyDOMElement()
  })
})
