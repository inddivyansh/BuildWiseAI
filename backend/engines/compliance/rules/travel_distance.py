"""
Rule NBC-4-TD-001: Maximum Travel Distance to Exit.
Reference: National Building Code of India (NBC) 2016, Part 4, Table 5 (Travel Distances).
"""

from __future__ import annotations

import math
from typing import Any, Optional

from engines.compliance.base import ComplianceRule
from engines.compliance.result import (
    ComplianceResultData,
    ResultStatus,
    RuleVerificationStatus,
    Severity,
    ViolationData,
)
from engines.geometry.models import CanonicalFloorPlan, ConfidenceLevel, ExitType, RoomType


class MaxTravelDistanceRule(ComplianceRule):
    rule_id = "NBC-4-TD-001"
    title = "Maximum Travel Distance to Exit"
    description = (
        "Travel distance from any point in a building to the nearest final exit or "
        "enclosed staircase shall not exceed limits prescribed in NBC 2016 Part 4."
    )
    category = "egress"
    severity = Severity.CRITICAL
    regulation_source = "NBC 2016"
    volume = "Volume 1"
    part = "Part 4 (Fire and Life Safety)"
    clause = "Clause 4.4.2.2 & Table 5"
    source_page = 287
    parameter = "max_travel_distance"
    unit = "m"
    verification_status = RuleVerificationStatus.VERIFIED

    # NBC 2016 Part 4 Table 5 verified thresholds:
    DEFAULT_MAX_DISTANCE_NON_SPRINKLERED = 30.0    # 30 meters (Type 1 & 2 construction)
    DEFAULT_MAX_DISTANCE_SPRINKLERED = 45.0        # 45 meters (+50% increase for full sprinkler)

    def evaluate(
        self,
        cgm: CanonicalFloorPlan,
        graph: Optional[Any] = None,
        context: Optional[dict[str, Any]] = None,
    ) -> list[ComplianceResultData]:
        from engines.compliance.recommendations import RecommendationEngine

        is_sprinklered = (context or {}).get("is_sprinklered", False)
        max_allowed_dist = (
            self.DEFAULT_MAX_DISTANCE_SPRINKLERED
            if is_sprinklered
            else self.DEFAULT_MAX_DISTANCE_NON_SPRINKLERED
        )

        results: list[ComplianceResultData] = []

        for floor in cgm.floors:
            # Locate all exits on this floor
            exit_points: list[tuple[float, float, str]] = []
            for ex in floor.exits:
                exit_points.append((ex.position.x, ex.position.y, str(ex.id)))

            # Fallback to emergency doors or stairs if no formal exits
            if not exit_points:
                for opening in floor.openings:
                    if opening.opening_type.value == "emergency_exit":
                        exit_points.append((opening.position.x, opening.position.y, str(opening.id)))
                for stair in floor.stairs:
                    exit_points.append((stair.position.x, stair.position.y, str(stair.id)))

            if not exit_points:
                results.append(
                    ComplianceResultData(
                        rule_id=self.rule_id,
                        status=ResultStatus.INSUFFICIENT_DATA,
                        severity=self.severity,
                        title="Travel Distance Check — No Exits Detected",
                        description=f"Floor level {floor.level} has no identified exit doors or stair cores to measure egress travel distance against.",
                        confidence=ConfidenceLevel.LOW.value,
                        floor_level=floor.level,
                        recommendation="Define at least one building exit or emergency staircase to evaluate egress travel distance.",
                    )
                )
                continue

            # Check if NetworkX graph available for topological routing
            has_nx = False
            nx_graph = None
            node_map = {}
            try:
                import networkx as nx
                if graph and hasattr(graph, "nodes") and hasattr(graph, "edges"):
                    nx_graph = nx.Graph()
                    for n in graph.nodes:
                        nx_graph.add_node(n.id, centroid=(n.centroid_x, n.centroid_y))
                        node_map[n.id] = (n.centroid_x, n.centroid_y)
                    for e in graph.edges:
                        nx_graph.add_edge(e.source_id, e.target_id, weight=e.distance_m)
                    has_nx = True
            except Exception:
                pass

            for room in floor.rooms:
                if room.room_type in (RoomType.CORRIDOR, RoomType.UNKNOWN):
                    continue

                rx, ry = room.boundary.centroid.x, room.boundary.centroid.y
                rid_str = str(room.id)
                travel_dist: float = 0.0
                path_coords: list[list[float]] = []
                is_reachable = True

                # Topological route through graph if available
                if has_nx and nx_graph and rid_str in nx_graph:
                    best_d = float("inf")
                    best_p = []
                    for ex_x, ex_y, eid in exit_points:
                        if eid in nx_graph and nx.has_path(nx_graph, rid_str, eid):
                            d = nx.shortest_path_length(nx_graph, rid_str, eid, weight="weight")
                            if d < best_d:
                                best_d = d
                                best_p = nx.shortest_path(nx_graph, rid_str, eid, weight="weight")

                    if best_d < float("inf") and best_p:
                        travel_dist = round(best_d, 2)
                        for nid in best_p:
                            if nid in node_map:
                                path_coords.append([node_map[nid][0], node_map[nid][1]])
                    else:
                        # Direct Euclidean fallback if disconnected in graph
                        min_direct = min(math.hypot(rx - ex[0], ry - ex[1]) for ex in exit_points)
                        travel_dist = round(min_direct * 1.25, 2)
                        closest_ex = min(exit_points, key=lambda ex: math.hypot(rx - ex[0], ry - ex[1]))
                        path_coords = [[rx, ry], [closest_ex[0], closest_ex[1]]]
                else:
                    # Direct Euclidean with rectilinear factor (1.25x)
                    min_direct = min(math.hypot(rx - ex[0], ry - ex[1]) for ex in exit_points)
                    travel_dist = round(min_direct * 1.25, 2)
                    closest_ex = min(exit_points, key=lambda ex: math.hypot(rx - ex[0], ry - ex[1]))
                    path_coords = [[rx, ry], [closest_ex[0], closest_ex[1]]]

                is_compliant = travel_dist <= max_allowed_dist
                status = self.resolve_status(is_compliant, room.confidence)

                violations: list[ViolationData] = []
                if status in (ResultStatus.FAIL, ResultStatus.UNVERIFIED):
                    violations.append(
                        ViolationData(
                            entity_type="room",
                            entity_id=room.id,
                            geometry_hint="polyline",
                            coordinates=path_coords if len(path_coords) >= 2 else room.boundary.to_list(),
                            label_text=f"Travel {travel_dist:.1f}m > limit {max_allowed_dist:.1f}m",
                            label_position={"x": rx, "y": ry},
                            floor_level=floor.level,
                        )
                    )

                rec = RecommendationEngine.generate(
                    rule_id=self.rule_id,
                    status=status.value if hasattr(status, "value") else status,
                    measured_value=travel_dist,
                    required_value=max_allowed_dist,
                    unit="m",
                )

                results.append(
                    ComplianceResultData(
                        rule_id=self.rule_id,
                        status=status,
                        severity=self.severity,
                        title=f"Travel Distance — {room.label or room.room_type.value.title()}",
                        description=(
                            f"Shortest egress travel route from {room.label or room.room_type.value.title()} "
                            f"to nearest exit is {travel_dist:.1f} m (maximum allowable: {max_allowed_dist:.1f} m)."
                        ),
                        measured_value=travel_dist,
                        required_value=max_allowed_dist,
                        unit="m",
                        regulation_source=f"{self.regulation_source} {self.part}",
                        confidence=room.confidence.value,
                        floor_level=floor.level,
                        recommendation=rec,
                        evidence={
                            "room_id": str(room.id),
                            "room_label": room.label,
                            "measured_distance_m": travel_dist,
                            "max_allowed_m": max_allowed_dist,
                            "path_geometry": path_coords,
                            "is_sprinklered": is_sprinklered,
                        },
                        violations=violations,
                    )
                )

        return results
