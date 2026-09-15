"""Initial database migration — create all tables with pgvector extension"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = '001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ─── Enable pgvector extension ────────────────────────
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")
    op.execute("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\"")

    # ─── Projects ─────────────────────────────────────────
    op.create_table(
        'projects',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    # ─── Uploaded Documents ───────────────────────────────
    op.create_table(
        'uploaded_documents',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('project_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False),
        sa.Column('original_name', sa.String(255), nullable=False),
        sa.Column('storage_key', sa.Text, nullable=False),
        sa.Column('file_format', sa.String(20), nullable=False),
        sa.Column('mime_type', sa.String(100), nullable=True),
        sa.Column('file_size_bytes', sa.BigInteger, nullable=False),
        sa.Column('checksum_sha256', sa.String(64), nullable=True),
        sa.Column('uploaded_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_uploaded_documents_project_id', 'uploaded_documents', ['project_id'])

    # ─── Analysis Runs ────────────────────────────────────
    op.create_table(
        'analysis_runs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('project_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False),
        sa.Column('document_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('uploaded_documents.id'), nullable=False),
        sa.Column('status', sa.String(30), nullable=False, server_default='queued'),
        sa.Column('stage', sa.String(100), nullable=True),
        sa.Column('progress_pct', sa.SmallInteger, nullable=False, server_default='0'),
        sa.Column('error_code', sa.String(50), nullable=True),
        sa.Column('error_message', sa.Text, nullable=True),
        sa.Column('config', postgresql.JSONB, nullable=False, server_default='{}'),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_analysis_runs_project_id', 'analysis_runs', ['project_id'])
    op.create_index('ix_analysis_runs_status', 'analysis_runs', ['status'])

    # ─── Floor Plan Snapshots ─────────────────────────────
    op.create_table(
        'floor_plan_snapshots',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('analysis_run_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('analysis_runs.id', ondelete='CASCADE'), nullable=False, unique=True),
        sa.Column('floor_data', postgresql.JSONB, nullable=False),
        sa.Column('bounding_box', postgresql.JSONB, nullable=False, server_default='{}'),
        sa.Column('floor_count', sa.SmallInteger, nullable=False, server_default='1'),
        sa.Column('total_area_m2', sa.Numeric(10, 2), nullable=True),
        sa.Column('metadata', postgresql.JSONB, nullable=False, server_default='{}'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    # ─── Compliance Rules Registry ────────────────────────
    op.create_table(
        'compliance_rules',
        sa.Column('rule_id', sa.String(50), primary_key=True),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('category', sa.String(50), nullable=False),
        sa.Column('severity', sa.String(20), nullable=False),
        sa.Column('regulation_source', sa.String(100), nullable=False),
        sa.Column('volume', sa.String(10), nullable=True),
        sa.Column('part', sa.String(20), nullable=True),
        sa.Column('section', sa.String(30), nullable=True),
        sa.Column('clause', sa.Text, nullable=True),
        sa.Column('source_page', sa.Integer, nullable=True),
        sa.Column('requirement_text', sa.Text, nullable=True),
        sa.Column('parameter', sa.String(100), nullable=True),
        sa.Column('unit', sa.String(20), nullable=True),
        sa.Column('formula', sa.Text, nullable=True),
        sa.Column('verification_status', sa.String(30), nullable=False, server_default='REQUIRES_VERIFICATION'),
        sa.Column('verified_by', sa.Text, nullable=True),
        sa.Column('verified_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('is_active', sa.Boolean, nullable=False, server_default='true'),
        sa.Column('rule_version', sa.String(20), nullable=False, server_default='1.0'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    # ─── Compliance Results ───────────────────────────────
    op.create_table(
        'compliance_results',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('analysis_run_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('analysis_runs.id', ondelete='CASCADE'), nullable=False),
        sa.Column('rule_id', sa.String(50), sa.ForeignKey('compliance_rules.rule_id'), nullable=False),
        sa.Column('status', sa.String(30), nullable=False),
        sa.Column('severity', sa.String(20), nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('measured_value', sa.Numeric(12, 4), nullable=True),
        sa.Column('required_value', sa.Numeric(12, 4), nullable=True),
        sa.Column('unit', sa.String(20), nullable=True),
        sa.Column('regulation_source', sa.String(100), nullable=True),
        sa.Column('source_page', sa.Integer, nullable=True),
        sa.Column('source_section', sa.String(50), nullable=True),
        sa.Column('evidence', postgresql.JSONB, nullable=True),
        sa.Column('confidence', sa.String(20), nullable=False, server_default='high'),
        sa.Column('recommendation', sa.Text, nullable=True),
        sa.Column('llm_explanation', sa.Text, nullable=True),
        sa.Column('llm_model_used', sa.String(50), nullable=True),
        sa.Column('floor_level', sa.SmallInteger, nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_compliance_results_run_id', 'compliance_results', ['analysis_run_id'])
    op.create_index('ix_compliance_results_status', 'compliance_results', ['status'])
    op.create_index('ix_compliance_results_severity', 'compliance_results', ['severity'])

    # ─── Violations ───────────────────────────────────────
    op.create_table(
        'violations',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('compliance_result_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('compliance_results.id', ondelete='CASCADE'), nullable=False),
        sa.Column('entity_type', sa.String(30), nullable=False),
        sa.Column('entity_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('geometry_hint', sa.String(30), nullable=False),
        sa.Column('coordinates', postgresql.JSONB, nullable=False),
        sa.Column('label_text', sa.String(255), nullable=True),
        sa.Column('label_position', postgresql.JSONB, nullable=True),
        sa.Column('floor_level', sa.SmallInteger, nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_violations_result_id', 'violations', ['compliance_result_id'])

    # ─── Reports ──────────────────────────────────────────
    op.create_table(
        'reports',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('analysis_run_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('analysis_runs.id', ondelete='CASCADE'), nullable=False, unique=True),
        sa.Column('json_storage_key', sa.Text, nullable=True),
        sa.Column('pdf_storage_key', sa.Text, nullable=True),
        sa.Column('summary_stats', postgresql.JSONB, nullable=False, server_default='{}'),
        sa.Column('llm_available', sa.Boolean, nullable=False, server_default='true'),
        sa.Column('generated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    # ─── Regulation Documents ─────────────────────────────
    op.create_table(
        'regulation_documents',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('code', sa.String(50), nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('volume', sa.String(10), nullable=True),
        sa.Column('version', sa.String(20), nullable=False),
        sa.Column('jurisdiction', sa.String(50), nullable=False, server_default='India'),
        sa.Column('storage_key', sa.Text, nullable=False),
        sa.Column('total_pages', sa.Integer, nullable=True),
        sa.Column('total_chunks', sa.Integer, nullable=True),
        sa.Column('ingested_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('is_active', sa.Boolean, nullable=False, server_default='true'),
    )

    # ─── Regulation Chunks with pgvector embedding ────────
    op.create_table(
        'regulation_chunks',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('document_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('regulation_documents.id', ondelete='CASCADE'), nullable=False),
        sa.Column('chunk_index', sa.Integer, nullable=False),
        sa.Column('section_number', sa.String(50), nullable=True),
        sa.Column('section_title', sa.String(255), nullable=True),
        sa.Column('parent_section', sa.String(50), nullable=True),
        sa.Column('page_number', sa.Integer, nullable=True),
        sa.Column('content_type', sa.String(30), nullable=False, server_default='text'),
        sa.Column('raw_text', sa.Text, nullable=False),
        sa.Column('token_count', sa.Integer, nullable=True),
        sa.Column('metadata', postgresql.JSONB, nullable=False, server_default='{}'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint('document_id', 'chunk_index', name='uq_chunk_document_index'),
    )
    op.create_index('ix_regulation_chunks_document_id', 'regulation_chunks', ['document_id', 'section_number'])

    # Add pgvector embedding column separately (requires extension)
    op.execute("ALTER TABLE regulation_chunks ADD COLUMN embedding vector(1024)")
    # HNSW index for fast approximate nearest-neighbor search
    op.execute(
        "CREATE INDEX ix_regulation_chunks_embedding ON regulation_chunks "
        "USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64)"
    )


def downgrade() -> None:
    op.drop_table('regulation_chunks')
    op.drop_table('regulation_documents')
    op.drop_table('reports')
    op.drop_table('violations')
    op.drop_table('compliance_results')
    op.drop_table('compliance_rules')
    op.drop_table('floor_plan_snapshots')
    op.drop_table('analysis_runs')
    op.drop_table('uploaded_documents')
    op.drop_table('projects')
    op.execute("DROP EXTENSION IF EXISTS vector")
