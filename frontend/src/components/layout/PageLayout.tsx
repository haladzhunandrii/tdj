import type { ReactNode } from 'react'
import styles from './PageLayout.module.scss'

interface PageLayoutProps {
  centered: boolean
  children: ReactNode
}

export function PageLayout({ centered, children }: PageLayoutProps) {
  return (
    <div className={`${styles.page} ${centered ? styles.pageCentered : styles.pageResults}`}>
      <div className={styles.container}>{children}</div>
    </div>
  )
}
