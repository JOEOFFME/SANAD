"use client";

import {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  ReactFlow,
  type Edge,
  type NodeTypes,
} from "@xyflow/react";
import type { AssetOut } from "@/lib/api/types";
import type { LatestReadings } from "@/lib/telemetry";
import { ProcessNode, type ProcessFlowNode } from "./process-node";

export interface TopologyLink {
  source: number;
  target: number;
  relation: string;
}

interface ProcessFlowProps {
  assets: AssetOut[];
  links: TopologyLink[];
  readings: LatestReadings;
  connected: boolean;
}

const nodeTypes: NodeTypes = { process: ProcessNode };

function buildPositions(assets: AssetOut[], links: TopologyLink[]) {
  const levels = new Map(assets.map((asset) => [asset.id, 0]));

  for (let iteration = 0; iteration < assets.length; iteration += 1) {
    for (const link of links) {
      const nextLevel = (levels.get(link.source) ?? 0) + 1;
      levels.set(link.target, Math.max(levels.get(link.target) ?? 0, nextLevel));
    }
  }

  const byLevel = new Map<number, AssetOut[]>();
  for (const asset of assets) {
    const level = levels.get(asset.id) ?? 0;
    byLevel.set(level, [...(byLevel.get(level) ?? []), asset]);
  }

  const positions = new Map<number, { x: number; y: number }>();
  for (const [level, levelAssets] of byLevel) {
    const sorted = [...levelAssets].sort((left, right) => left.id - right.id);
    sorted.forEach((asset, index) => {
      positions.set(asset.id, {
        x: level * 270,
        y: 270 + (index - (sorted.length - 1) / 2) * 300,
      });
    });
  }

  return positions;
}

export function ProcessFlow({ assets, links, readings, connected }: ProcessFlowProps) {
  const positions = buildPositions(assets, links);
  const nodes: ProcessFlowNode[] = assets.map((asset) => ({
    id: String(asset.id),
    type: "process",
    position: positions.get(asset.id) ?? { x: 0, y: 0 },
    data: {
      asset,
      readings: readings.get(asset.id) ?? {},
      connected,
    },
    draggable: false,
    selectable: true,
  }));

  const edges: Edge[] = links.map((link) => ({
    id: `${link.source}-${link.target}`,
    source: String(link.source),
    target: String(link.target),
    type: "smoothstep",
    markerEnd: { type: MarkerType.ArrowClosed, color: "#64748b" },
    style: { stroke: "#64748b", strokeWidth: 2 },
    animated: connected,
  }));

  return (
    <div className="h-[560px] min-h-[480px] w-full bg-[#eef2f4]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.13, maxZoom: 1 }}
        minZoom={0.35}
        maxZoom={1.5}
        nodesConnectable={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Lines}
          gap={24}
          size={1}
          color="#d9e0e5"
        />
        <Controls
          showInteractive={false}
          className="!overflow-hidden !rounded-md !border !border-slate-300 !shadow-sm"
        />
      </ReactFlow>
    </div>
  );
}
