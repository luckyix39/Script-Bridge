# Peace Together

## Why Peace Together Exists

Holocaust survivors who can speak firsthand to family names, birthplaces, and histories are in their final years. Researchers and descendants trying to reconstruct those histories — in online databases, digitized records, and physical archives — often hit a wall at names. A surname spelled phonetically by an immigration officer, a village recorded in one language and searched in another, a handwritten entry in old German cursive: small transcription differences can break a search entirely.

Peace Together was built out of an interest in language and mathematics — in how sound, spelling, and script relate across languages — and it turned into something useful for people doing this kind of research.

## What It Does

Peace Together offers two complementary approaches to Holocaust and WWII family-history research, reached from a landing page and a top-level navigation.

### Approach One — Narrative Guidance to Holocaust Databases

Describe a relative in plain language and an AI research assistant (powered by [Claude](https://www.anthropic.com/claude)) helps you find and search the right Holocaust archives:

- **Conversational intake** — asks one or two focused clarifying questions when you've given little to go on (name and spelling variants, places lived, approximate dates, known fate)
- **Honest, tagged findings** — every statement is marked `confirmed` (an actual record or established fact), `inferred` (historically likely but not a found record), `next_step` (a concrete place to look), or `historical` (general WWII/Holocaust context). The assistant never fabricates records and never invents precise convoy, transport, document, or prisoner numbers
- **Personal + historical timeline** — interleaves the person's life events with the historical events that shaped them, each linked to relevant archives
- **Curated archive routing** — points you to specific trusted archives (Yad Vashem, Arolsen, USHMM, EHRI, JewishGen, Mémorial de la Shoah, and more), listing free archives first, with help on shifting Central/Eastern European place names and borders
- **Private by design** — nothing is stored server-side; download your session as JSON to resume later, or export a PDF report

### Approach Two — Language Parsing

Takes spoken audio, typed text, or a photo of a historical document and helps you understand how a name sounds and how it might be spelled across languages:

- **IPA transcription** — converts speech or text to the International Phonetic Alphabet, a universal notation for pronunciation
- **Spelling variants** — shows how a name or word would be written across dozens of languages and writing systems, powered by Claude AI
- **Document reader** — extracts, transcribes, and translates scanned or photographed WWII-era German documents, cross-referenced against a 4,300+ entry ITS archive glossary
- **Sütterlin decoder** — reads the old German cursive script common in 19th and early 20th century records

## How It Works

**Language Parsing:**

1. Audio is sent to a FastAPI backend
2. [OpenAI Whisper](https://github.com/openai/whisper) transcribes the speech and detects the language
3. [phonemizer](https://github.com/bootphon/phonemizer) (via espeak-ng) converts the text to IPA
4. For spelling variants and document analysis, [Claude](https://www.anthropic.com/claude) (Haiku and Opus) generates results
5. Results are displayed side by side in the browser

**Narrative Guidance:**

The full conversation is sent to the `/research` endpoint each turn (nothing is persisted server-side). Claude (`claude-sonnet-4-6`) is given the curated archive list, region/theme routing, and a seed timeline, then returns either a clarifying question or structured findings — a narrative, a tagged timeline, and archive pointers — which the browser renders and can export to PDF.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) 24+
- [Docker Compose](https://docs.docker.com/compose/) v2
- An [Anthropic API key](https://console.anthropic.com/) (required for spelling variants and document analysis)
- ~4 GB free disk space (Docker images + Whisper model cache)
- ~2 GB RAM

## Quick Start

```bash
git clone https://github.com/luckyix39/Script-Bridge.git
cd Script-Bridge
ANTHROPIC_API_KEY=your_key_here docker compose up --build
```

Then open **http://localhost** in your browser.

> **First run:** The Whisper `small` model (~244 MB) is downloaded automatically on first startup. This can take 1–5 minutes depending on your connection speed.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Powers Narrative Guidance, spelling variants, document reader, and Sütterlin decoder |
| `WHISPER_MODEL` | No | Whisper model size (default: `small`) |

## Switching Whisper Models

Edit `docker-compose.yml` and change the `WHISPER_MODEL` environment variable:

| Model | Size | Speed | Accuracy |
|-------|------|-------|----------|
| `tiny` | 75 MB | Fastest | Lower |
| `base` | 140 MB | Fast | Good |
| `small` | 244 MB | Moderate | **Default** |
| `medium` | 1.5 GB | Slow | Better |
| `large-v3` | 2.9 GB | Slowest | Best |

## Supported Languages

35+ languages including English, French, German, Spanish, Italian, Portuguese, Dutch, Polish, Russian, Chinese (Mandarin), Japanese, Korean, Arabic, Hindi, Turkish, Hebrew, and more.

## Deploying to Railway

Both the backend and frontend are designed to run as separate Railway services.

### Backend

1. Create a new Railway project and add a service pointed at the `backend/` directory
2. Set the following environment variable in Railway:
   - `ANTHROPIC_API_KEY` — your Anthropic API key
3. Railway will build using `backend/Dockerfile` and expose the FastAPI service

### Frontend

1. Add a second service to the same Railway project pointed at the `frontend/` directory
2. Railway will build using `frontend/Dockerfile` (multi-stage: builds React with Vite, serves with Nginx)
3. The Nginx config proxies `/api` requests to the backend service URL — update `frontend/nginx.conf.template` with your Railway backend URL if you redeploy to a new project

> The frontend's Nginx config currently proxies to a specific Railway backend hostname. If you fork this project and deploy fresh, update that hostname before building.

## Local Development (without Docker)

### Backend

```bash
# Install system dependencies (macOS)
brew install espeak-ng ffmpeg

# Install system dependencies (Ubuntu/Debian)
sudo apt-get install espeak-ng ffmpeg libsndfile1

cd backend
python -m venv .venv && source .venv/bin/activate
pip install torch --index-url https://download.pytorch.org/whl/cpu
pip install -r requirements.txt
ANTHROPIC_API_KEY=your_key_here uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** — the Vite dev server proxies `/api` to `http://localhost:8000`.

## Project Structure

```
Script-Bridge/
├── backend/
│   ├── main.py                       # FastAPI app, all endpoints
│   ├── transcriber.py                # Whisper model singleton
│   ├── phonemizer_service.py         # Text → IPA conversion
│   ├── spellings_service.py          # Claude-powered spelling variants
│   ├── document_analysis_service.py  # Claude document OCR + translation
│   ├── sutterlin_service.py          # Claude Sütterlin decoder
│   ├── narrative_service.py          # Claude research orchestration (Narrative Guidance)
│   ├── narrative_data.py             # Loads curated archives / routing / timeline
│   ├── data/
│   │   ├── its_glossary.json         # 4,327 ITS archive glossary entries
│   │   ├── sutterlin_chart.png       # Reference chart for letter forms
│   │   ├── archives.json             # 15 curated Holocaust archives
│   │   ├── routing.json              # Region/theme → archive routing
│   │   └── timeline.json             # 29 key historical events (1933–1952)
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── types.ts
│   │   ├── pages/
│   │   │   ├── Landing.tsx           # Mission + two-approach landing page
│   │   │   ├── NarrativeGuidance.tsx # Research chat, findings, PDF, save/resume
│   │   │   ├── DocumentReader.tsx
│   │   │   └── SuttterlinReader.tsx
│   │   └── components/
│   │       ├── FileUpload.tsx
│   │       ├── MicRecorder.tsx
│   │       ├── IPADisplay.tsx
│   │       ├── SpellingVariants.tsx
│   │       └── Nav.tsx
│   ├── nginx.conf.template
│   └── Dockerfile
└── docker-compose.yml
```

## API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/transcribe` | POST | Upload audio file → transcript + IPA |
| `/phonemize` | POST | Text → IPA |
| `/spellings` | POST | IPA + transcript → spelling variants across languages |
| `/spellings/alternatives` | POST | Spelling variants for a specific language |
| `/analyze-document` | POST | Image → transcription + translation + document analysis |
| `/decode-sutterlin` | POST | Image → decoded Sütterlin text |
| `/research` | POST | Conversation → clarifying question or structured research findings (Narrative Guidance) |
| `/health` | GET | Liveness check + model load status |
| `/languages` | GET | List of supported languages |
