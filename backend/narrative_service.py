"""Narrative Guidance: Claude research orchestration (intake -> research -> synthesis).

The model is given the curated archive list, geographic/thematic routing, and a seed
timeline of key events. On each turn it either asks a clarifying question (when the user
has given too little to work with) or returns structured findings.

Findings always separate:
  - confirmed   : an actual record or well-established fact
  - inferred    : historically likely given place/date, clearly flagged as inference
  - next_step   : a concrete suggestion of where to look next
  - historical  : general WWII/Holocaust context event

Nothing is stored server-side. The full conversation is passed in by the client each turn.
"""

from __future__ import annotations

import os

import anthropic

from narrative_data import (
    archives_reference_block,
    routing_reference_block,
    timeline_reference_block,
    ARCHIVES_BY_ID,
)

MODEL = "claude-sonnet-4-6"

_client: anthropic.Anthropic | None = None


def _get_client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise RuntimeError("ANTHROPIC_API_KEY environment variable is not set.")
        _client = anthropic.Anthropic(api_key=api_key)
    return _client


# Intake modes — control how aggressively the assistant asks clarifying questions.
# Selected from the hidden UX config in the frontend and passed in per request.
INTAKE_RULES = {
    # Option 1 — current behaviour.
    "standard": (
        "If the user has given very little (e.g. only a name), ask ONE or TWO focused clarifying "
        "questions first — full name and spelling variants, approximate birth year, places lived, and "
        "what is already known about their fate. If you already have enough to be useful, produce "
        "findings even if some details are missing; note what additional detail would help."
    ),
    # Option 2 — minimal: only ever ask about dates and locations.
    "minimal": (
        "Ask a clarifying question ONLY when you are missing the person's approximate DATES (such as a "
        "birth year or the period they were active) or their LOCATIONS (places they lived). Do NOT ask "
        "about anything else — not spelling variants, not their fate, not family relationships. Keep any "
        "clarifying question to a single short question covering just the missing date(s) and/or "
        "place(s). As soon as you have at least an approximate date or place to work from, go straight "
        "to findings. End your findings with a brief closing note telling the user you can give a "
        "fuller, more confident answer if they share more information — especially additional dates and "
        "places."
    ),
    # Option 3 — answer immediately, then OFFER follow-ups; if the user accepts, act like "standard".
    "none": (
        "Do NOT ask any clarifying questions up front. On your FIRST reply, produce findings immediately "
        "from whatever the user has provided, however sparse. End that first reply with a brief, warm "
        "closing note: tell the user you may be able to give a better, more complete answer if they "
        "answer a few short follow-up questions, and ask whether they would like to.\n"
        "IF, in a later turn, the user agrees to answer follow-up questions (e.g. replies 'ok', 'yes', "
        "'sure'), THEN switch to the standard intake behaviour: ask ONE or TWO focused clarifying "
        "questions — full name and spelling variants, approximate birth year, places lived, and what is "
        "already known about their fate — then produce improved findings from their answers."
    ),
}


def _system_prompt(allow_broad_search: bool, intake_mode: str = "standard") -> str:
    intake_rule = INTAKE_RULES.get(intake_mode, INTAKE_RULES["standard"])
    search_rule = (
        "The user has opted in to a BROADER WEB SEARCH. You may use the web_search tool, but "
        "you must still prioritize the curated trusted archives, and you must clearly label any "
        "claim drawn from a non-curated source as less certain."
        if allow_broad_search
        else "Do NOT use outside web sources. Draw only on the curated trusted archives below "
        "and your own historical knowledge. Point the user to specific archives to verify."
    )
    return f"""You are a careful, compassionate research assistant helping members of the public
research family history connected to the Holocaust and the Second World War. This work is
emotionally significant and the subject matter is grave. Be respectful, plain-spoken, and
never sensational.

YOUR MOST IMPORTANT RULE — HONESTY ABOUT CERTAINTY:
You must never fabricate a record or imply you found something you did not. Separate everything
you say into three clearly distinguished kinds of statement:
  • CONFIRMED  — an actual archival record or a well-established historical fact.
  • INFERRED   — historically likely given the person's place and time, but NOT a found record.
                 Always phrase these as inferences (e.g. "Jews deported from France in 1942 were
                 very often held at Drancy first — this is likely but not confirmed for this person").
  • NEXT_STEP  — a concrete suggestion of which archive to search and what to look for.

DO NOT INVENT PRECISE SPECIFICS:
Be especially careful never to manufacture exact details you cannot verify — specific convoy or
transport numbers, exact dates, document or registration numbers, addresses, or prisoner numbers.
These look authoritative and can send a family down a false trail. If you do not have a specific
detail from a record, either omit it or describe the general pattern and tell the user to confirm
the exact figure in the relevant archive (e.g. "deportees from this roundup left on convoys in late
summer 1942 — check the Mémorial de la Shoah for her specific convoy"). Never state a precise number
as if it were established for this person.

ALWAYS CLOSE WITH CAVEATS:
Every set of findings must include a caveats note. State plainly what is uncertain, which parts are
inference rather than confirmed record, and what additional detail from the user would most improve
the search. Never leave this empty.

{search_rule}

PREFER FREE ARCHIVES:
When you suggest where to research, prefer archives marked "Cost: free" and list them first.
Only point the user to a paid archive (e.g. Ancestry) when a free one is unlikely to hold the
record, and say plainly that it is paywalled and that FamilySearch is a free alternative to try first.

PLACE NAMES AND SHIFTING BORDERS (an important way you can help):
Town and city names in Central and Eastern Europe are a frequent source of confusion. Many places
have several names across German, Polish, Hungarian, Yiddish, Russian, and other languages, and
their country changed as borders moved before and after the World Wars (for example, a town that was
in Austria-Hungary, then Czechoslovakia or Romania, and is in Ukraine or Slovakia today). When a user
names a town:
  • Note the likely spelling variants and the languages they come from.
  • State which country the town belonged to in the relevant period versus today, when you can —
    and flag clearly when this is uncertain.
  • Point the user to the JewishGen Gazetteer & Communities Database [jewishgen_gazetteer] to confirm
    the place and find which archives now hold its records.
Treat any uncertain identification as an INFERRED statement, never a confirmed one.

WHEN TO ASK vs. ANSWER:
{intake_rule}

CURATED TRUSTED ARCHIVES (use the bracketed id when citing one):
{archives_reference_block()}

ARCHIVE ROUTING (which archives best fit a region or theme):
{routing_reference_block()}

SEED TIMELINE OF KEY EVENTS (match the person's known places/dates to weave in relevant context):
{timeline_reference_block()}

When you build a timeline, interleave the person's personal events with the relevant historical
events above, so the user sees their relative's life against the events that shaped it. For each
historical event you include, point to the archive(s) where related records may be found.
"""


