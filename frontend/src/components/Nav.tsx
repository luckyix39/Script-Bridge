import styles from './Nav.module.css'

export type Page = 'home' | 'narrative' | 'ipa' | 'document' | 'sutterlin'

const LANGUAGE_PAGES: Page[] = ['ipa', 'document', 'sutterlin']

interface Props {
  activePage: Page
  onNavigate: (page: Page) => void
}

export default function Nav({ activePage, onNavigate }: Props) {
  // No navigation chrome on the landing page.
  if (activePage === 'home') return null

  const inLanguage = LANGUAGE_PAGES.includes(activePage)

  return (
    <div className={styles.navWrap}>
      <button className={styles.back} onClick={() => onNavigate('home')}>
        ← Back
      </button>

      {inLanguage && (
        <nav className={`${styles.nav} ${styles.subnav}`}>
          <button
            className={`${styles.tab} ${activePage === 'ipa' ? styles.active : ''}`}
            onClick={() => onNavigate('ipa')}
          >
            Audio → IPA
          </button>
          <button
            className={`${styles.tab} ${activePage === 'document' ? styles.active : ''}`}
            onClick={() => onNavigate('document')}
          >
            Document Reader
          </button>
          <button
            className={`${styles.tab} ${activePage === 'sutterlin' ? styles.active : ''}`}
            onClick={() => onNavigate('sutterlin')}
          >
            Sütterlin Script
          </button>
        </nav>
      )}
    </div>
  )
}
