"""
Okapi BM25 Retrieval Engine for National Building Code Corpus.

Implements the standard BM25 ranking function without requiring heavy external C-extensions:
score(D, Q) = sum( IDF(q_i) * (f(q_i, D) * (k1 + 1)) / (f(q_i, D) + k1 * (1 - b + b * (|D| / avgdl))) )
"""

from __future__ import annotations

import math
import re
from collections import Counter
from typing import Any, Optional


STOPWORDS = {
    "what", "is", "the", "a", "an", "for", "to", "in", "of", "and",
    "under", "does", "say", "about", "which", "are", "by", "on", "as",
    "with", "from", "at", "be", "this", "that", "it", "or", "how",
    "requirement", "requirements",
}


def tokenize(text: str, filter_stopwords: bool = True) -> list[str]:
    """Tokenize and normalize text for BM25 ranking."""
    tokens = re.findall(r"\b[a-zA-Z0-9_\-\.]{2,}\b", text.lower())
    if filter_stopwords:
        filtered = [t for t in tokens if t not in STOPWORDS]
        return filtered if filtered else tokens
    return tokens


class BM25Okapi:
    """Okapi BM25 implementation with stopword dampening and clause token boosting."""

    def __init__(
        self,
        corpus_docs: list[dict[str, Any]],
        text_field: str = "content",
        k1: float = 1.5,
        b: float = 0.75,
    ) -> None:
        self.corpus = corpus_docs
        self.text_field = text_field
        self.k1 = k1
        self.b = b

        self.doc_len: list[int] = []
        self.doc_freqs: list[Counter[str]] = []
        self.idf: dict[str, float] = {}
        self.avg_doc_len: float = 0.0

        self._index_corpus()

    def _index_corpus(self) -> None:
        num_docs = len(self.corpus)
        if num_docs == 0:
            return

        df: Counter[str] = Counter()
        total_tokens = 0

        for doc in self.corpus:
            text = doc.get(self.text_field, "")
            tokens = tokenize(text)
            self.doc_len.append(len(tokens))
            total_tokens += len(tokens)

            tf = Counter(tokens)
            self.doc_freqs.append(tf)
            for token in tf.keys():
                df[token] += 1

        self.avg_doc_len = total_tokens / num_docs if num_docs > 0 else 1.0

        # Compute Robertson-Spärck Jones IDF with smoothing
        for term, freq in df.items():
            self.idf[term] = math.log((num_docs - freq + 0.5) / (freq + 0.5) + 1.0)

    def search(self, query: str, top_k: int = 5) -> list[tuple[dict[str, Any], float]]:
        """Rank documents for a query. Returns list of (document, bm25_score)."""
        query_tokens = tokenize(query)
        if not query_tokens or not self.corpus:
            return []

        scores: list[float] = [0.0] * len(self.corpus)

        for i, tf in enumerate(self.doc_freqs):
            d_len = self.doc_len[i]
            score = 0.0
            for token in query_tokens:
                if token not in tf:
                    continue
                token_freq = tf[token]
                idf_val = self.idf.get(token, 0.0)

                # BM25 term weighting
                numerator = token_freq * (self.k1 + 1.0)
                denominator = token_freq + self.k1 * (1.0 - self.b + self.b * (d_len / self.avg_doc_len))
                term_score = idf_val * (numerator / denominator)

                score += term_score

            scores[i] = score

        ranked_indices = sorted(
            range(len(scores)),
            key=lambda idx: scores[idx],
            reverse=True,
        )

        results = []
        for idx in ranked_indices[:top_k]:
            if scores[idx] > 0.001:
                results.append((self.corpus[idx], round(scores[idx], 4)))

        return results
