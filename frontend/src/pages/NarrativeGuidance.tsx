import { useEffect, useRef, useState } from 'react'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { jsPDF } from 'jspdf'
import styles from './NarrativeGuidance.module.css'

// --- Types -----------------------------------------------------------------

interface ArchiveRef {
  id: string
  name: string
  url: string | null
}

interface TimelineEvent {
  date: string
  title: string
  description: string
  kind?: string
  archives?: ArchiveRef[]
}

interface ArchivePointer {
  archive_id: string
  why: string
  archive?: ArchiveRef
}

interface ResultData {
  mode: 'result'
  narrative: string
  caveats?: string
  timeline?: TimelineEvent[]
  archive_pointers?: ArchivePointer[]
}

interface ClarifyData {
  mode: 'clarify'
  message: string
}

type ResearchResponse = ResultData | ClarifyData

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const TAG_LABEL: Record<string, string> = {
  confirmed: 'confirmed',
  inferred: 'inferred',
  next_step: 'next step',
  historical: 'historical',
}

// --- Secret UX config: how the assistant handles follow-up questions -------

type IntakeMode = 'standard' | 'minimal' | 'none'

const INTAKE_OPTIONS: { value: IntakeMode; label: string; hint: string }[] = [
  {
    value: 'standard',
    label: 'Option 1 — Standard',
    hint: 'Current behavior: asks one or two focused clarifying questions when little is given.',
  },
  {
    value: 'minimal',
    label: 'Option 2 — Minimal',
    hint: 'Only asks about missing dates and locations, then answers. Closes by inviting more detail.',
  },
  {
    value: 'none',
    label: 'Option 3 — Answer first, then offer',
    hint: 'Answers immediately with no questions, then offers follow-ups. If you accept, it switches to the standard clarifying flow.',
  },
]

const INTAKE_STORAGE_KEY = 'pt_intake_mode'

// --- Markdown helpers ------------------------------------------------------

function mdToSafeHtml(text: string): string {
  const raw = text || ''
  return DOMPurify.sanitize(marked.parse(raw, { async: false }) as string)
}

