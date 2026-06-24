import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { preloadedStateWithResults, renderWithProviders } from '../../../test/testUtils'
import { Pagination } from './Pagination'

describe('Pagination', () => {
  it('renders nothing when pagination is not needed', () => {
    const { container } = renderWithProviders(<Pagination onPageChange={vi.fn()} />, {
      preloadedState: preloadedStateWithResults({ totalCount: 10 }),
    })

    expect(container).toBeEmptyDOMElement()
  })

  it('disables previous on first page and next on last page', () => {
    renderWithProviders(<Pagination onPageChange={vi.fn()} />, {
      preloadedState: preloadedStateWithResults({ page: 1, totalCount: 533 }),
    })

    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Next page' })).toBeEnabled()
  })

  it('disables navigation while loading', () => {
    renderWithProviders(<Pagination onPageChange={vi.fn()} />, {
      preloadedState: preloadedStateWithResults({
        page: 2,
        totalCount: 533,
        status: 'loading',
      }),
    })

    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled()
  })

  it('calls onPageChange when next is clicked', () => {
    const onPageChange = vi.fn()
    renderWithProviders(<Pagination onPageChange={onPageChange} />, {
      preloadedState: preloadedStateWithResults({ page: 1, totalCount: 533 }),
    })

    fireEvent.click(screen.getByRole('button', { name: 'Next page' }))
    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  it('shows current page label', () => {
    renderWithProviders(<Pagination onPageChange={vi.fn()} />, {
      preloadedState: preloadedStateWithResults({ page: 3, totalCount: 533 }),
    })

    expect(screen.getByText('Page 3 of 23')).toBeInTheDocument()
  })
})
