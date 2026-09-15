"""Projects API — CRUD for project management"""

import uuid
from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.database import get_db_session
from app.models.project import Project
from app.schemas.project import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    ProjectListResponse,
)
from app.logging_config import get_logger

router = APIRouter()
logger = get_logger(__name__)

DbSession = Annotated[AsyncSession, Depends(get_db_session)]


@router.get("/", response_model=ProjectListResponse, summary="List all projects")
async def list_projects(db: DbSession, skip: int = 0, limit: int = 20):
    """Return paginated list of projects."""
    result = await db.execute(
        select(Project).order_by(Project.created_at.desc()).offset(skip).limit(limit)
    )
    projects = result.scalars().all()
    return ProjectListResponse(items=projects, total=len(projects))


@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED, summary="Create project")
async def create_project(payload: ProjectCreate, db: DbSession):
    """Create a new project."""
    project = Project(
        id=uuid.uuid4(),
        name=payload.name,
        description=payload.description,
    )
    db.add(project)
    await db.flush()
    await db.refresh(project)
    logger.info("Project created", project_id=str(project.id), name=project.name)
    return project


@router.get("/{project_id}", response_model=ProjectResponse, summary="Get project")
async def get_project(project_id: uuid.UUID, db: DbSession):
    """Get a project by ID."""
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")
    return project


@router.put("/{project_id}", response_model=ProjectResponse, summary="Update project")
async def update_project(project_id: uuid.UUID, payload: ProjectUpdate, db: DbSession):
    """Update a project's name or description."""
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")
    if payload.name is not None:
        project.name = payload.name
    if payload.description is not None:
        project.description = payload.description
    project.updated_at = datetime.now(UTC)
    await db.flush()
    await db.refresh(project)
    return project


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete project")
async def delete_project(project_id: uuid.UUID, db: DbSession):
    """Delete a project and all associated data (cascade)."""
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")
    await db.delete(project)
    logger.info("Project deleted", project_id=str(project_id))
