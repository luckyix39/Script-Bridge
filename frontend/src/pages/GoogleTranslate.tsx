import styles from './GoogleTranslate.module.css'

export default function GoogleTranslate() {
  return (
    <div className={styles.page}>
      <div className={styles.intro}>
        <h2 className={styles.heading}>Google Translate</h2>
        <p className={styles.subheading}>
          For general text translation beyond names and Sütterlin script, Google
          Translate supports over 100 languages and can handle typed text, whole
          documents, and photos of text.
        </p>
      </div>

      <div className={styles.card}>
        <span className={styles.cardIcon}>🌐</span>
        <p className={styles.cardText}>
          Opens in a new tab on Google's own site — nothing you type there passes
          through Peace Together.
        </p>
        <a
          className={styles.cardBtn}
          href="https://translate.google.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          Open Google Translate ↗
        </a>
      </div>
    </div>
  )
}
