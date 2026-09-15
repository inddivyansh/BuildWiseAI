"""
Floor-Plan Graph Engine — NetworkX-based room connectivity.

Builds a spatial graph from a CanonicalFloorPlan:
  Nodes: rooms, corridors, stairs, exits, lobbies
  Edges: door connections, stair connections, passage connections

Provides:
  - Graph construction from CGM
  - Connected component analysis
  - BFS/Dijkstra shortest path
  - Exit reachability analysis (every room reachable from at least one exit)
  - Room connectivity queries

The graph is fully decoupled from FastAPI routes and HTTP.
It operates on CanonicalFloorPlan objects only.
"""

from __future__ import annotations

import math
import uuid
from dataclasses import dataclass, field
from typing import Any, Optional

from app.logging_config import get_logger
from engines.geometry.models import (
    CanonicalFloorPlan,
    CGMExit,
    CGMFloor,
    CGMOpening,
    CGMRoom,
    CGMStair,
    ConfidenceLevel,
    ExitType,
    OpeningType,
    RoomType,
)

logger = get_logger(__name__)

try:
    import networkx as nx
    NX_AVAILABLE = True
except ImportError:
    NX_AVAILABLE = False
    logger.warning("networkx not installed — graph analysis unavailable")


# ─── Graph Node/Edge data models ──────────────────────────

@dataclass
class GraphNode:
    id: str                      # UUID string
    node_type: str               # room | stair | exit | corridor | lobby
    label: Optional[str]
    room_type: Optional[str]
    area_m2: Optional[float]
    centroid_x: float
    centroid_y: float
    floor_level: int
    confidence: str


@dataclass
class GraphEdge:
    source_id: str
    target_id: str
    edge_type: str               # door | passage | stair | inferred
    width_m: Optional[float]
    floor_levels: list[int]
    distance_m: float


@dataclass
class FloorPlanGraph:
    """
    Complete graph representation of a floor plan.
    Serializable to JSON for storage / API response.
    """
    nodes: list[GraphNode] = field(default_factory=list)
    edges: list[GraphEdge] = field(default_factory=list)
    is_fully_connected: bool = False
    exit_count: int = 0
    rooms_without_exit_access: list[str] = field(default_factory=list)
    connected_components: int = 0

    def to_dict(self) -> dict:
        return {
            "nodes": [
                {
                    "id": n.id,
                    "type": n.node_type,
                    "label": n.label,
                    "room_type": n.room_type,
                    "area_m2": n.area_m2,
                    "centroid": {"x": n.centroid_x, "y": n.centroid_y},
                    "floor_level": n.floor_level,
                    "confidence": n.confidence,
                }
                for n in self.nodes
            ],
            "edges": [
                {
                    "source": e.source_id,
                    "target": e.target_id,
                    "type": e.edge_type,
                    "width_m": e.width_m,
                    "floor_levels": e.floor_levels,
                    "distance_m": round(e.distance_m, 3),
                }
                for e in self.edges
            ],
            "stats": {
                "node_count": len(self.nodes),
                "edge_count": len(self.edges),
                "is_fully_connected": self.is_fully_connected,
                "exit_count": self.exit_count,
                "connected_components": self.connected_components,
                "rooms_without_exit_access": self.rooms_without_exit_access,
            },
        }


def _distance(ax: float, ay: float, bx: float, by: float) -> float:
    return math.sqrt((bx - ax) ** 2 + (by - ay) ** 2)


def _room_centroid(room: CGMRoom) -> tuple[float, float]:
    verts = room.boundary.vertices
    return (
        sum(v.x for v in verts) / len(verts),
        sum(v.y for v in verts) / len(verts),
    )


def _stair_centroid(stair: CGMStair) -> tuple[float, float]:
    verts = stair.boundary.vertices
    return (
        sum(v.x for v in verts) / len(verts),
        sum(v.y for v in verts) / len(verts),
    )


