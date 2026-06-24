import { PageLayout } from '../components/layout/PageLayout'
import { useAppSelector } from '../app/hooks'
import { Pagination } from '../features/search/components/Pagination'
import { ResultsGrid } from '../features/search/components/ResultsGrid'
import { SearchForm } from '../features/search/components/SearchForm'
import { SearchStatus } from '../features/search/components/SearchStatus'
import { useSearch } from '../features/search/hooks/useSearch'
import {
  selectIsCentered,
  selectResultsSubtitle,
  selectShowGrid,
} from '../features/search/searchSelectors'
import styles from './SearchPage.module.scss'

export function SearchPage() {
  const {
    query,
    searchType,
    handleQueryChange,
    handleSearchTypeChange,
    handlePageChange,
    handleRetry,
  } = useSearch()

  const centered = useAppSelector(selectIsCentered)
  const showGrid = useAppSelector(selectShowGrid)
  const subtitle = useAppSelector(selectResultsSubtitle)

  return (
    <PageLayout centered={centered}>
      <header className={showGrid ? styles.stickyHeader : styles.heroHeader}>
        <SearchForm
          query={query}
          searchType={searchType}
          onQueryChange={handleQueryChange}
          onSearchTypeChange={handleSearchTypeChange}
          centered={centered}
          compact={showGrid}
        />
        {showGrid && subtitle && (
          <p className={styles.subtitle} aria-live="polite">
            {subtitle}
          </p>
        )}
      </header>

      {showGrid && (
        <section className={styles.results} aria-label="Search results" aria-live="polite">
          <SearchStatus onRetry={handleRetry} />
          <ResultsGrid />
          <Pagination onPageChange={handlePageChange} />
        </section>
      )}
    </PageLayout>
  )
}