function stripMd(text: string): string {
  return (text || '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/^\s*[-*]\s+/gm, '• ')
    .replace(/`/g, '')
    .trim()
}

// --- Component -------------------------------------------------------------

export default function NarrativeGuidance() {
  const [conversation, setConversation] = useState<ChatMessage[]>([])
  const [lastResult, setLastResult] = useState<ResultData | null>(null)
  const [input, setInput] = useState('')
  const [broadSearch, setBroadSearch] = useState(false)
  const [busy, setBusy] = useState(false)

  // Secret UX config (toggled with Shift + 0).
  const [showConfig, setShowConfig] = useState(false)
  const [intakeMode, setIntakeMode] = useState<IntakeMode>(() => {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(INTAKE_STORAGE_KEY) : null
    return saved === 'standard' || saved === 'minimal' ? saved : 'none'
  })

  const endRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [conversation, busy])

  // Shift + 0 reveals/hides the hidden config panel.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.shiftKey && e.code === 'Digit0') {
        e.preventDefault()
        setShowConfig((v) => !v)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  function chooseIntakeMode(mode: IntakeMode) {
    setIntakeMode(mode)
    try {
      localStorage.setItem(INTAKE_STORAGE_KEY, mode)
    } catch {
      /* ignore storage failures */
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || busy) return

    const nextConversation: ChatMessage[] = [...conversation, { role: 'user', content: text }]
    setConversation(nextConversation)
    setInput('')
    setBusy(true)

    try {
      const res = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextConversation,
          allow_broad_search: broadSearch,
          intake_mode: intakeMode,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.detail ?? `Server error (${res.status})`)
      }
      const data: ResearchResponse = await res.json()

      if (data.mode === 'clarify') {
        setConversation([...nextConversation, { role: 'assistant', content: data.message }])
      } else {
        setLastResult(data)
        // Keep a compact assistant turn so follow-ups have context.
        setConversation([...nextConversation, { role: 'assistant', content: data.narrative }])
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred.'
      setConversation([
        ...nextConversation,
        {
          role: 'assistant',
          content: `Sorry — something went wrong reaching the research service (${message}). Please check that the backend is running.`,
        },
      ])
    } finally {
      setBusy(false)
    }
  }

  // --- Save / resume (no server storage) ---

  function saveResearch() {
    const payload = {
      version: 1,
      saved_at: new Date().toISOString(),
      conversation,
      lastResult,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `family-history-research-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  function loadResearch(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result))
        setConversation(data.conversation || [])
        setLastResult(data.lastResult || null)
      } catch {
        alert('That file could not be read as a saved research session.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  // --- PDF export ---

  function downloadPdf() {
    if (!lastResult) return
    const doc = new jsPDF({ unit: 'pt', format: 'letter' })
    const margin = 56
    const width = doc.internal.pageSize.getWidth() - margin * 2
    let y = margin

    const line = (
      text: string,
      opts: { size?: number; font?: string; style?: string; gap?: number } = {}
    ) => {
      const size = opts.size || 11
      const font = opts.font || 'helvetica'
      const style = opts.style || 'normal'
      doc.setFont(font, style)
      doc.setFontSize(size)
      const lines = doc.splitTextToSize(text, width)
      lines.forEach((l: string) => {
        if (y > doc.internal.pageSize.getHeight() - margin) {
          doc.addPage()
          y = margin
        }
        doc.text(l, margin, y)
        y += size * 1.4
      })
      y += opts.gap ?? 4
    }

    line('Family History Research', { size: 18, font: 'times', style: 'bold', gap: 2 })
    line('Holocaust & WWII — research leads, not certainties', { size: 10, style: 'italic', gap: 10 })

    line('Summary', { size: 14, font: 'times', style: 'bold' })
    line(stripMd(lastResult.narrative), { gap: 12 })

    if (lastResult.timeline?.length) {
      line('Timeline', { size: 14, font: 'times', style: 'bold' })
      lastResult.timeline.forEach((ev) => {
        line(`${ev.date} — ${ev.title}  [${TAG_LABEL[ev.kind || 'historical'] || 'historical'}]`, {
          style: 'bold',
          gap: 1,
        })
        line(ev.description, { gap: 2 })
        if (ev.archives?.length) {
          line(
            'Related archives: ' +
              ev.archives.map((a) => `${a.name} (${a.url || 'n/a'})`).join('; '),
            { size: 9, style: 'italic', gap: 8 }
          )
        }
      })
      y += 6
    }

    if (lastResult.archive_pointers?.length) {
      line('Where to research next', { size: 14, font: 'times', style: 'bold' })
      lastResult.archive_pointers.forEach((p) => {
        const a = p.archive || ({} as ArchiveRef)
        line(`${a.name || p.archive_id} — ${a.url || ''}`, { style: 'bold', gap: 1 })
        line(p.why, { gap: 8 })
      })
    }

    if (lastResult.caveats) {
      line('A note on certainty', { size: 12, font: 'times', style: 'bold' })
      line(stripMd(lastResult.caveats), { size: 10, style: 'italic' })
    }

    doc.save('family-history-research.pdf')
  }

  // --- Render ---

  return (
    <div className={styles.narrativePage}>
      {showConfig && (
        <section className={styles.config} aria-label="Experimental UX configuration">
          <div className={styles.configHead}>
            <strong>UX experiment — follow-up questions</strong>
            <button
              type="button"
              className={styles.configClose}
              onClick={() => setShowConfig(false)}
              aria-label="Close config"
            >
              ✕
            </button>
          </div>
          <p className={styles.configSub}>
            Controls how the assistant asks clarifying questions. Hidden panel — toggle with Shift + 0.
          </p>
          {INTAKE_OPTIONS.map((opt) => (
            <label key={opt.value} className={styles.configOption}>
              <input
                type="radio"
                name="intakeMode"
                checked={intakeMode === opt.value}
                onChange={() => chooseIntakeMode(opt.value)}
              />
              <span>
                <span className={styles.configLabel}>{opt.label}</span>
                <span className={styles.configHint}>{opt.hint}</span>
              </span>
            </label>
          ))}
        </section>
      )}

      <section className={styles.intro}>
        <p>
          Describe the person you would like to learn about — in your own words. Include whatever you
          know: their name and any spelling variations, when and where they were born, places they
          lived, and what you know of their fate. The assistant will ask a question or two if it needs
          more, then gather what it can from trusted Holocaust archives and point you toward the
          records worth searching.
        </p>
        <p className={styles.privacyNote}>
          <strong>We store nothing.</strong> Nothing you type is saved on our servers. To continue
          later, use <em>Save research</em> to download your session and re-upload it to resume.
        </p>
      </section>

      <section className={styles.conversation} aria-live="polite">
        {conversation.map((m, i) => (
          <div key={i} className={`${styles.bubble} ${m.role === 'user' ? styles.user : styles.assistant}`}>
            <div className={styles.who}>{m.role === 'user' ? 'You' : 'Assistant'}</div>
            {m.role === 'assistant' ? (
              <div dangerouslySetInnerHTML={{ __html: mdToSafeHtml(m.content) }} />
            ) : (
              <div>{m.content}</div>
            )}
          </div>
        ))}
        {busy && (
          <div className={`${styles.bubble} ${styles.assistant}`}>
            <div className={styles.who}>Assistant</div>
            <div className={styles.thinking}>Searching trusted archives</div>
          </div>
        )}
        <div ref={endRef} />
      </section>

      <form className={styles.composer} onSubmit={onSubmit}>
        <label htmlFor="narrativeInput" className={styles.visuallyHidden}>
          Tell us about the person you'd like to research
        </label>
        <textarea
          id="narrativeInput"
          rows={3}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. I'd like to learn about my grandmother. Her name was Jane Dow, born around 1910 in …, she lived in Paris from about 1935, and I believe she died at Auschwitz."
        />
        <div className={styles.composerRow}>
          <label className={styles.broadSearch}>
            <input
              type="checkbox"
              checked={broadSearch}
              onChange={(e) => setBroadSearch(e.target.checked)}
            />
            Also search the wider web
            <span
              className={styles.warn}
              title="Off by default. The curated archives are vetted and trustworthy. Wider web results may be inaccurate or unverified — treat them with extra care."
            >
              ⚠ less reliable
            </span>
          </label>
          <button type="submit" disabled={busy}>
            {busy ? 'Researching…' : conversation.length ? 'Continue research' : 'Begin research'}
          </button>
        </div>
      </form>

      {lastResult && <Results data={lastResult} />}

      <div className={styles.sessionActions}>
        <button type="button" onClick={saveResearch}>
          Save research
        </button>
        <label className={styles.filebtn}>
          Resume saved research
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            hidden
            onChange={loadResearch}
          />
        </label>
        {lastResult && (
          <button type="button" onClick={downloadPdf}>
            Download PDF report
          </button>
        )}
      </div>
    </div>
  )
}

// --- Results subview -------------------------------------------------------

function Tag({ kind }: { kind?: string }) {
  const cls = kind === 'next_step' ? 'next' : kind || 'historical'
  return <span className={`${styles.tag} ${styles['tag_' + cls]}`}>{TAG_LABEL[kind || 'historical'] || 'historical'}</span>
}

function Results({ data }: { data: ResultData }) {
  return (
    <div className={styles.results}>
      <h2 className={styles.resultsH}>Summary</h2>
      <div className={styles.narrative} dangerouslySetInnerHTML={{ __html: mdToSafeHtml(data.narrative) }} />

      {!!data.timeline?.length && (
        <>
          <h2 className={styles.resultsH}>Timeline</h2>
          <ul className={styles.timeline}>
            {data.timeline.map((ev, i) => (
              <li key={i}>
                <span className={`${styles.dot} ${styles['dot_' + (ev.kind || 'historical')]}`} />
                <div>
                  <span className={styles.date}>{ev.date}</span>
                  <span className={styles.evTitle}>{ev.title} </span>
                  <Tag kind={ev.kind} />
                </div>
                <div className={styles.evDesc}>{ev.description}</div>
                {!!ev.archives?.length && (
                  <div className={styles.evArchives}>
                    Related archives:{' '}
                    {ev.archives.map((a, j) => (
                      <span key={j}>
                        {a.url ? (
                          <a href={a.url} target="_blank" rel="noopener">
                            {a.name}
                          </a>
                        ) : (
                          a.name
                        )}
                        {j < ev.archives!.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      {!!data.archive_pointers?.length && (
        <>
          <h2 className={styles.resultsH}>Where to research next</h2>
          <ul className={styles.pointers}>
            {data.archive_pointers.map((p, i) => {
              const a = p.archive || ({} as ArchiveRef)
              return (
                <li key={i}>
                  {a.url ? (
                    <a href={a.url} target="_blank" rel="noopener">
                      {a.name || p.archive_id}
                    </a>
                  ) : (
                    <strong>{a.name || p.archive_id}</strong>
                  )}
                  <div className={styles.why}>{p.why}</div>
                </li>
              )
            })}
          </ul>
        </>
      )}

      {data.caveats && (
        <div className={styles.caveats} dangerouslySetInnerHTML={{ __html: mdToSafeHtml(data.caveats) }} />
      )}
    </div>
  )
}
