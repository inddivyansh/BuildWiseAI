"""
Geometric Measurement Extractor — Extracts deterministic physical dimensions from CGM and Graph.

Computes:
- Wall lengths
- Door clear widths
- Corridor clear widths
- Room areas, widths, lengths, aspect ratios
- Staircase widths
- Window opening areas & fenestration ratios
- Egress travel distance paths (with exact coordinate polylines)
- Dead-end corridor segment lengths
- Exit counts and reachability
"""

from __future__ import annotations

import math
import uuid
from typing import Any, Optional

from shapely.geometry import Point, Polygon

from engines.geometry.models import (
    CanonicalFloorPlan,
    ConfidenceLevel,
    OpeningType,
    RoomType,
)
from engines.graph.builder import FloorPlanGraph, FloorPlanGraphBuilder
from engines.measurements.contracts import GeometricMeasurement


def _euclidean_dist(p1: tuple[float, float], p2: tuple[float, float]) -> float:
    return math.sqrt((p2[0] - p1[0]) ** 2 + (p2[1] - p1[1]) ** 2)


class GeometricMeasurementExtractor:
    """Extracts verified geometric measurements from CanonicalFloorPlan and FloorPlanGraph."""

    @classmethod
    def extract_all(
        cls,
        cgm: CanonicalFloorPlan,
        graph: Optional[FloorPlanGraph] = None,
    ) -> list[GeometricMeasurement]:
        """Extract all physical measurements across all floors."""
        measurements: list[GeometricMeasurement] = []

        if graph is None:
            builder = FloorPlanGraphBuilder()
            graph = builder.build(cgm)

        for floor in cgm.floors:
            # 1. Wall Lengths
            for wall in floor.walls:
                conf = wall.confidence.value if hasattr(wall.confidence, "value") else str(wall.confidence)
                label = getattr(wall, "source_layer", getattr(wall, "layer", "wall"))
                if hasattr(wall, "segments") and wall.segments:
                    for s_idx, seg in enumerate(wall.segments):
                        p1 = (seg.start.x, seg.start.y)
                        p2 = (seg.end.x, seg.end.y)
                        length_m = _euclidean_dist(p1, p2)
                        measurements.append(
                            GeometricMeasurement(
                                measurement_id=f"meas-wall-{str(wall.id)[:8]}-{s_idx}",
                                name="Wall Segment Length",
                                category="wall_length",
                                value=length_m,
                                unit="m",
                                confidence=conf,
                                entity_type="wall",
                                entity_id=str(wall.id),
                                entity_label=label,
                                measurement_method="euclidean_endpoints",
                                geometry_references=[[p1[0], p1[1]], [p2[0], p2[1]]],
                                floor_level=floor.level,
                            )
                        )
                elif hasattr(wall, "start") and hasattr(wall, "end"):
                    p1 = (wall.start.x, wall.start.y)
                    p2 = (wall.end.x, wall.end.y)
                    length_m = _euclidean_dist(p1, p2)
                    measurements.append(
                        GeometricMeasurement(
                            measurement_id=f"meas-wall-{str(wall.id)[:8]}",
                            name="Wall Length",
                            category="wall_length",
                            value=length_m,
                            unit="m",
                            confidence=conf,
                            entity_type="wall",
                            entity_id=str(wall.id),
                            entity_label=label,
                            measurement_method="euclidean_endpoints",
                            geometry_references=[[p1[0], p1[1]], [p2[0], p2[1]]],
                            floor_level=floor.level,
                        )
                    )

            # 2. Door Clear Widths
            for opening in floor.openings:
                if opening.opening_type in (
                    OpeningType.DOOR,
                    OpeningType.SLIDING_DOOR,
                    OpeningType.DOUBLE_DOOR,
                    OpeningType.EMERGENCY_EXIT,
                ):
                    is_measured = opening.width_m is not None and opening.width_m > 0
                    p_start = [opening.position.x, opening.position.y]
                    p_end = [opening.position.x + (opening.width_m or 0.0), opening.position.y]
                    measurements.append(
                        GeometricMeasurement(
                            measurement_id=f"meas-door-{str(opening.id)[:8]}",
                            name=f"{opening.opening_type.value.replace('_', ' ').title()} Width",
                            category="door_width",
                            value=opening.width_m if is_measured else None,
                            unit="m",
                            confidence=opening.confidence.value if is_measured else "low",
                            entity_type="opening",
                            entity_id=str(opening.id),
                            entity_label=opening.opening_type.value,
                            measurement_method="opening_width_m" if is_measured else "unspecified",
                            geometry_references=[p_start, p_end],
                            metadata={"opening_type": opening.opening_type.value},
                            floor_level=floor.level,
                        )
                    )

            # 3. Room Dimensions (Area, Width, Length, Aspect Ratio)
            for room in floor.rooms:
                poly = room.to_shapely()
                area = room.area_m2
                min_dim: Optional[float] = None
                max_dim: Optional[float] = None
                aspect_ratio: Optional[float] = None
                coords: list[list[float]] = []

                if poly is not None and not poly.is_empty:
                    coords = room.boundary.to_list()
                    rect = poly.minimum_rotated_rectangle
                    r_coords = list(rect.exterior.coords)
                    edge_lengths = [
                        _euclidean_dist(r_coords[i], r_coords[i + 1])
                        for i in range(len(r_coords) - 1)
                    ]
                    if edge_lengths:
                        min_dim = min(edge_lengths)
                        max_dim = max(edge_lengths)
                        if min_dim > 0.001:
                            aspect_ratio = max_dim / min_dim

                # Room Area Measurement
                measurements.append(
                    GeometricMeasurement(
                        measurement_id=f"meas-area-{str(room.id)[:8]}",
                        name=f"{room.label or room.room_type.value.title()} Area",
                        category="room_dimension",
                        value=area,
                        unit="m2",
                        confidence=room.confidence.value,
                        entity_type="room",
                        entity_id=str(room.id),
                        entity_label=room.label or room.room_type.value,
                        measurement_method="polygon_area",
                        geometry_references=coords,
                        metadata={
                            "room_type": room.room_type.value,
                            "min_dimension_m": round(min_dim, 2) if min_dim else None,
                            "max_dimension_m": round(max_dim, 2) if max_dim else None,
                            "aspect_ratio": round(aspect_ratio, 2) if aspect_ratio else None,
                        },
                        floor_level=floor.level,
                    )
                )

                # Corridor Clear Width Measurement (if corridor/lobby)
                if room.room_type in (RoomType.CORRIDOR, RoomType.LOBBY):
                    measurements.append(
                        GeometricMeasurement(
                            measurement_id=f"meas-corridor-{str(room.id)[:8]}",
                            name=f"{room.room_type.value.title()} Clear Width",
                            category="corridor_width",
                            value=min_dim,
                            unit="m",
                            confidence=room.confidence.value,
                            entity_type="corridor",
                            entity_id=str(room.id),
                            entity_label=room.label or "Corridor",
                            measurement_method="minimum_rotated_rectangle",
                            geometry_references=coords,
                            metadata={"length_m": round(max_dim, 2) if max_dim else None},
                            floor_level=floor.level,
                        )
                    )

            # 4. Staircase Dimensions
            for stair in floor.stairs:
                poly = stair.boundary.as_shapely() if hasattr(stair, "boundary") and stair.boundary else None
                s_width: Optional[float] = getattr(stair, "width_m", None)
                s_coords: list[list[float]] = []
                if poly is not None and not poly.is_empty:
                    s_coords = stair.boundary.to_list() if hasattr(stair.boundary, "to_list") else []
                    if s_width is None:
                        rect = poly.minimum_rotated_rectangle
                        edge_lengths = [
                            _euclidean_dist(rect.exterior.coords[i], rect.exterior.coords[i + 1])
                            for i in range(len(rect.exterior.coords) - 1)
                        ]
                        if edge_lengths:
                            s_width = min(edge_lengths)

                conf_val = stair.confidence.value if hasattr(stair.confidence, "value") else str(stair.confidence)
                measurements.append(
                    GeometricMeasurement(
                        measurement_id=f"meas-stair-{str(stair.id)[:8]}",
                        name="Staircase Clear Width",
                        category="stair_width",
                        value=s_width,
                        unit="m",
                        confidence=conf_val,
                        entity_type="stair",
                        entity_id=str(stair.id),
                        entity_label="Internal Staircase",
                        measurement_method="minimum_rotated_rectangle",
                        geometry_references=s_coords,
                        floor_level=floor.level,
                    )
                )

            # 5. Window & Opening Ventilation Areas
            room_polys = {str(r.id): (r, r.to_shapely()) for r in floor.rooms}
            for op in floor.openings:
                if op.opening_type == OpeningType.WINDOW:
                    w_width = op.width_m
                    assumed_height = 1.2  # NBC standard window height recommendation
                    area_m2 = (w_width * assumed_height) if w_width else None

                    # Find containing or adjacent room
                    p_pt = Point(op.position.x, op.position.y)
                    assoc_room: Optional[Any] = None
                    for rid, (r_obj, poly) in room_polys.items():
                        if poly is not None and poly.distance(p_pt) <= 1.0:
                            assoc_room = r_obj
                            break

                    ratio: Optional[float] = None
                    if area_m2 and assoc_room and assoc_room.area_m2 and assoc_room.area_m2 > 0:
                        ratio = area_m2 / assoc_room.area_m2

                    measurements.append(
                        GeometricMeasurement(
                            measurement_id=f"meas-win-{str(op.id)[:8]}",
                            name="Window Opening Area",
                            category="window_opening",
                            value=area_m2,
                            unit="m2",
                            confidence=op.confidence.value,
                            entity_type="opening",
                            entity_id=str(op.id),
                            entity_label="Window",
                            measurement_method="width_times_standard_height_1.2m",
                            geometry_references=[[op.position.x, op.position.y]],
                            metadata={
                                "window_width_m": w_width,
                                "window_height_m": assumed_height,
                                "associated_room_id": str(assoc_room.id) if assoc_room else None,
                                "associated_room_type": assoc_room.room_type.value if assoc_room else None,
                                "ventilation_ratio": round(ratio, 4) if ratio else None,
                            },
                            floor_level=floor.level,
                        )
                    )

            # 6. Exit Count & Reachability
            exit_count = len(floor.exits)
            measurements.append(
                GeometricMeasurement(
                    measurement_id=f"meas-exitcount-fl-{floor.level}",
                    name="Exit Count",
                    category="exit_count",
                    value=float(exit_count),
                    unit="count",
                    confidence="high",
                    entity_type="floor",
                    entity_id=str(floor.level),
                    entity_label=f"Floor {floor.level}",
                    measurement_method="discrete_count",
                    geometry_references=[[e.position.x, e.position.y] for e in floor.exits],
                    metadata={"exit_count": exit_count},
                    floor_level=floor.level,
                )
            )

        # 7. Travel Distance & Egress Routes via NetworkX Spatial Graph
        if graph and graph.nodes and graph.edges:
            cls._extract_graph_routing_measurements(graph, cgm, measurements)

        return measurements

    @classmethod
    def _extract_graph_routing_measurements(
        cls,
        graph: FloorPlanGraph,
        cgm: CanonicalFloorPlan,
        measurements: list[GeometricMeasurement],
    ) -> None:
        """Computes shortest path egress travel distances and dead-end segments."""
        try:
            import networkx as nx
            G = nx.Graph()
            node_lookup: dict[str, Any] = {}
            for n in graph.nodes:
                G.add_node(n.id, centroid=(n.centroid_x, n.centroid_y), type=n.node_type)
                node_lookup[n.id] = n

            for e in graph.edges:
                G.add_edge(e.source_id, e.target_id, weight=e.distance_m)

            exit_nodes = [n.id for n in graph.nodes if n.node_type == "exit"]

            # If no explicit exit nodes, check for stair nodes or exterior doors
            if not exit_nodes:
                exit_nodes = [n.id for n in graph.nodes if n.node_type == "stair"]

            # Calculate shortest travel distance for each room
            room_nodes = [n for n in graph.nodes if n.node_type in ("room", "corridor")]
            for r_node in room_nodes:
                best_distance = float("inf")
                best_path: list[str] = []
                target_exit_id: Optional[str] = None

                for e_node in exit_nodes:
                    if nx.has_path(G, r_node.id, e_node):
                        dist = nx.shortest_path_length(G, r_node.id, e_node, weight="weight")
                        if dist < best_distance:
                            best_distance = dist
                            best_path = nx.shortest_path(G, r_node.id, e_node, weight="weight")
                            target_exit_id = e_node

                is_reachable = best_distance < float("inf")
                path_coords: list[list[float]] = []
                for nid in best_path:
                    n_obj = node_lookup.get(nid)
                    if n_obj:
                        path_coords.append([n_obj.centroid_x, n_obj.centroid_y])

                measurements.append(
                    GeometricMeasurement(
                        measurement_id=f"meas-travel-{r_node.id[:8]}",
                        name=f"Travel Distance: {r_node.label or r_node.room_type or 'Space'}",
                        category="travel_distance",
                        value=best_distance if is_reachable else None,
                        unit="m",
                        confidence=r_node.confidence,
                        entity_type="room",
                        entity_id=r_node.id,
                        entity_label=r_node.label or r_node.room_type,
                        measurement_method="dijkstra_shortest_path",
                        geometry_references=path_coords,
                        metadata={
                            "is_reachable": is_reachable,
                            "destination_exit_id": target_exit_id,
                            "path_nodes": best_path,
                            "hop_count": len(best_path),
                        },
                        floor_level=r_node.floor_level,
                    )
                )

            # Dead-end corridor length detection
            corridor_subgraph = G.subgraph([n.id for n in graph.nodes if n.node_type == "corridor"])
            for c_node_id in corridor_subgraph.nodes:
                # Degree 1 in corridor subgraph indicates a corridor terminus
                if corridor_subgraph.degree(c_node_id) == 1:
                    neighbors = list(corridor_subgraph.neighbors(c_node_id))
                    if neighbors:
                        edge_dist = G[c_node_id][neighbors[0]].get("weight", 0.0)
                        n1 = node_lookup.get(c_node_id)
                        n2 = node_lookup.get(neighbors[0])
                        coords = []
                        if n1 and n2:
                            coords = [[n1.centroid_x, n1.centroid_y], [n2.centroid_x, n2.centroid_y]]

                        measurements.append(
                            GeometricMeasurement(
                                measurement_id=f"meas-deadend-{c_node_id[:8]}",
                                name="Dead-End Corridor Segment",
                                category="dead_end",
                                value=edge_dist,
                                unit="m",
                                confidence="medium",
                                entity_type="corridor",
                                entity_id=c_node_id,
                                entity_label="Dead-End Branch",
                                measurement_method="topological_terminal_branch",
                                geometry_references=coords,
                                metadata={"junction_node_id": neighbors[0]},
                                floor_level=n1.floor_level if n1 else 0,
                            )
                        )
        except Exception:
            pass
