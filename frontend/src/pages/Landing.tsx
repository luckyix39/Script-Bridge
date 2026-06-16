import type { Page } from '../components/Nav'
import styles from './Landing.module.css'

interface Props {
  onNavigate: (page: Page) => void
}

export default function Landing({ onNavigate }: Props) {
  return (
    <div className={styles.landing}>
      <p className={styles.lede}>
        Harnessing the speed &amp; power of AI to weave each individual story
        depicting the Holocaust.
      </p>

      <section className={styles.section}>
        <h2 className={styles.h}>Mission</h2>
        <p>
          Peace Together (PT) encourages heirs, scholars and all researchers to
          persist in researching in order to fully understand our shared history
          as a whole.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.h}>The Problem</h2>
        <p>
          In order to reveal ultimate truths of humanity, we are racing against
          time to review and analyze mountains of documentation related to
          millions of individuals whose stories comprise the events described as
          the Holocaust.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.h}>The Solution</h2>
        <p>
          PT expedites research by offering information with actionable next
          steps. In this way, PT helps any researcher (even those without
          historical knowledge) to find and to execute focused research within
          historical Holocaust databases.
        </p>
        <p className={styles.subtle}>
          PT offers two main search approaches — choose one to begin:
        </p>
      </section>

      <div className={styles.cards}>
        <button
          className={styles.card}
          onClick={() => onNavigate('narrative')}
        >
          <span className={styles.cardNum}>Approach One</span>
          <span className={styles.cardTitle}>
            Narrative Guidance to Holocaust Databases
          </span>
          <span className={styles.cardBody}>
            AI-assisted narrative guidance takes information about an individual
            subject, then weaves together documented dates, locations, and
            historical events related to that person, and provides a driving
            hypothetical narrative to guide you step-by-step through the major
            Holocaust databases. This speeds up focused research.
          </span>
          <span className={styles.cardCta}>Start researching →</span>
        </button>

        <button className={styles.card} onClick={() => onNavigate('ipa')}>
          <span className={styles.cardNum}>Approach Two</span>
          <span className={styles.cardTitle}>Language Parsing</span>
          <span className={styles.cardBody}>
            Language Parsing provides translating, transcribing, analyzing and
            expansion options specific to common Holocaust-related languages —
            especially Sütterlin script. This speeds up comprehension and opens
            new areas of research. Three services:
          </span>
          <span className={styles.cardList}>
            <span>i. Audio to IPA (International Phonetic Alphabet)</span>
            <span>ii. Document Reader</span>
            <span>iii. Sütterlin Script Translation Chart</span>
          </span>
          <span className={styles.cardCta}>Open the tools →</span>
        </button>
      </div>

      <p className={styles.closing}>Together we will find peace.</p>
    </div>
  )
}
