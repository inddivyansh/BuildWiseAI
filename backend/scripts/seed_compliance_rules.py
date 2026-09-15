"""
Seed script — populate the compliance_rules table with all registered NBC rules.
All rules are initially set to REQUIRES_VERIFICATION per specification.
"""

import asyncio
from datetime import UTC, datetime

from sqlalchemy import select
from app.database import get_session_factory
from app.models.floor_plan_snapshot import ComplianceRule
from engines.compliance.registry import rule_registry


async def seed_rules() -> None:
    factory = get_session_factory()
    rules_meta = rule_registry.list_rules_metadata()
    inserted = 0
    updated = 0

    async with factory() as session:
        for meta in rules_meta:
            rule_id = meta["rule_id"]
            result = await session.execute(
                select(ComplianceRule).where(ComplianceRule.rule_id == rule_id)
            )
            existing = result.scalar_one_or_none()

            if existing:
                existing.title = meta["title"]
                existing.description = meta["description"]
                existing.category = meta["category"]
                existing.severity = meta["severity"]
                existing.regulation_source = meta["regulation_source"]
                existing.parameter = meta.get("parameter")
                existing.unit = meta.get("unit")
                updated += 1
            else:
                new_rule = ComplianceRule(
                    rule_id=rule_id,
                    title=meta["title"],
                    description=meta["description"],
                    category=meta["category"],
                    severity=meta["severity"],
                    regulation_source=meta["regulation_source"],
                    volume=meta.get("volume"),
                    part=meta.get("part"),
                    section=meta.get("section"),
                    clause=meta.get("clause"),
                    source_page=meta.get("source_page"),
                    parameter=meta.get("parameter"),
                    unit=meta.get("unit"),
                    verification_status=meta.get("verification_status", "REQUIRES_VERIFICATION"),
                    is_active=True,
                    rule_version=meta.get("rule_version", "1.0"),
                    created_at=datetime.now(UTC),
                )
                session.add(new_rule)
                inserted += 1

        await session.commit()

    print(f"Compliance rules seeded successfully: {inserted} inserted, {updated} updated.")


if __name__ == "__main__":
    asyncio.run(seed_rules())
