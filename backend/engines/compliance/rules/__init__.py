"""Compliance Rules Package — deterministic regulatory compliance checkers."""

from engines.compliance.rules.corridor_width import MinCorridorWidthRule
from engines.compliance.rules.dead_end import MaxDeadEndCorridorRule
from engines.compliance.rules.door_width import MinDoorWidthRule
from engines.compliance.rules.exit_count import MinExitCountRule
from engines.compliance.rules.room_area import MinRoomAreaRule
from engines.compliance.rules.stair_width import MinStairWidthRule
from engines.compliance.rules.travel_distance import MaxTravelDistanceRule
from engines.compliance.rules.ventilation_ratio import MinVentilationRatioRule

ALL_RULES = [
    MinCorridorWidthRule,
    MinDoorWidthRule,
    MaxTravelDistanceRule,
    MaxDeadEndCorridorRule,
    MinRoomAreaRule,
    MinStairWidthRule,
    MinExitCountRule,
    MinVentilationRatioRule,
]

__all__ = [
    "ALL_RULES",
    "MinCorridorWidthRule",
    "MinDoorWidthRule",
    "MaxTravelDistanceRule",
    "MaxDeadEndCorridorRule",
    "MinRoomAreaRule",
    "MinStairWidthRule",
    "MinExitCountRule",
    "MinVentilationRatioRule",
]
