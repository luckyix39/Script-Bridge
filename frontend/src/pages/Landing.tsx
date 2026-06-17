import type { Page } from '../components/Nav'
import styles from './Landing.module.css'

interface Props {
  onNavigate: (page: Page) => void
}

export default function Landing({ onNavigate }: Props) {
  return (
    <div className={styles.landing}>
      <p className={styles.lede}>
        This site is under construction.
      </p>

      <section className={styles.section}>
        <h2 className={styles.h}>Mission</h2>
        <p>
          
          Peace Together (PT) aims to assist heirs and 
          any researcher (even those without historical knowledge) 
          to find and to execute focused research within historical 
          Holocaust databases.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.h}>The Problem</h2>
        <p>
           Although general Holocaust events and locations are 
          well-documented, details about many specific individuals 
          remains buried underneath mountains of confusing documentation systems, 
          sometimes written in different languages, which leaves many important questions unanswered. 
          Further, it is a race against time to answer these important lingering questions as Holocaust survivors with firsthand 
          knowledge are reaching their final years.
   
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.h}>The Solution</h2>
        <p>
          Peace Together harnesses artificial intelligence to weave and parse through the mountain of 
          documentation in order to expedite focused research 
          and provide actionable next steps.
        </p>
        <p className={styles.subtle}>
          Peace Together offers two main search approaches — choose one to begin:
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
            Ai-Assisted Narrative Guidance to Holocaust Databases speeds-up focused research by:
           i) First, you type any information you might know about an individual research subject 
            ii) Then, based upon that information, the Ai assistant provides a hypothetical narrative with links to databases to guide your focused research
            step-by-step through the major Holocaust databases. 
            
          </span>
          <span className={styles.cardCta}>Start researching with Narrative Guidance to Holocaust Databases</span>
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
            <span>iii. Sütterlin Script Translation</span>
          </span>
          <span className={styles.cardCta}>Start researching with Language Parsing</span>
        </button>
      </div>

      <p className={styles.closing}>Peace Together. Harnessing the speed and power of artificial intelligence to weave each individual story depicting the Holocaust. </p>
    </div>
  )
}
