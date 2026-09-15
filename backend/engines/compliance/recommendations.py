"""
Deterministic Compliance Recommendation Engine.

Generates precise, actionable architectural recommendations based on mathematical deltas
and verified NBC 2016 statutory requirements.
These templates provide guaranteed statutory correctness; LLM / Gemini may polish prose
without altering numerical thresholds or delta values.
"""

from __future__ import annotations

from typing import Optional


class RecommendationEngine:
    """Generates authoritative deterministic recommendations for compliance outcomes."""

    @classmethod
    def generate_recommendation(
        cls,
        rule_id: str,
        measured: Optional[float] = None,
        required: Optional[float] = None,
        unit: Optional[str] = "m",
        status: Optional[str] = None,
        entity_name: Optional[str] = None,
        context: Optional[dict] = None,
    ) -> str:
        """Convenience method matching parameter names for rule evaluators and tests."""
        if status is None:
            if measured is not None and required is not None:
                status = "PASS" if measured >= required else "FAIL"
            else:
                status = "INSUFFICIENT_DATA"
        ctx = dict(context or {})
        if entity_name and "entity_name" not in ctx:
            ctx["entity_name"] = entity_name
        return cls.generate(
            rule_id=rule_id,
            status=status,
            measured_value=measured,
            required_value=required,
            unit=unit,
            context=ctx,
        )

    @classmethod
    def generate(
        cls,
        rule_id: str,
        status: str,
        measured_value: Optional[float],
        required_value: Optional[float],
        unit: Optional[str] = "m",
        context: Optional[dict] = None,
    ) -> str:
        """
        Generate a deterministic recommendation string.
        """
        unit_str = unit or ""

        if status == "PASS":
            return f"Compliant with statutory standard ({measured_value:.2f} {unit_str} satisfies requirement)."

        if status == "INSUFFICIENT_DATA":
            if measured_value is None:
                return (
                    f"Dimension is unspecified or could not be reliably extracted from the blueprint. "
                    f"Provide explicit CAD dimensions or annotations to verify statutory compliance."
                )
            return (
                "Insufficient geometry or occupancy classification data to definitively evaluate this rule. "
                "Specify required building context."
            )

        if status == "UNVERIFIED":
            return (
                f"Rule '{rule_id}' is marked REQUIRES_VERIFICATION against official NBC 2016 text. "
                f"Statutory compliance review required by a qualified architect before permit submission."
            )

        # Non-compliant / FAIL cases:
        delta = None
        if measured_value is not None and required_value is not None:
            delta = abs(required_value - measured_value)

        # Rule-specific deterministic templates
        if rule_id == "NBC-4-CW-001":  # Corridor Width
            if delta is not None:
                return (
                    f"Increase clear corridor width from {measured_value:.2f} {unit_str} to at least "
                    f"{required_value:.2f} {unit_str} (shortfall of {delta:.2f} {unit_str}), "
                    f"subject to architectural and structural feasibility."
                )
            return f"Ensure corridor maintains an unobstructed clear width of at least {required_value:.2f} {unit_str}."

        if rule_id == "NBC-4-DW-001":  # Door Clear Width
            if delta is not None:
                return (
                    f"Widen door clear opening from {measured_value:.2f} {unit_str} to at least "
                    f"{required_value:.2f} {unit_str} (increase by at least {delta:.2f} {unit_str}) "
                    f"to provide adequate egress capacity."
                )
            return f"Ensure exit doorways provide at least {required_value:.2f} {unit_str} clear width."

        if rule_id == "NBC-4-TD-001":  # Travel Distance
            if delta is not None:
                return (
                    f"Egress travel distance of {measured_value:.2f} {unit_str} exceeds maximum allowable "
                    f"limit of {required_value:.2f} {unit_str} (exceeded by {delta:.2f} {unit_str}). "
                    f"Provide an alternative compliant exit route, introduce a secondary exit stairwell, "
                    f"or equip the building with a full automatic sprinkler system (increasing allowance to 45 m)."
                )
            return "Provide an alternative compliant route or reduce travel distance to within allowable limit."

        if rule_id == "NBC-4-DE-001":  # Dead-End Corridor
            if delta is not None:
                return (
                    f"Dead-end corridor length of {measured_value:.2f} {unit_str} exceeds statutory limit of "
                    f"{required_value:.2f} {unit_str} (exceeded by {delta:.2f} {unit_str}). "
                    f"Reconfigure corridor topology into a continuous loop or provide an exterior exit discharge."
                )
            return "Eliminate dead-end condition or provide second egress direction within allowable limit."

        if rule_id == "NBC-3-RA-001":  # Room Area
            if delta is not None:
                return (
                    f"Expand habitable room floor area from {measured_value:.2f} {unit_str} to at least "
                    f"{required_value:.2f} {unit_str} (deficit of {delta:.2f} {unit_str}) to satisfy "
                    f"NBC 2016 Part 3 minimum habitable spatial standards."
                )
            return f"Increase room floor area to meet minimum standard of {required_value:.2f} {unit_str}."

        if rule_id == "NBC-4-SW-001":  # Staircase Width
            if delta is not None:
                return (
                    f"Widen staircase flight clear width from {measured_value:.2f} {unit_str} to at least "
                    f"{required_value:.2f} {unit_str} (shortfall of {delta:.2f} {unit_str}) to ensure "
                    f"safe vertical evacuation."
                )
            return f"Staircase clear width must be increased to at least {required_value:.2f} {unit_str}."

        if rule_id == "NBC-4-EX-001":  # Exit Count
            req_int = int(required_value) if required_value else 2
            meas_int = int(measured_value) if measured_value else 0
            return (
                f"Floor provides {meas_int} exit(s) but requires at least {req_int} independent, remote exits. "
                f"Design an additional remote enclosed staircase or exterior exit."
            )

        if rule_id == "NBC-8-LU-001":  # Ventilation Ratio
            if delta is not None:
                pct_meas = measured_value * 100
                pct_req = required_value * 100
                return (
                    f"Window fenestration provides {pct_meas:.1f}% of room floor area, falling short of the "
                    f"{pct_req:.1f}% requirement (shortfall of {pct_req - pct_meas:.1f}%). "
                    f"Enlarge window openings or incorporate additional exterior glazing."
                )
            return "Increase aggregate window opening area to at least 10% of room floor area."

        # Generic fallback
        if delta is not None:
            return (
                f"Adjust measurement from {measured_value:.2f} {unit_str} to at least "
                f"{required_value:.2f} {unit_str} (difference of {delta:.2f} {unit_str})."
            )
        return "Modify architectural geometry to satisfy the statutory threshold."
