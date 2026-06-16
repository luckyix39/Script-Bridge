import styles from './Nav.module.css'

export type Page = 'home' | 'narrative' | 'ipa' | 'document' | 'sutterlin'

const LANGUAGE_PAGES: Page[] = ['ipa', 'document', 'sutterlin']

interface Props {
  activePage: Page
  onNavigate: (page: Page) => void
}

export default function Nav({ activePage, onNavigate }: Props) {
  const inLanguage = LANGUAGE_PAGES.includes(activePage)

  return (
    <div className={styles.navWrap}>
      <nav className={styles.nav}>
        <button
          className={`${styles.tab} ${activePage === 'home' ? styles.active : ''}`}
          onClick={() => onNavigate('home')}
        >
          Home
        </button>
        <button
          className={`${styles.tab} ${activePage === 'narrative' ? styles.active : ''}`}
          onClick={() => onNavigate('narrative')}
        >
          Narrative Guidance
        </button>
        <button
          className={`${styles.tab} ${inLanguage ? styles.active : ''}`}
          onClick={() => onNavigate('ipa')}
        >
          Language Parsing
        </button>
      </nav>

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
