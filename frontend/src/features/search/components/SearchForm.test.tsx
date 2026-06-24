import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../test/testUtils'
import { SearchForm } from './SearchForm'

describe('SearchForm', () => {
  it('calls onQueryChange when typing', () => {
    const onQueryChange = vi.fn()
    renderWithProviders(
      <SearchForm
        query=""
        searchType="repositories"
        onQueryChange={onQueryChange}
        onSearchTypeChange={vi.fn()}
      />,
    )

    fireEvent.change(screen.getByLabelText('Search GitHub'), { target: { value: 'django' } })
    expect(onQueryChange).toHaveBeenCalledWith('django')
  })

  it('calls onSearchTypeChange when selecting a type', () => {
    const onSearchTypeChange = vi.fn()
    renderWithProviders(
      <SearchForm
        query="django"
        searchType="repositories"
        onQueryChange={vi.fn()}
        onSearchTypeChange={onSearchTypeChange}
      />,
    )

    fireEvent.change(screen.getByLabelText('Entity type'), { target: { value: 'users' } })
    expect(onSearchTypeChange).toHaveBeenCalledWith('users')
  })

  it('shows lead and hint in centered mode', () => {
    renderWithProviders(
      <SearchForm
        query=""
        searchType="repositories"
        onQueryChange={vi.fn()}
        onSearchTypeChange={vi.fn()}
        centered
      />,
    )

    expect(screen.getByText('Find users and repositories on GitHub')).toBeInTheDocument()
    expect(screen.getByText('Type at least 3 characters to start searching')).toBeInTheDocument()
  })

  it('applies compact class when compact', () => {
    const { container } = renderWithProviders(
      <SearchForm
        query="django"
        searchType="repositories"
        onQueryChange={vi.fn()}
        onSearchTypeChange={vi.fn()}
        compact
      />,
    )

    expect(container.querySelector('form')?.className).toMatch(/formCompact/)
  })
})
