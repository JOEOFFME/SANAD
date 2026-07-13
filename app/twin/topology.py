"""
Cascade/topology engine.
Answers: "if asset X fails, what's downstream?" and simulates propagation.
Pure graph logic — client-agnostic, works on whatever TopologyEdge rows exist.
"""

from sqlalchemy.orm import Session
from app.models import Asset, TopologyEdge
from typing import List, Dict


def get_downstream(db: Session, asset_id: int, hops: int = 1) -> List[Dict]:
    """FR5: N-hop downstream check."""
    visited = set()
    frontier = [asset_id]
    result = []

    for _ in range(hops):
        edges = db.query(TopologyEdge).filter(
            TopologyEdge.from_asset_id.in_(frontier)
        ).all()
        if not edges:
            break

        next_frontier = []
        for edge in edges:
            if edge.to_asset_id not in visited:
                visited.add(edge.to_asset_id)
                asset = db.query(Asset).get(edge.to_asset_id)
                result.append({
                    "asset_id": asset.id,
                    "code": asset.code,
                    "name": asset.name,
                    "relation": edge.relation,
                })
                next_frontier.append(edge.to_asset_id)
        frontier = next_frontier

    return result


def get_upstream(db: Session, asset_id: int, hops: int = 1) -> List[Dict]:
    """Reverse traversal — what feeds INTO this asset."""
    visited = set()
    frontier = [asset_id]
    result = []

    for _ in range(hops):
        edges = db.query(TopologyEdge).filter(
            TopologyEdge.to_asset_id.in_(frontier)
        ).all()
        if not edges:
            break

        next_frontier = []
        for edge in edges:
            if edge.from_asset_id not in visited:
                visited.add(edge.from_asset_id)
                asset = db.query(Asset).get(edge.from_asset_id)
                result.append({
                    "asset_id": asset.id,
                    "code": asset.code,
                    "name": asset.name,
                    "relation": edge.relation,
                })
                next_frontier.append(edge.from_asset_id)
        frontier = next_frontier

    return result


def simulate_cascade_failure(db: Session, asset_id: int, max_hops: int = 5) -> Dict:
    """FR6 groundwork: full downstream chain if asset_id jams/fails."""
    chain = []
    frontier = [asset_id]
    visited = {asset_id}

    for hop in range(max_hops):
        edges = db.query(TopologyEdge).filter(
            TopologyEdge.from_asset_id.in_(frontier)
        ).all()
        if not edges:
            break

        hop_assets = []
        next_frontier = []
        for edge in edges:
            if edge.to_asset_id not in visited:
                visited.add(edge.to_asset_id)
                asset = db.query(Asset).get(edge.to_asset_id)
                hop_assets.append({"code": asset.code, "name": asset.name})
                next_frontier.append(edge.to_asset_id)

        if not hop_assets:
            break
        chain.append({"hop": hop + 1, "affected": hop_assets})
        frontier = next_frontier

    root = db.query(Asset).get(asset_id)
    return {
        "source_asset": root.code,
        "cascade_chain": chain,
        "total_hops_affected": len(chain),
    }
