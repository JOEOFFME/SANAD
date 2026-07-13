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
