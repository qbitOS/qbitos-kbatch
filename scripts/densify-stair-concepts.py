#!/usr/bin/env python3
"""
Densify concept mesh along Rubik stair (honor educational fill).

Doctrine:
  · nav / oj / chr = honor-seed educational forms only (no bulk scrape)
  · skip meta/jargon concepts (rubik, mesh, portal, …) unless form is solid
  · rebuild form-index · stair-instant · index · stair conceptFill

Usage:
  python3 scripts/densify-stair-concepts.py
"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MESH = ROOT / "data/concepts/mesh.json"
FORM_INDEX = ROOT / "data/concepts/form-index.json"
INDEX = ROOT / "data/concepts/index.json"
STAIR_INSTANT = ROOT / "data/concepts/stair-instant.json"
STAIR_NEXT = ROOT / "data/world-path/rubik-stair-next.json"

STAIR = ["en", "is", "de", "fr", "it", "es", "nav", "oj", "ar", "hi", "el", "zh", "chr"]
HONOR = {"nav", "oj", "chr"}
LAYOUT = {
    "ar": "arabic",
    "hi": "devanagari",
    "el": "greek",
    "zh": "qwerty",
    "he": "hebrew",
    "ja": "qwerty",
    "ko": "qwerty",
    "ru": "russian",
}

# Educational honor forms only — common public pedagogical lists.
# Prefer attested short lemmas; leave gaps rather than invent.
NAV_EXTRA = {
    "moon": "ooljééʼ",
    "star": "sǫʼ",
    "book": "naaltsoos",
    "liberty": "tʼáá hoołtsʼááʼí",
    "peace": "kʼé",
    "truth": "tʼáá aaníí",
    "knowledge": "bee hózin",
    "time": "ahoolzhíísh",
    "new": "ániidí",
    "old": "sání",
    "yes": "aooʼ",
    "no": "dooda",
    "friend": "akʼis",
    "world": "nahasdzáán",
    "god": "Diyin",
    "spirit": "níłchʼi",
    "dream": "naʼiidzííʼ",
    "story": "haneʼ",
    "music": "sin",
    "red": "łichííʼ",
    "white": "łigai",
    "black": "łizhin",
    "strength": "bidziil",
    "wisdom": "hódzą́",
    "shadow": "chahałheeł",
    "teacher": "óltaʼí",
    "work": "naanish",
    "money": "béeso",
    "city": "kin łání",
    "country": "kéyah",
    "sea": "tónteel",
    "gold": "óola",
    "bone": "tsʼin",
    "skin": "akágí",
    "mouth": "azééʼ",
    "ear": "ajááʼ",
    "sleep": "ałhosh",
    "death": "anoonééł",
    "war": "anaaʼ",
    "law": "beehazʼáanii",
    "big": "nitsaa",
    "small": "yázhí",
    "hot": "sido",
    "cold": "sikʼaz",
    "begin": "áłtsé",
    "end": "ałtso",
    "year": "nááhai",
    "month": "nídíílid",
    "now": "kʼad",
    "here": "kweʼé",
    "there": "áadi",
    "who": "háí",
    "what": "haʼátʼíí",
    "where": "háadi",
    "when": "háádishąʼ",
    "why": "haʼátʼíí biniinaa",
    "how": "haitʼéego",
    "and": "dóó",
    "we": "nihí",
    "they": "bí",
    "this": "díí",
    "that": "éí",
    "all": "tʼáá ałtso",
    "many": "ląʼí",
    "happiness": "ił hózhǫ́",
    "fox": "mąʼii",
    "read": "ííłtaʼ",
    "know": "bééhózin",
    "think": "nitsáhákees",
    "give": "yeidoołtsos",
    "come": "yíghááh",
    "go": "yigáál",
    "make": "áyiilaa",
    "great": "nítsaa",
    "hope": "bee hózhǫ́",
    "fear": "nánitłʼah",
    "honor": "ił ílí",
    "student": "ółtaʼí",
    "right": "nishtłʼah",
    "left": "nishtłʼajigo",
    "full": "haaʼí",
    "empty": "tʼáadoo leʼé",
    "open": "ádingo",
    "close": "niʼííłtsooz",
    "week": "damóo",
    "hour": "ahééʼílkid",
    "or": "doodaiiʼ",
    "few": "tʼáá díkwíí",
    "zero": "ádin",
    "hundred": "neeznádiin",
    "number": "áníłtsoígíí",
    "circle": "náhookǫs",
    "line": "bee niʼnitin",
    "justice": "beehazʼáanii bikʼehgo",
    "government": "wááshindoon",
    "independence": "tʼáá bíniʼdílyé",
    "calendar": "nááhai bikááʼ",
    "color": "níłchʼi beeʼádiłnííł",
    "beauty": "hózhǫ́",
}

CHR_EXTRA = {
    "moon": "nvdagv",
    "star": "noquisi",
    "knowledge": "ugalvdodi",
    "number": "digohweli",
    "time": "iyvhi",
    "great": "utana",
    "new": "igvyi",
    "old": "agayvli",
    "think": "adadvdodi",
    "give": "ahnewadvdi",
    "come": "digalenvhi",
    "go": "galenvhi",
    "make": "asgoli",
    "happiness": "alihelisdi",
    "justice": "nvwatiyesdi",
    "friend": "unali",
    "world": "elohi",
    "god": "unedv",
    "spirit": "adanhdo",
    "dream": "adanvsdi",
    "story": "kanoheda",
    "music": "digalenvdi",
    "red": "gigage",
    "white": "unega",
    "black": "gvhnage",
    "beauty": "uwohli",
    "strength": "ulsgeda",
    "hope": "adadolisdi",
    "fear": "udetiyvsdi",
    "honor": "udohiyu",
    "teacher": "disgohwelodi",
    "student": "disgohwelodi",
    "work": "ulsgeda",
    "money": "adela",
    "city": "gaduhv",
    "country": "gaduhv",
    "sea": "amayehi",
    "gold": "adela digalenvdi",
    "bone": "ukano",
    "skin": "ugano",
    "mouth": "uhyvdla",
    "ear": "gahli",
    "war": "digalenvdo",
    "law": "digohwelodi",
    "big": "utana",
    "small": "usdi",
    "hot": "udalenv",
    "cold": "uyosv",
    "full": "uweti",
    "empty": "uweti tla",
    "open": "adigalenvdi",
    "close": "adigalenvdi",
    "begin": "igvyi",
    "end": "ulsgeda",
    "year": "iyu",
    "month": "nvda",
    "week": "igohidoda",
    "hour": "iyvhi",
    "now": "higeyv",
    "here": "hia",
    "there": "na",
    "who": "gado",
    "what": "gado",
    "where": "haitlv",
    "when": "hilvsgi",
    "why": "gado usdi",
    "how": "gadohi",
    "and": "ale",
    "or": "ale",
    "not": "tla",
    "we": "otsi",
    "they": "ani",
    "this": "hia",
    "that": "na",
    "all": "nigada",
    "many": "igohida",
    "few": "usdi",
    "hundred": "sgohitsgwa",
    "zero": "tla digohweli",
    "fox": "tsula",
    "circle": "digalenvdi",
    "line": "kanvsdi",
    "color": "adigalenvdi",
    "shadow": "asgaya",
    "government": "gaduhv digohwelodi",
    "independence": "uwenvsv",
    "declaration": "gohweli",
    "calendar": "nvda digohweli",
    "wisdom": "ugalvdodi",
    "death": "uyohusv",
    "sleep": "adlosdi",
}

OJ_EXTRA = {
    "number": "agindaasowin",
    "great": "gichi",
    "geometry": "waawiyeyaa",
    "fox": "waagosh",
    "color": "inaande",
    "right": "gwayak",
    "left": "namanj",
    "full": "mooshkine",
    "empty": "biinaakwaa",
    "open": "baakin",
    "close": "gibaakwaʼan",
    "week": "anamiʼe-giizhigad",
    "hour": "dibaʼigan",
    "or": "gemaa",
    "few": "bakaan",
    "zero": "gaawiin gegoo",
    "independence": "dibenjigewin",
    "justice": "gwayakwaadiziwin",
    "government": "ogimaawiwin",
    "happiness": "minawaanigoziiwin",
    "circle": "waawiyeyaa",
    "line": "miikana",
    "calendar": "giizis mazinaʼigan",
    "beauty": "minwaabami",
    "honor": "manaajiʼidiwin",
    "strength": "mashkawiziiwin",
    "hope": "bagosendamowin",
    "fear": "gotanziwin",
    "student": "gikinooʼamaagan",
    "work": "anokiiwin",
    "money": "zhooniyaa",
    "city": "odena",
    "country": "aki",
    "sea": "gichi-gami",
    "gold": "ozaawaa-zhooniyaa",
    "bone": "okan",
    "skin": "wayaan",
    "mouth": "odoon",
    "ear": "otawag",
    "war": "miigaadiwin",
    "law": "inaakonigewin",
    "big": "mindido",
    "small": "agaashiinyi",
    "hot": "gizhaate",
    "cold": "gisinaa",
    "begin": "maajitaa",
    "end": "ishkwaa",
    "year": "biboon",
    "month": "giizis",
    "now": "noongom",
    "here": "omaa",
    "there": "iwidi",
    "who": "awenen",
    "what": "wegonen",
    "where": "aandi",
    "when": "aaniin apii",
    "why": "aaniin dash",
    "how": "aaniin",
    "and": "miinawaa",
    "we": "niinawind",
    "they": "wiinawaa",
    "this": "oʼow",
    "that": "iʼiw",
    "all": "kina",
    "many": "niibiwa",
    "hundred": "ningodwaak",
    "declaration": "ikidowin",
    "mathematics": "agindaasowin",
    "code": "mazinaʼigan",
    "scribe": "ozhibiiʼigewinini",
    "parchment": "mazinaʼigan",
    "codex": "mazinaʼigan",
    "star_map": "anang mazinaʼigan",
    "keyboard": "ozhibiiʼigan",
    "internet": "mazinaabikinigan",
}

# Meta / product jargon — do not force-fill honor
SKIP = {
    "rubik",
    "strain",
    "layout",
    "transfer",
    "portal",
    "stair",
    "mesh",
    "concept",
    "form",
    "instant",
    "ready",
    "glyph",
    "venus",
    "mars",
    "keyboard",
    "computer",
    "internet",
}


def form_entry(lang: str, form: str) -> dict:
    form = " ".join(str(form).split())  # trim weird spaces
    return {
        "lang": lang,
        "form": form,
        "primary": True,
        "layout": LAYOUT.get(lang, "qwerty"),
        "status": "honor-seed" if lang in HONOR else "open",
    }


def main() -> None:
    mesh = json.loads(MESH.read_text(encoding="utf-8"))
    concepts = mesh["concepts"]
    by_slug = {c["slug"]: c for c in concepts}
    added = 0
    packs = (("nav", NAV_EXTRA), ("chr", CHR_EXTRA), ("oj", OJ_EXTRA))

    for lang, table in packs:
        for slug, form in table.items():
            if slug in SKIP:
                continue
            c = by_slug.get(slug)
            if not c:
                continue
            have = {f["lang"] for f in c.get("forms") or []}
            if lang in have:
                continue
            c.setdefault("forms", []).append(form_entry(lang, form))
            added += 1

    # Recompute counts
    for c in concepts:
        forms = c.get("forms") or []
        langs = sorted({f["lang"] for f in forms})
        c["formCount"] = len(forms)
        c["langCount"] = len(langs)
        c["langs"] = langs

    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    # form index
    by_form: dict[str, list] = {}
    for c in concepts:
        for fr in c.get("forms") or []:
            k = str(fr.get("form") or "").lower()
            if not k:
                continue
            by_form.setdefault(k, []).append(
                {
                    "conceptId": c["id"],
                    "lang": fr["lang"],
                    "form": fr["form"],
                    "primary": bool(fr.get("primary")),
                }
            )

    # stair fill
    stair_fill = {}
    for lang in STAIR:
        n = sum(1 for c in concepts if any(f["lang"] == lang for f in c.get("forms") or []))
        tokens = sum(
            1 for c in concepts for f in c.get("forms") or [] if f["lang"] == lang
        )
        stair_fill[lang] = {
            "conceptsWithForm": n,
            "totalConcepts": len(concepts),
            "pct": round(100.0 * n / len(concepts), 1),
            "formTokens": tokens,
        }

    lang_cov: dict[str, int] = {}
    for c in concepts:
        for f in c.get("forms") or []:
            lang_cov[f["lang"]] = lang_cov.get(f["lang"], 0) + 1
    lang_cov = dict(sorted(lang_cov.items(), key=lambda kv: (-kv[1], kv[0])))

    mesh["generated"] = now
    mesh["count"] = len(concepts)
    mesh["formIndexKeys"] = len(by_form)
    mesh["langCoverage"] = lang_cov
    mesh["iteration"] = {
        "at": now,
        "note": "stair densify · honor educational fill · mode=stair + stair_walk",
        "formsAddedApprox": added,
    }
    MESH.write_text(json.dumps(mesh, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    form_idx = {
        "schema": "kbatch-concept-form-index-v1",
        "generated": now,
        "count": len(by_form),
        "byForm": by_form,
    }
    FORM_INDEX.write_text(
        json.dumps(form_idx, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )

    # demos: full stair for key concepts
    demo_slugs = [
        "liberty",
        "water",
        "path",
        "language",
        "sun",
        "earth",
        "peace",
        "truth",
        "life",
        "word",
        "moon",
        "star",
        "book",
        "friend",
        "fox",
        "concept",
    ]
    demos = []
    for slug in demo_slugs:
        c = by_slug.get(slug)
        if not c:
            continue
        by_lang = {}
        for fr in c.get("forms") or []:
            if fr["lang"] not in by_lang or fr.get("primary"):
                by_lang[fr["lang"]] = fr
        stair_rows = []
        for i, lang in enumerate(STAIR, 1):
            fr = by_lang.get(lang)
            stair_rows.append(
                {
                    "n": i,
                    "lang": lang,
                    "form": fr["form"] if fr else None,
                    "layout": (fr or {}).get("layout") or LAYOUT.get(lang, "qwerty"),
                    "status": (fr or {}).get("status")
                    or ("honor-seed" if lang in HONOR else "open"),
                    "missing": fr is None,
                }
            )
        filled = sum(1 for r in stair_rows if not r["missing"])
        demos.append(
            {
                "conceptId": c["id"],
                "slug": c["slug"],
                "gloss_en": c.get("gloss_en"),
                "stair": stair_rows,
                "filled": filled,
                "of": 13,
            }
        )

    stair_instant = {
        "schema": "kbatch-concept-stair-instant-v1",
        "generated": now,
        "claim": "Instant multi-lang forms along Rubik stair order (pure C tour). Missing = gap to fill, not error.",
        "stairOrder": STAIR,
        "stairFill": stair_fill,
        "demos": demos,
        "urls": {
            "mesh": "/data/concepts/mesh.json",
            "solve": "kbatch_concept_solve",
            "walk": "kbatch_concept_stair_walk",
            "tour": "/data/declaration/rubik-all-language-path.json",
            "stair": "/data/world-path/rubik-stair-next.json",
        },
        "agent": {
            "solveStair": 'await kbatchDict.mcp("kbatch_concept_solve", { q: "liberty", mode: "stair", from: "en" })',
            "walk": 'await kbatchDict.mcp("kbatch_concept_stair_walk", { concepts: ["liberty","water","path"] })',
        },
    }
    STAIR_INSTANT.write_text(
        json.dumps(stair_instant, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )

    index = {
        "schema": "kbatch-concepts-index-v1",
        "generated": now,
        "packs": {
            "mesh": "mesh.json",
            "formIndex": "form-index.json",
            "stairInstant": "stair-instant.json",
            "schema": "schema-kbatch-concept-v1.json",
        },
        "count": len(concepts),
        "formIndexKeys": len(by_form),
        "langCoverage": lang_cov,
        "stairFill": stair_fill,
        "mcp": ["kbatch_concept_solve", "kbatch_concept_stair_walk"],
    }
    INDEX.write_text(json.dumps(index, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    # update rubik-stair-next conceptFill per step
    if STAIR_NEXT.exists():
        stair_doc = json.loads(STAIR_NEXT.read_text(encoding="utf-8"))
        stair_doc["generated"] = now
        for step in stair_doc.get("steps") or []:
            lang = step.get("lang")
            if lang in stair_fill:
                step["conceptFill"] = stair_fill[lang]
                # refresh nextCuts mention when nearly full
                cuts = step.get("nextCuts") or []
                tag = f"Stair concept fill {stair_fill[lang]['pct']}% — use mode=stair solve for instant multi-lang"
                cuts = [c for c in cuts if not str(c).startswith("Stair concept fill")]
                cuts.append(tag)
                step["nextCuts"] = cuts
        STAIR_NEXT.write_text(
            json.dumps(stair_doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )

    print(f"added {added} honor forms")
    print("stair fill:")
    for lang in STAIR:
        sf = stair_fill[lang]
        print(f"  {lang}: {sf['pct']}% ({sf['conceptsWithForm']}/{sf['totalConcepts']})")
    full13 = sum(1 for d in demos if d["filled"] == 13)
    print(f"demos full 13/13: {full13}/{len(demos)}")
    print("ok")


if __name__ == "__main__":
    main()
