# SANADIndus — Progress Log

## Context
Real client project for Sanad Mining (crushing line expansion) via SGS-Tech.
Evolved from a hackathon MVP (formerly "RallyAI") into a production backend
now named SANADIndus. Core code stays client-agnostic; Sanad-specific data
lives isolated in clients/sanad/.

## Confirmed Asset Topology (from Abdellah Ouarraq's email, via Bouchra)
Trémie tampon → Convoyeur d'alimentation → HP400/HP300 (crushers, positions swapped)
→ Crible MF1861-2 (screen) → Conveyor A (existing) + Conveyor B (new, ~90m)

Warning: exact crusher→conveyor routing is inferred, not confirmed — pending Navisworks file.

## Environment
- WSL Ubuntu 24.04 (noble), Python 3.12, venv at ~/projects/SANAD/venv
- PostgreSQL running locally: DB sanaddb, user sanad
- GitHub repo created and pushed (private)

## Architecture (built, no client data required)
app/
├── main.py            # FastAPI entrypoint, creates DB tables on startup
├── config.py          # env-based settings (DB URL etc.)
├── database.py        # SQLAlchemy engine/session
├── models.py           # DB schema: Asset, TopologyEdge, SensorReading, Incident, NodeConfidence
├── schemas.py          # Pydantic request/response validation
├── routers/            # API endpoints (assets, incidents, sensors) — written, not yet wired into main.py
├── agents/             # LangGraph Router/NodeAgent/Predictor — not started
├── rag/                # manual ingestion + FAISS — not started
├── twin/
│   └── topology.py     # cascade/downstream/upstream traversal — DONE
└── services/           # ROI calc, reports — not started

clients/sanad/
├── seed.py             # Sanad asset list + topology edges — DONE
└── manuals/            # source PDFs for RAG — empty, pending client docs

## Status: Core files (were empty, now filled)
config.py     8 lines   DONE
database.py   14 lines  DONE
models.py     46 lines  DONE
main.py       12 lines  DONE
schemas.py    34 lines  DONE

## Next immediate step
Run the seed script to populate the DB with Sanad's assets + topology:
cd ~/projects/SANAD
python -m clients.sanad.seed

Then test cascade logic:
python quick_test_topology.py

## Data still needed from Sanad (blocking further real progress)
- HP400 / HP300 crusher manuals (for per-node RAG)
- Conveyor manuals (existing + new 90m)
- Navisworks file (confirm exact topology/routing)
- Sensor plan: types, ranges, sampling rate (if any already decided)
- Baseline throughput (t/h) and downtime cost (MAD/hour) — needed for ROI module

## What we already have and can use now
- Crible manual (Metso MF1861-2, ZSM-DFM-4120-SC001): full troubleshooting
  tables (symptom→cause→fix), maintenance schedule, oil specs, torque values.
  Ready to seed the Crible node's RAG today — no additional data needed.

## Key working principles (from earlier discussion)
- Core backend must stay company-agnostic; client specifics isolated in clients/<name>/
- Sensor generation isolated behind a single generatereading()-style function for
  easy future swap to real IoT
- Per-node RAG (one FAISS index per asset) outperforms one general agent
- Operator feedback should be descriptive, not binary, to update node confidence

## Progress Updates
(add new entries below, most recent on top)# SANADIndus — Progress Log

## Context
Real client project for Sanad Mining (crushing line expansion) via SGS-Tech.
Evolved from a hackathon MVP (formerly "RallyAI") into a production backend
now named SANADIndus. Core code stays client-agnostic; Sanad-specific data
lives isolated in clients/sanad/.

## Confirmed Asset Topology (from Abdellah Ouarraq's email, via Bouchra)
Trémie tampon → Convoyeur d'alimentation → HP400/HP300 (crushers, positions swapped)
→ Crible MF1861-2 (screen) → Conveyor A (existing) + Conveyor B (new, ~90m)

Warning: exact crusher→conveyor routing is inferred, not confirmed — pending Navisworks file.

## Environment
- WSL Ubuntu 24.04 (noble), Python 3.12, venv at ~/projects/SANAD/venv
- PostgreSQL running locally: DB sanaddb, user sanad
- GitHub repo created and pushed (private)

## Architecture (built, no client data required)
app/
├── main.py            # FastAPI entrypoint, creates DB tables on startup
├── config.py          # env-based settings (DB URL etc.)
├── database.py        # SQLAlchemy engine/session
├── models.py           # DB schema: Asset, TopologyEdge, SensorReading, Incident, NodeConfidence
├── schemas.py          # Pydantic request/response validation
├── routers/            # API endpoints (assets, incidents, sensors) — written, not yet wired into main.py
├── agents/             # LangGraph Router/NodeAgent/Predictor — not started
├── rag/                # manual ingestion + FAISS — not started
├── twin/
│   └── topology.py     # cascade/downstream/upstream traversal — DONE
└── services/           # ROI calc, reports — not started

clients/sanad/
├── seed.py             # Sanad asset list + topology edges — DONE
└── manuals/            # source PDFs for RAG — empty, pending client docs

## Status: Core files (were empty, now filled)
config.py     8 lines   DONE
database.py   14 lines  DONE
models.py     46 lines  DONE
main.py       12 lines  DONE
schemas.py    34 lines  DONE

## Next immediate step
Run the seed script to populate the DB with Sanad's assets + topology:
cd ~/projects/SANAD
python -m clients.sanad.seed

Then test cascade logic:
python quick_test_topology.py

## Data still needed from Sanad (blocking further real progress)
- HP400 / HP300 crusher manuals (for per-node RAG)
- Conveyor manuals (existing + new 90m)
- Navisworks file (confirm exact topology/routing)
- Sensor plan: types, ranges, sampling rate (if any already decided)
- Baseline throughput (t/h) and downtime cost (MAD/hour) — needed for ROI module

