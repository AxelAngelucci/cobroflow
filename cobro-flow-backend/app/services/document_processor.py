"""Document processing service for chunking training documents."""

from __future__ import annotations

import csv
import io
import logging
from dataclasses import dataclass

from langchain_text_splitters import RecursiveCharacterTextSplitter
from tiktoken import encoding_for_model

logger = logging.getLogger(__name__)

TIKTOKEN_ENCODING = encoding_for_model("gpt-4")


@dataclass(frozen=True)
class TextChunk:
    """A single chunk of text extracted from a document."""
    text: str
    index: int
    metadata: dict


class DocumentProcessor:
    """Processes documents into token-limited chunks for vectorization."""

    def __init__(
        self,
        max_tokens: int = 500,
        overlap_tokens: int = 50,
    ) -> None:
        self._splitter = RecursiveCharacterTextSplitter.from_tiktoken_encoder(
            encoding_name="cl100k_base",  # GPT-4 encoding
            chunk_size=max_tokens,
            chunk_overlap=overlap_tokens,
            separators=["\n\n", "\n", ". ", " ", ""],
        )

    def process_text(self, text: str, source_name: str = "text") -> list[TextChunk]:
        """Split plain text into chunks."""
        if not text or not text.strip():
            return []
        docs = self._splitter.create_documents(
            [text],
            metadatas=[{"source": source_name, "type": "text"}],
        )
        return [
            TextChunk(
                text=doc.page_content,
                index=i,
                metadata={**doc.metadata, "chunk_index": i},
            )
            for i, doc in enumerate(docs)
        ]

    def process_pdf(self, file_bytes: bytes, source_name: str = "pdf") -> list[TextChunk]:
        """Extract text from PDF and chunk it."""
        from PyPDF2 import PdfReader

        reader = PdfReader(io.BytesIO(file_bytes))
        pages_text: list[str] = []
        for page_num, page in enumerate(reader.pages):
            page_text = page.extract_text() or ""
            if page_text.strip():
                pages_text.append(page_text)

        full_text = "\n\n".join(pages_text)
        if not full_text.strip():
            logger.warning("PDF %s has no extractable text", source_name)
            return []

        docs = self._splitter.create_documents(
            [full_text],
            metadatas=[{"source": source_name, "type": "pdf", "total_pages": len(reader.pages)}],
        )
        return [
            TextChunk(
                text=doc.page_content,
                index=i,
                metadata={**doc.metadata, "chunk_index": i},
            )
            for i, doc in enumerate(docs)
        ]

    def process_docx(self, file_bytes: bytes, source_name: str = "docx") -> list[TextChunk]:
        """Extract text from DOCX and chunk it."""
        from docx import Document

        doc = Document(io.BytesIO(file_bytes))
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        full_text = "\n\n".join(paragraphs)

        if not full_text.strip():
            logger.warning("DOCX %s has no extractable text", source_name)
            return []

        docs = self._splitter.create_documents(
            [full_text],
            metadatas=[{"source": source_name, "type": "docx"}],
        )
        return [
            TextChunk(
                text=doc.page_content,
                index=i,
                metadata={**doc.metadata, "chunk_index": i},
            )
            for i, doc in enumerate(docs)
        ]

    def process_csv(self, file_bytes: bytes, source_name: str = "csv") -> list[TextChunk]:
        """Convert CSV rows to text and chunk them."""
        text_content = file_bytes.decode("utf-8", errors="replace")
        reader = csv.DictReader(io.StringIO(text_content))

        rows_text: list[str] = []
        for row in reader:
            row_str = " | ".join(f"{k}: {v}" for k, v in row.items() if v)
            if row_str.strip():
                rows_text.append(row_str)

        full_text = "\n".join(rows_text)
        if not full_text.strip():
            logger.warning("CSV %s has no rows", source_name)
            return []

        docs = self._splitter.create_documents(
            [full_text],
            metadatas=[{"source": source_name, "type": "csv", "total_rows": len(rows_text)}],
        )
        return [
            TextChunk(
                text=doc.page_content,
                index=i,
                metadata={**doc.metadata, "chunk_index": i},
            )
            for i, doc in enumerate(docs)
        ]

    def process_file(
        self,
        file_bytes: bytes,
        file_type: str,
        source_name: str = "document",
    ) -> list[TextChunk]:
        """Route to the correct processor based on file_type."""
        file_type = file_type.lower().strip().lstrip(".")
        processors = {
            "pdf": self.process_pdf,
            "docx": self.process_docx,
            "csv": self.process_csv,
            "txt": lambda b, s: self.process_text(b.decode("utf-8", errors="replace"), s),
            "text": lambda b, s: self.process_text(b.decode("utf-8", errors="replace"), s),
        }
        processor = processors.get(file_type)
        if processor is None:
            logger.warning("Unsupported file type: %s – treating as plain text", file_type)
            return self.process_text(file_bytes.decode("utf-8", errors="replace"), source_name)
        return processor(file_bytes, source_name)

    @staticmethod
    def count_tokens(text: str) -> int:
        """Count tokens in text using GPT-4 encoding."""
        return len(TIKTOKEN_ENCODING.encode(text))
