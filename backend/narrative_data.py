"""Loads the curated archive, routing, and timeline data for Narrative Guidance.

Data files live alongside the other backend data in ./data (same convention as
document_analysis_service.py's glossary).
"""

import json
from pathlib import Path

DATA_DIR = Path(__file__).parent / "data"


def _load(name: str) -> dict:
    with open(DATA_DIR / name, "r", encoding="utf-8") as f:
        return json.load(f)


ARCHIVES = _load("archives.json")["archives"]
ROUTING = _load("routing.json")
TIMELINE = _load("timeline.json")["events"]

ARCHIVES_BY_ID = {a["id"]: a for a in ARCHIVES}


def archives_reference_block() -> str:
    """A compact, model-readable description of every trusted archive."""
    lines = []
    for a in ARCHIVES:
        secondary = " (secondary source)" if a.get("secondary") else ""
        cost = a.get("cost", "unknown")
        lines.append(
            f"- [{a['id']}] {a['name']}{secondary}\n"
            f"  URL: {a['url']}\n"
            f"  Country: {a['country']} | Cost: {cost}\n"
            f"  Covers: {a['covers']}\n"
            f"  Best for: {', '.join(a['best_for'])}"
        )
    return "\n".join(lines)


def routing_reference_block() -> str:
    region = "\n".join(
        f"- {region}: {', '.join(ids)}"
        for region, ids in ROUTING["by_region"].items()
    )
    theme = "\n".join(
        f"- {theme}: {', '.join(ids)}"
        for theme, ids in ROUTING["by_theme"].items()
    )
    return f"By region:\n{region}\n\nBy theme:\n{theme}"


def timeline_reference_block() -> str:
    lines = []
    for e in TIMELINE:
        lines.append(
            f"- {e['date']} | {e['location']} | {e['title']}: {e['description']} "
            f"(archives: {', '.join(e['archives'])})"
        )
    return "\n".join(lines)
