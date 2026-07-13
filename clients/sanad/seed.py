"""
Sanad Mining — client-specific seed data.
Real asset names/topology live here, kept out of the generic core.
"""
from app.database import SessionLocal, Base,engine
from app.models import Asset, TopologyEdge
"""
Sanad Mining — client-specific seed data.
Real asset names/topology live here, kept out of the generic core.
"""

from app.database import SessionLocal, Base, engine
from app.models import Asset, TopologyEdge
from app import models  # ensures models are registered before create_all

# Make sure tables exist
Base.metadata.create_all(bind=engine)

db = SessionLocal()

# Wipe existing Sanad data if re-running (avoids duplicate rows on reseed)
db.query(TopologyEdge).delete()
db.query(Asset).delete()
db.commit()

assets = {
    "TREMIE": ("Trémie tampon", "hopper"),
    "FEED_CONV": ("Convoyeur d'alimentation", "conveyor"),
    "HP400": ("Concasseur HP400", "crusher"),
    "HP300": ("Concasseur HP300", "crusher"),
    "CRIBLE": ("Crible MF1861-2", "screen"),
    "CONV_A": ("Convoyeur A (existant)", "conveyor"),
    "CONV_B": ("Convoyeur B (90ml, nouveau)", "conveyor"),
}

objs = {}
for code, (name, asset_type) in assets.items():
    a = Asset(code=code, name=name, asset_type=asset_type)
    db.add(a)
    objs[code] = a

db.commit()
for a in objs.values():
    db.refresh(a)  # populate .id after commit

edges = [
    ("TREMIE", "FEED_CONV"),
    ("FEED_CONV", "HP400"),
    ("FEED_CONV", "HP300"),
    ("HP400", "CRIBLE"),
    ("HP300", "CRIBLE"),
    ("CRIBLE", "CONV_A"),
    ("CRIBLE", "CONV_B"),
]

for from_code, to_code in edges:
    db.add(TopologyEdge(
        from_asset_id=objs[from_code].id,
        to_asset_id=objs[to_code].id,
        relation="feeds_into"
    ))

db.commit()
print(f"Seeded {len(assets)} assets and {len(edges)} topology edges.")
db.close()