class FloorPlanGraphBuilder:
    """
    Builds a FloorPlanGraph from a CanonicalFloorPlan.

    Connection strategy:
    1. Each room becomes a graph node
    2. Each stair/exit becomes a graph node
    3. Doors/openings create edges between adjacent rooms
       (adjacency = opening position is within threshold of room centroids)
    4. If no explicit openings: connect rooms that share an approximate wall
       (centroid distance heuristic — fallback for DXF without door blocks)
    5. Stairs connect floors (Phase 1 single-floor, so connects stair→adjacent rooms)
    """

    # Maximum distance (m) from an opening to connect rooms
    OPENING_MATCH_RADIUS_M = 10.0
    # For fallback: rooms whose centroids are within this distance get connected
    PROXIMITY_EDGE_THRESHOLD_M = 15.0
    # Minimum edge count below which we use proximity fallback
    MIN_EXPLICIT_EDGES = 2

    def build(self, cgm: CanonicalFloorPlan) -> FloorPlanGraph:
        """Build and analyze the complete floor plan graph."""
        if not NX_AVAILABLE:
            logger.warning("networkx unavailable — returning empty graph")
            return FloorPlanGraph()

        graph = nx.Graph()
        graph_data = FloorPlanGraph()
        node_map: dict[str, GraphNode] = {}  # id → GraphNode

        # ─── Add nodes ────────────────────────────────────
        for floor in cgm.floors:
            for room in floor.rooms:
                nid = str(room.id)
                cx, cy = _room_centroid(room)
                node = GraphNode(
                    id=nid,
                    node_type="corridor" if room.room_type == RoomType.CORRIDOR else "room",
                    label=room.label,
                    room_type=room.room_type.value,
                    area_m2=room.area_m2,
                    centroid_x=cx,
                    centroid_y=cy,
                    floor_level=floor.level,
                    confidence=room.confidence.value,
                )
                graph.add_node(nid, **{k: v for k, v in node.__dict__.items() if k != "id"})
                node_map[nid] = node
                graph_data.nodes.append(node)

            for stair in floor.stairs:
                nid = str(stair.id)
                cx, cy = _stair_centroid(stair)
                node = GraphNode(
                    id=nid,
                    node_type="stair",
                    label="Staircase",
                    room_type="stairwell",
                    area_m2=stair.boundary.area,
                    centroid_x=cx,
                    centroid_y=cy,
                    floor_level=floor.level,
                    confidence=stair.confidence.value,
                )
                graph.add_node(nid, **{k: v for k, v in node.__dict__.items() if k != "id"})
                node_map[nid] = node
                graph_data.nodes.append(node)

            for exit_ in floor.exits:
                nid = str(exit_.id)
                node = GraphNode(
                    id=nid,
                    node_type="exit",
                    label=exit_.exit_type.value,
                    room_type=None,
                    area_m2=None,
                    centroid_x=exit_.position.x,
                    centroid_y=exit_.position.y,
                    floor_level=floor.level,
                    confidence=exit_.confidence.value,
                )
                graph.add_node(nid, **{k: v for k, v in node.__dict__.items() if k != "id"})
                node_map[nid] = node
                graph_data.nodes.append(node)

        # ─── Add edges from openings ───────────────────────
        edges_added = 0
        for floor in cgm.floors:
            node_ids_on_floor = [
                n.id for n in graph_data.nodes if n.floor_level == floor.level
            ]
            room_nodes = [
                n for n in graph_data.nodes
                if n.floor_level == floor.level and n.node_type in ("room", "corridor")
            ]

            for opening in floor.openings:
                # Find the two closest rooms to this opening
                ox, oy = opening.position.x, opening.position.y
                candidates = sorted(
                    room_nodes,
                    key=lambda n: _distance(n.centroid_x, n.centroid_y, ox, oy),
                )
                if len(candidates) >= 2:
                    a, b = candidates[0], candidates[1]
                    dist = _distance(a.centroid_x, a.centroid_y, b.centroid_x, b.centroid_y)
                    if dist < self.OPENING_MATCH_RADIUS_M * 2:
                        edge_type = (
                            "door" if opening.opening_type == OpeningType.DOOR else "passage"
                        )
                        if not graph.has_edge(a.id, b.id):
                            graph.add_edge(a.id, b.id, type=edge_type, width_m=opening.width_m)
                            edge = GraphEdge(
                                source_id=a.id,
                                target_id=b.id,
                                edge_type=edge_type,
                                width_m=opening.width_m,
                                floor_levels=[floor.level],
                                distance_m=dist,
                            )
                            graph_data.edges.append(edge)
                            edges_added += 1

            # ─── Fallback: proximity-based edges ──────────
            if edges_added < self.MIN_EXPLICIT_EDGES and len(room_nodes) > 1:
                logger.info(
                    "No explicit openings detected — using proximity-based room connectivity",
                    floor_level=floor.level,
                )
                for i, a in enumerate(room_nodes):
                    for b in room_nodes[i + 1:]:
                        dist = _distance(a.centroid_x, a.centroid_y, b.centroid_x, b.centroid_y)
                        if dist < self.PROXIMITY_EDGE_THRESHOLD_M and not graph.has_edge(a.id, b.id):
                            graph.add_edge(a.id, b.id, type="inferred", width_m=None)
                            edge = GraphEdge(
                                source_id=a.id,
                                target_id=b.id,
                                edge_type="inferred",
                                width_m=None,
                                floor_levels=[floor.level],
                                distance_m=dist,
                            )
                            graph_data.edges.append(edge)

            # ─── Connect exits to nearest rooms ───────────
            exit_nodes = [
                n for n in graph_data.nodes
                if n.floor_level == floor.level and n.node_type == "exit"
            ]
            for exit_node in exit_nodes:
                if room_nodes:
                    nearest = min(
                        room_nodes,
                        key=lambda n: _distance(n.centroid_x, n.centroid_y, exit_node.centroid_x, exit_node.centroid_y),
                    )
                    dist = _distance(nearest.centroid_x, nearest.centroid_y, exit_node.centroid_x, exit_node.centroid_y)
                    if not graph.has_edge(nearest.id, exit_node.id):
                        graph.add_edge(nearest.id, exit_node.id, type="exit_connection")
                        graph_data.edges.append(GraphEdge(
                            source_id=nearest.id,
                            target_id=exit_node.id,
                            edge_type="exit_connection",
                            width_m=None,
                            floor_levels=[floor.level],
                            distance_m=dist,
                        ))

            # ─── Connect stairs to nearest rooms ──────────
            stair_nodes = [
                n for n in graph_data.nodes
                if n.floor_level == floor.level and n.node_type == "stair"
            ]
            for stair_node in stair_nodes:
                nearby = [
                    n for n in room_nodes
                    if _distance(n.centroid_x, n.centroid_y, stair_node.centroid_x, stair_node.centroid_y) < self.PROXIMITY_EDGE_THRESHOLD_M
                ]
                for room_node in nearby[:3]:  # Connect to max 3 adjacent rooms
                    dist = _distance(room_node.centroid_x, room_node.centroid_y, stair_node.centroid_x, stair_node.centroid_y)
                    if not graph.has_edge(room_node.id, stair_node.id):
                        graph.add_edge(room_node.id, stair_node.id, type="stair")
                        graph_data.edges.append(GraphEdge(
                            source_id=room_node.id,
                            target_id=stair_node.id,
                            edge_type="stair",
                            width_m=None,
                            floor_levels=[floor.level],
                            distance_m=dist,
                        ))

        # ─── Graph analysis ────────────────────────────────
        if graph.number_of_nodes() > 0:
            components = list(nx.connected_components(graph))
            graph_data.connected_components = len(components)
            graph_data.is_fully_connected = len(components) == 1

            # Exit reachability: which rooms cannot reach any exit?
            exit_ids = {n.id for n in graph_data.nodes if n.node_type == "exit"}
            room_ids = {n.id for n in graph_data.nodes if n.node_type == "room"}
            graph_data.exit_count = len(exit_ids)

            rooms_without_access = []
            for room_id in room_ids:
                if not any(
                    nx.has_path(graph, room_id, eid)
                    for eid in exit_ids
                    if eid in graph
                ):
                    rooms_without_access.append(room_id)
            graph_data.rooms_without_exit_access = rooms_without_access

        logger.info(
            "Floor plan graph built",
            nodes=len(graph_data.nodes),
            edges=len(graph_data.edges),
            components=graph_data.connected_components,
            fully_connected=graph_data.is_fully_connected,
            exits=graph_data.exit_count,
        )

        return graph_data


def compute_shortest_path(
    graph_dict: dict,
    source_id: str,
    target_id: str,
) -> Optional[list[str]]:
    """
    Compute shortest path between two nodes from a graph dict.
    Returns list of node IDs, or None if no path exists.
    """
    if not NX_AVAILABLE:
        return None
    G = nx.Graph()
    for edge in graph_dict.get("edges", []):
        G.add_edge(edge["source"], edge["target"], weight=edge.get("distance_m", 1.0))
    try:
        return nx.shortest_path(G, source=source_id, target=target_id, weight="weight")
    except (nx.NetworkXNoPath, nx.NodeNotFound):
        return None
