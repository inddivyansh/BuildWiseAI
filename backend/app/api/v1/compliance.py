"""Compliance API — rule registry"""

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Annotated

from app.database import get_db_session
from app.models.compliance_rule import ComplianceRule

router = APIRouter()
DbSession = Annotated[AsyncSession, Depends(get_db_session)]


@router.get("/rules/", summary="List all active compliance rules")
async def list_rules(db: DbSession):
    """Return all active compliance rules with their verification status."""
    result = await db.execute(
        select(ComplianceRule).where(ComplianceRule.is_active == True).order_by(ComplianceRule.category, ComplianceRule.rule_id)
    )
    rules = result.scalars().all()
    return {"total": len(rules), "rules": rules}


@router.get("/rules/{rule_id}", summary="Get compliance rule detail")
async def get_rule(rule_id: str, db: DbSession):
    """Get a specific compliance rule by ID, including verification status."""
    from fastapi import HTTPException
    result = await db.execute(select(ComplianceRule).where(ComplianceRule.rule_id == rule_id))
    rule = result.scalar_one_or_none()
    if not rule:
        raise HTTPException(status_code=404, detail=f"Rule {rule_id} not found")
    return rule