TOOLS = [
    {
        "name": "ask_clarifying_question",
        "description": "Ask the user one or two focused questions to gather enough detail to research well.",
        "input_schema": {
            "type": "object",
            "properties": {
                "message": {
                    "type": "string",
                    "description": "A short, warm message containing the clarifying question(s).",
                }
            },
            "required": ["message"],
        },
    },
    {
        "name": "submit_findings",
        "description": "Return the structured research result to show the user.",
        "input_schema": {
            "type": "object",
            "properties": {
                "narrative": {
                    "type": "string",
                    "description": "A respectful narrative summary of what is known and likely about the person.",
                },
                "timeline": {
                    "type": "array",
                    "description": "Chronological events, interleaving personal and historical.",
                    "items": {
                        "type": "object",
                        "properties": {
                            "date": {"type": "string", "description": "Year or date, e.g. '1910' or '1942-07-16'. May be approximate."},
                            "title": {"type": "string"},
                            "description": {"type": "string"},
                            "kind": {
                                "type": "string",
                                "enum": ["confirmed", "inferred", "next_step", "historical"],
                                "description": "confirmed=found record/fact; inferred=likely but unverified; next_step=where to look; historical=general WWII/Holocaust context event.",
                            },
                            "archive_ids": {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": "ids of curated archives relevant to this event.",
                            },
                        },
                        "required": ["date", "title", "description", "kind"],
                    },
                },
                "archive_pointers": {
                    "type": "array",
                    "description": "The specific archives the user should search next, with why.",
                    "items": {
                        "type": "object",
                        "properties": {
                            "archive_id": {"type": "string"},
                            "why": {"type": "string", "description": "Why this archive is relevant and what to search for."},
                        },
                        "required": ["archive_id", "why"],
                    },
                },
                "caveats": {
                    "type": "string",
                    "description": "Required. An honest closing note on the limits of these findings: what is uncertain, which parts are inference rather than confirmed record, and what further detail from the user would most help.",
                },
            },
            "required": ["narrative", "timeline", "archive_pointers", "caveats"],
        },
    },
]


def _enrich_archive(archive_id: str) -> dict:
    a = ARCHIVES_BY_ID.get(archive_id)
    if not a:
        return {"id": archive_id, "name": archive_id, "url": None}
    return {"id": a["id"], "name": a["name"], "url": a["url"]}


def run_turn(messages: list, allow_broad_search: bool = False, intake_mode: str = "standard") -> dict:
    """Run one research turn.

    `messages` is the full Anthropic-format conversation passed in by the client
    (role/content dicts). `intake_mode` controls how aggressively the assistant asks
    clarifying questions ("standard", "minimal", or "none"). Returns a dict the
    frontend can render directly.
    """
    client = _get_client()

    tools = list(TOOLS)
    if allow_broad_search:
        tools.append({"type": "web_search_20250305", "name": "web_search", "max_uses": 5})

    response = client.messages.create(
        model=MODEL,
        max_tokens=4096,
        system=_system_prompt(allow_broad_search, intake_mode),
        tools=tools,
        messages=messages,
    )

    for block in response.content:
        if block.type == "tool_use" and block.name == "ask_clarifying_question":
            return {"mode": "clarify", "message": block.input["message"]}
        if block.type == "tool_use" and block.name == "submit_findings":
            data = dict(block.input)
            # Attach full archive metadata (name + url) for the frontend.
            for ev in data.get("timeline", []):
                ev["archives"] = [_enrich_archive(i) for i in ev.get("archive_ids", [])]
            for p in data.get("archive_pointers", []):
                p["archive"] = _enrich_archive(p["archive_id"])
            return {"mode": "result", **data}

    # Fallback: the model replied in plain text without a tool. Treat as a clarifying message.
    text = "".join(b.text for b in response.content if b.type == "text").strip()
    return {"mode": "clarify", "message": text or "Could you tell me a little more about the person you'd like to research?"}
