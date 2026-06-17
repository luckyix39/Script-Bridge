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
          Holocaust databases. There is no charge to use the Peace Together tools.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.h}>The Problem</h2>
        <p>
           It is a race against time to answer important lingering questions about Holocaust victims as survivors with firsthand 
          knowledge are reaching their final years. Although general events and locations are 
          well-documented, details about specific individuals 
          remains buried underneath mountains of confusing documentation systems, 
          sometimes written in different languages, which leaves too many significant questions unanswered. 
        
   
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.h}>The Solution</h2>
        <p>
          Peace Together harnesses artificial intelligence to weave and parse through the mountain of 
          documentation in order to expedite focused research 
          and provide actionable next steps towards finding detailed answers.         </p>
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
            The Ai-Assisted Narrative Guidance to Holocaust Databases speeds-up focused research. It is completely free to use. To use the tool you:
           i) First, you type any information you might know about an individual research subject 
            ii) Then, based upon that information, the Ai-assistant provides a hypothetical narrative with links to databases to guide your focused research
            step-by-step through the major Holocaust databases. 
            
          </span>
          <span className={styles.cardCta}>Click this button to take you to the page with the Narrative Guidance to Holocaust Databases tool</span>
        </button>

        <button className={styles.card} onClick={() => onNavigate('ipa')}>
          <span className={styles.cardNum}>Approach Two</span>
          <span className={styles.cardTitle}>Language Parsing</span>
          <span className={styles.cardBody}>
            The Language Parsing tools speeds up comprehension and opens
            new areas of research. It is completely free to use. The tools provide translating, transcribing, analyzing and
            expansion options specific to common Holocaust-related languages —
            especially Sütterlin script. There are three Language Parsing services:
          </span>
          <span className={styles.cardList}>
            <span>i. Audio to IPA (International Phonetic Alphabet)</span>
            <span>ii. Document Reader</span>
            <span>iii. Sütterlin Script Translation</span>
          </span>
          <span className={styles.cardCta}>Click this button to take you to the page with the Language Parsing tools</span>
        </button>
      </div>

      <p className={styles.closing}>Peace Together. Harnessing the speed and power of artificial intelligence to weave each individual story depicting the Holocaust. </p>
    </div>
  )
}
