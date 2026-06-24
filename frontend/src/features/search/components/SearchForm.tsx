import styles from './SearchForm.module.scss'
import type { SearchType } from '../types'

interface SearchFormProps {
  query: string
  searchType: SearchType
  onQueryChange: (value: string) => void
  onSearchTypeChange: (type: SearchType) => void
  centered?: boolean
  compact?: boolean
}

export function SearchForm({
  query,
  searchType,
  onQueryChange,
  onSearchTypeChange,
  centered = false,
  compact = false,
}: SearchFormProps) {
  return (
    <form
      className={`${styles.form} ${centered ? styles.formCentered : styles.formExpanded} ${compact ? styles.formCompact : ''}`}
      onSubmit={(event) => event.preventDefault()}
    >
      <h1 className={styles.title}>GitHub Search</h1>
      {centered && (
        <p className={styles.lead}>Find users and repositories on GitHub</p>
      )}
      <div className={styles.controls}>
        <input
          type="search"
          className={styles.input}
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search GitHub..."
          maxLength={256}
          aria-label="Search GitHub"
          autoFocus
        />
        <div className={styles.selectWrapper}>
          <select
            className={styles.select}
            value={searchType}
            onChange={(event) => onSearchTypeChange(event.target.value as SearchType)}
            aria-label="Entity type"
          >
            <option value="users">User</option>
            <option value="repositories">Repository</option>
          </select>
        </div>
      </div>
      {centered && (
        <p className={styles.hint}>Type at least 3 characters to start searching</p>
      )}
    </form>
  )
}
