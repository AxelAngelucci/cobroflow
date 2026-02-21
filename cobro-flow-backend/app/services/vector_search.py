"""Vertex AI Vector Search service with multi-tenant namespace isolation.

Supports two modes:
- VERTEX_LOCAL_VECTOR_STORE=true: Stores embeddings in PostgreSQL, does cosine
  similarity search with numpy. Embeddings still come from Vertex AI.
- VERTEX_LOCAL_VECTOR_STORE=false: Uses Vertex AI Vector Search (production).
"""

from __future__ import annotations

import logging
import uuid
from dataclasses import dataclass

import numpy as np
from sqlalchemy import select
from sqlalchemy.orm import Session
from vertexai.language_models import TextEmbeddingModel, TextEmbeddingInput

from app.core.config import settings
from app.models.ai_agent import AIDocumentChunk
from app.services.document_processor import TextChunk

logger = logging.getLogger(__name__)

EMBEDDING_DIMENSION = 768  # text-embedding-005 outputs 768-dim vectors


@dataclass(frozen=True)
class SearchResult:
    """A single vector search result."""
    datapoint_id: str
    score: float


class VectorSearchService:
    """Manages embeddings and vector search using Vertex AI.

    Every datapoint is scoped to an organization_id for multi-tenant isolation.
    """

    def __init__(self, db: Session | None = None) -> None:
        self._db = db
        self._project = settings.GCP_PROJECT_ID
        self._location = settings.GCP_LOCATION
        self._local_mode = settings.VERTEX_LOCAL_VECTOR_STORE

        import vertexai
        vertexai.init(project=self._project, location=self._location)
        self._embedding_model = TextEmbeddingModel.from_pretrained(
            settings.VERTEX_EMBEDDING_MODEL,
        )

    # ── Embeddings ────────────────────────────────────────────────────

    def embed_texts(self, texts: list[str]) -> list[list[float]]:
        """Generate embeddings for a batch of texts using text-embedding-005."""
        if not texts:
            return []

        inputs = [
            TextEmbeddingInput(text=t, task_type="RETRIEVAL_DOCUMENT")
            for t in texts
        ]
        all_embeddings: list[list[float]] = []
        # Batch by 20 inputs to stay under the 20k token-per-request limit
        # (each chunk ≈ 500 tokens → 20 × 500 = 10k tokens, safe margin)
        for i in range(0, len(inputs), 20):
            batch = inputs[i : i + 20]
            embeddings = self._embedding_model.get_embeddings(batch)
            all_embeddings.extend([e.values for e in embeddings])
        return all_embeddings

    def embed_query(self, query: str) -> list[float]:
        """Generate embedding for a single search query."""
        inputs = [TextEmbeddingInput(text=query, task_type="RETRIEVAL_QUERY")]
        embeddings = self._embedding_model.get_embeddings(inputs)
        return embeddings[0].values

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
        for chunk, embedding in zip(chunks, embeddings):
            dp_id = f"org-{organization_id}_chunk-{uuid.uuid4().hex[:16]}"
            datapoint_ids.append(dp_id)

        if self._local_mode:
            # Store embeddings as numpy bytes in PostgreSQL
            logger.info(
                "LOCAL MODE: storing %d embeddings in PostgreSQL for org=%s",
                len(embeddings), organization_id,
            )
            # Embeddings are stored alongside the chunk in AIDocumentChunk
            # The caller (ai_training.py) handles DB persistence using
            # the returned datapoint_ids + the embeddings from self._last_embeddings
            self._last_embeddings = embeddings
        else:
            self._upsert_to_vertex(organization_id, datapoint_ids, embeddings)

        return datapoint_ids

    def get_last_embeddings(self) -> list[list[float]]:
        """Get the embeddings from the last upsert_chunks call (local mode)."""
        return getattr(self, "_last_embeddings", [])

    def _upsert_to_vertex(
        self,
        organization_id: str,
        datapoint_ids: list[str],
        embeddings: list[list[float]],
    ) -> None:
        """Upsert into Vertex AI Vector Search index."""
        from google.cloud import aiplatform
        from google.cloud.aiplatform.matching_engine import MatchingEngineIndex
        from google.cloud.aiplatform.matching_engine.matching_engine_index_endpoint import (
            Namespace,
        )

        datapoints = []
        for dp_id, embedding in zip(datapoint_ids, embeddings):
            datapoints.append(
                aiplatform.matching_engine.matching_engine_index_endpoint.IndexDatapoint(
                    datapoint_id=dp_id,
                    feature_vector=embedding,
                    restricts=[
                        Namespace(
                            name="organization_id",
                            allow_list=[organization_id],
                        ),
                    ],
                )
            )

        index = MatchingEngineIndex(
            index_name=settings.VERTEX_VECTOR_SEARCH_INDEX_ID,
            project=self._project,
            location=self._location,
        )
        index.upsert_datapoints(datapoints=datapoints)
        logger.info("Upserted %d datapoints to Vertex Search", len(datapoints))

    # ── Search ────────────────────────────────────────────────────────

    def search_context(
        self,
        organization_id: str,
        query: str,
        top_k: int = 5,
        db: Session | None = None,
    ) -> list[SearchResult]:
        """Search for relevant chunks scoped to organization_id."""
        if self._local_mode:
            return self._search_local(organization_id, query, top_k, db or self._db)
        return self._search_vertex(organization_id, query, top_k)

    def _search_local(
        self,
        organization_id: str,
        query: str,
        top_k: int,
        db: Session | None,
    ) -> list[SearchResult]:
        """Cosine similarity search using embeddings stored in PostgreSQL."""
        if db is None:
            logger.warning("No DB session for local vector search")
            return []

        query_embedding = np.array(self.embed_query(query), dtype=np.float32)

        # Load all chunks for this organization that have embeddings
        stmt = select(AIDocumentChunk).where(
            AIDocumentChunk.organization_id == organization_id,
            AIDocumentChunk.embedding_vector.isnot(None),
        )
        chunks = list(db.execute(stmt).scalars().all())

        if not chunks:
            return []

        # Compute cosine similarity
        scored: list[tuple[str, float]] = []
        for chunk in chunks:
            stored_vec = np.frombuffer(chunk.embedding_vector, dtype=np.float32)
            similarity = float(
                np.dot(query_embedding, stored_vec)
                / (np.linalg.norm(query_embedding) * np.linalg.norm(stored_vec) + 1e-10)
            )
            scored.append((chunk.vertex_datapoint_id, similarity))

        scored.sort(key=lambda x: x[1], reverse=True)

        results = [
            SearchResult(datapoint_id=dp_id, score=score)
            for dp_id, score in scored[:top_k]
        ]
        logger.info(
            "LOCAL SEARCH: org=%s query=%r → %d results (top score=%.3f)",
            organization_id, query[:50], len(results),
            results[0].score if results else 0,
        )
        return results

    def _search_vertex(
        self,
        organization_id: str,
        query: str,
        top_k: int,
    ) -> list[SearchResult]:
        """Search using Vertex AI Vector Search endpoint."""
        from google.cloud.aiplatform.matching_engine import MatchingEngineIndexEndpoint
        from google.cloud.aiplatform.matching_engine.matching_engine_index_endpoint import (
            Namespace,
        )

        query_embedding = self.embed_query(query)

        endpoint = MatchingEngineIndexEndpoint(
            index_endpoint_name=settings.VERTEX_VECTOR_SEARCH_ENDPOINT_ID,
            project=self._project,
            location=self._location,
        )

        responses = endpoint.find_neighbors(
            deployed_index_id=self._get_deployed_index_id(endpoint),
            queries=[query_embedding],
            num_neighbors=top_k,
            filter=[
                Namespace(
                    name="organization_id",
                    allow_list=[organization_id],
                ),
            ],
        )

        results: list[SearchResult] = []
        if responses and responses[0]:
            for neighbor in responses[0]:
                results.append(
                    SearchResult(datapoint_id=neighbor.id, score=neighbor.distance)
                )
        return results

    def _get_deployed_index_id(self, endpoint) -> str:
        """Get the first deployed index ID from the endpoint."""
        deployed = endpoint.deployed_indexes
        if not deployed:
            raise RuntimeError(
                f"No indexes deployed on endpoint {settings.VERTEX_VECTOR_SEARCH_ENDPOINT_ID}"
            )
        return deployed[0].id

    # ── Remove ────────────────────────────────────────────────────────

    def remove_datapoints(self, datapoint_ids: list[str]) -> None:
        """Remove datapoints from the index."""
        if not datapoint_ids or self._local_mode:
            return
        from google.cloud.aiplatform.matching_engine import MatchingEngineIndex
        index = MatchingEngineIndex(
            index_name=settings.VERTEX_VECTOR_SEARCH_INDEX_ID,
            project=self._project,
            location=self._location,
        )
        index.remove_datapoints(datapoint_ids=datapoint_ids)
