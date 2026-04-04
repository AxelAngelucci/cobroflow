"""Vector search service using pgvector on Supabase/PostgreSQL.

Embeddings are generated via Google AI Studio (text-embedding-004).
Vector storage and similarity search are handled by pgvector.
"""

from __future__ import annotations

import logging
import uuid
from dataclasses import dataclass

import google.generativeai as genai
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.ai_agent import AIDocumentChunk
from app.services.document_processor import TextChunk

logger = logging.getLogger(__name__)

EMBEDDING_DIMENSION = 768  # text-embedding-004 outputs 768-dim vectors
EMBEDDING_MODEL = "models/gemini-embedding-001"


@dataclass(frozen=True)
class SearchResult:
    """A single vector search result."""
    datapoint_id: str
    score: float


class VectorSearchService:
    """Manages embeddings and vector search using Vertex AI + pgvector.

    Every datapoint is scoped to an organization_id for multi-tenant isolation.
    """

    def __init__(self, db: Session | None = None) -> None:
        self._db = db
        genai.configure(api_key=settings.GEMINI_API_KEY)

    # ── Embeddings ────────────────────────────────────────────────────

    def embed_texts(self, texts: list[str]) -> list[list[float]]:
        """Generate embeddings for a batch of texts using text-embedding-004."""
        if not texts:
            return []

        all_embeddings: list[list[float]] = []
        for text in texts:
            result = genai.embed_content(
                model=EMBEDDING_MODEL,
                content=text,
                task_type="retrieval_document",
                output_dimensionality=EMBEDDING_DIMENSION,
            )
            all_embeddings.append(result["embedding"])
        return all_embeddings

    def embed_query(self, query: str) -> list[float]:
        """Generate embedding for a single search query."""
        result = genai.embed_content(
            model=EMBEDDING_MODEL,
            content=query,
            task_type="retrieval_query",
            output_dimensionality=EMBEDDING_DIMENSION,
        )
        return result["embedding"]

    # ── Upsert ────────────────────────────────────────────────────────

    def upsert_chunks(
        self,
        organization_id: str,
        chunks: list[TextChunk],
        db: Session | None = None,
    ) -> list[str]:
        """Vectorize and upsert chunks.

        Returns the list of generated vertex_datapoint_ids.
        """
        if not chunks:
            return []

        texts = [c.text for c in chunks]
        embeddings = self.embed_texts(texts)

        datapoint_ids: list[str] = []
        for chunk in chunks:
            dp_id = f"org-{organization_id}_chunk-{uuid.uuid4().hex[:16]}"
            datapoint_ids.append(dp_id)

        self._last_embeddings = embeddings
        logger.info(
            "Generated %d embeddings for org=%s",
            len(embeddings), organization_id,
        )
        return datapoint_ids

    def get_last_embeddings(self) -> list[list[float]]:
        """Get the embeddings from the last upsert_chunks call."""
        return getattr(self, "_last_embeddings", [])

    def store_embeddings(
        self,
        chunks: list[AIDocumentChunk],
        embeddings: list[list[float]],
        db: Session,
    ) -> None:
        """Persist embedding vectors directly into pgvector column."""
        for chunk, embedding in zip(chunks, embeddings):
            chunk.embedding_vector = embedding
        db.flush()

    # ── Search ────────────────────────────────────────────────────────

    def search_context(
        self,
        organization_id: str,
        query: str,
        top_k: int = 5,
        db: Session | None = None,
    ) -> list[SearchResult]:
        """Search for relevant chunks scoped to organization_id."""
        return self.search_similar(organization_id, query, top_k, db or self._db)

    def search_similar(
        self,
        organization_id: str,
        query: str,
        top_k: int,
        db: Session | None,
    ) -> list[SearchResult]:
        """Cosine similarity search using pgvector <=> operator."""
        if db is None:
            logger.warning("No DB session for vector search")
            return []

        query_vector = self.embed_query(query)

        stmt = (
            select(AIDocumentChunk)
            .where(AIDocumentChunk.organization_id == organization_id)
            .where(AIDocumentChunk.embedding_vector.isnot(None))
            .order_by(AIDocumentChunk.embedding_vector.op("<=>")(query_vector))
            .limit(top_k)
        )
        chunks = db.execute(stmt).scalars().all()

        results = [
            SearchResult(datapoint_id=chunk.vertex_datapoint_id, score=1.0)
            for chunk in chunks
        ]
        logger.info(
            "PGVECTOR SEARCH: org=%s query=%r → %d results",
            organization_id, query[:50], len(results),
        )
        return results

    # ── Remove ────────────────────────────────────────────────────────

    def remove_datapoints(self, datapoint_ids: list[str]) -> None:
        """No-op: datapoints are removed by deleting the DB rows directly."""
        pass