## What we already have and can use now
- Crible manual (Metso MF1861-2, ZSM-DFM-4120-SC001): full troubleshooting
  tables (symptom→cause→fix), maintenance schedule, oil specs, torque values.
  Ready to seed the Crible node's RAG today — no additional data needed.

## Key working principles (from earlier discussion)
- Core backend must stay company-agnostic; client specifics isolated in clients/<name>/
- Sensor generation isolated behind a single generatereading()-style function for
  easy future swap to real IoT
- Per-node RAG (one FAISS index per asset) outperforms one general agent
- Operator feedback should be descriptive, not binary, to update node confidence

## Progress Updates
(add new entries below, most recent on top)
### [Milestone] Sensor simulation working end-to-end
- generate_reading(), simulate_and_log(), simulate_all_assets() all verified
- Anomaly injection confirmed: forced HP400 vibration spike (16.91 mm/s vs normal 2-6 range)
- Full 7-asset x 3-sensor-type snapshot logs correctly to sensor_readings table
- Ranges are generic placeholders — swap once real sensor specs come from Sanad
- check_reading(), check_latest_reading(), scan_all_assets() verified
- Correctly distinguishes normal vs anomaly based on latest reading only (not history)
- Severity tiering confirmed: deviation_ratio 2.2 → "high" for forced HP400 vibration spike
- Threshold-based by design — swappable for XGBoost Predictor once real incident data exists
### [Milestone] Full API live via FastAPI /docs
- assets, incidents, sensors routers all wired into main.py
- Confirmed reachable at localhost:8000/docs with all endpoints visible
- System now testable over HTTP, not just terminal scripts
### [Milestone] RAG pipeline validated on Crible (MF1861-2)
- ingest.py + retrieve.py tested end-to-end, FAISS index built
- Query "vibration excessive du crible" (FR) → 3 relevant chunks from EN manual
- Multilingual retrieval confirmed working
- Navisworks .nwd received (94MB) but UNREADABLE: proprietary compressed binary,
  no SDK, no plain strings. Topology stays INFERRED until user exports from
  Navisworks Freedom manually.
- Next: wire retrieve.py into LangGraph NodeAgent
### [Tuning] RAG retrieval — from 20% to 80% Hit Rate@3
- Root causes found and fixed, in order:
  1. IndexFlatL2 on non-normalized embeddings → switched to normalize + IndexFlatIP
  2. Fixed-size chunking (1200 char) split troubleshooting sections mid-table
     → switched to section-header-based chunking (split on "4.5 Loss of...")
  3. Hybrid search (dense + BM25) and cross-encoder reranking tested — modest
     gains, kept hybrid_query as default retrieval function
- Built app/rag/eval.py: Hit Rate@k + MRR against a 5-query ground-truth set
- Final: Hit Rate@3 = 80%, MRR = 0.80 on crible_mf1861
- Remaining miss is a genuine semantic gap ("vibrates irregularly" vs "Unlike
  Movement of the Screen") — acceptable, LLM generation layer should bridge it
- Decision: stop RAG tuning here, move to LLM generation (node_agent → real diagnosis)
### [Fix] Query translation FR→EN before retrieval
- Root cause confirmed: manual is 100% English, dense+BM25 retrieval degrades
  significantly on French queries even when the same content in English scores well
  (e.g. "les ressorts sont cassés" → miss; "springs are broken" → hit rank 1)
- Fix: translate query to English via Groq before hybrid_query call; keep original
  French query for the final LLM answer prompt (user-facing response stays French)
- Validated: "les ressorts du crible sont cassés" now retrieves correct chunk (161,
  full Spring Breakage table) and produces accurate structured diagnosis
- Pipeline now: query (FR) → translate (EN) → hybrid_query → chunks → LLM (context + original FR query) → answer (FR)
## 16/07/2026 — MQTT pipeline validé sur 2 machines physiques séparées

**Architecture testée:**
- Machine A (WSL, cette machine): Mosquitto (Docker) + PostgreSQL + subscriber + dashboard FastAPI/WebSocket
- Machine B (Windows, physiquement séparée): publisher Python autonome (config statique des assets, pas de dépendance DB)

**Réseau:**
- WSL2 utilise un réseau NAT isolé (IP interne type 172.x), inaccessible depuis l'extérieur
- Fix: port forwarding Windows → WSL via `netsh interface portproxy` (ports 1883 MQTT + 5432 Postgres)
- Firewall Windows ouvert sur ces 2 ports (`New-NetFirewallRule`)
- IP réseau réelle utilisée: 192.168.0.109 (Wi-Fi, même LAN que Machine B)

**Résultat:** publisher Machine B → Mosquitto (Machine A) → subscriber (Machine A) → DB → dashboard, confirmé fonctionnel en temps réel.

**Limite connue:** mesure de latence par timestamp comparatif invalide entre les 2 machines (horloges non synchronisées, dérive observée -100ms à -340ms). Débit/absence de backlog confirmés OK par ailleurs. Fix si besoin plus tard: NTP sync (`w32tm /resync /force` côté Windows).

**Fichiers Machine B (non versionnés dans ce repo, à garder en note):**
- `sensor_sim.py` — copie allégée de `app/twin/sensor_sim.py`, sans dépendance DB
- `publisher.py` — config assets statique (ids 8-14, matchant seed.py actuel)

**Prochaines pistes possibles:**
- Reconnecter RAG (manuel Metso) aux anomalies détectées en live
- Exploiter `topology_edges` pour propagation d'impact en cascade dans le dashboard
- Sécuriser MQTT (auth, TLS) — actuellement anonyme
- Purge/rétention des vieilles lectures en DB
