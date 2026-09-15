"""
Compliance Rule Registry — Registration and lookup of compliance rule implementations.
"""

from __future__ import annotations

from typing import Any, Optional

from engines.compliance.base import ComplianceRule
from engines.compliance.rules import ALL_RULES


class ComplianceRuleRegistry:
    """Registry maintaining available compliance rule classes."""

    def __init__(self) -> None:
        self._rules: dict[str, type[ComplianceRule]] = {}
        for rule_cls in ALL_RULES:
            self.register(rule_cls)

    def register(self, rule_cls: type[ComplianceRule]) -> None:
        self._rules[rule_cls.rule_id] = rule_cls

    def get_rule(self, rule_id: str) -> Optional[type[ComplianceRule]]:
        return self._rules.get(rule_id)

    def list_rule_classes(self) -> list[type[ComplianceRule]]:
        return list(self._rules.values())

    def list_rules_metadata(self) -> list[dict[str, Any]]:
        return [rule_cls().metadata_dict() for rule_cls in self._rules.values()]

    def instantiate_all(self) -> list[ComplianceRule]:
        return [rule_cls() for rule_cls in self._rules.values()]


# Global registry singleton
rule_registry = ComplianceRuleRegistry()
