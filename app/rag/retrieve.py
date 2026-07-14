import pickle
from pathlib import Path
from sentence_transformers import SentenceTransformer
import faiss
from rank_bm25 import BM25Okapi
from rank_bm25 import BM25Okapi
import re
from sentence_transformers import CrossEncoder
MODEL = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")


def simple_stem(word: str) -> str:
    word = word.lower()
    for suffix in ("ing", "ies", "es", "s", "ed"):
        if word.endswith(suffix) and len(word) - len(suffix) > 3:
            return word[:-len(suffix)]
    return word

def tokenize(text: str) -> list[str]:
    return [simple_stem(w) for w in re.findall(r"[a-zA-Z]+", text.lower())]

def query_asset(asset_id: str, query: str, k: int = 3, base_dir: str = "clients/sanad/manuals/faiss"):
    asset_dir = Path(base_dir) / asset_id
    index = faiss.read_index(str(asset_dir / "index.faiss"))
    with open(asset_dir / "chunks.pkl", "rb") as f:
        chunks = pickle.load(f)

    q_emb = MODEL.encode([query], normalize_embeddings=True)
    distances, indices = index.search(q_emb, k)
    return [chunks[i] for i in indices[0] if i < len(chunks)]



def query_asset_hybrid(asset_id: str, query: str, k: int = 3, base_dir: str = "clients/sanad/manuals/faiss"):
    asset_dir = Path(base_dir) / asset_id
    index = faiss.read_index(str(asset_dir / "index.faiss"))
    with open(asset_dir / "chunks.pkl", "rb") as f:
        chunks = pickle.load(f)

    q_emb = MODEL.encode([query], normalize_embeddings=True)
    sem_scores, sem_idx = index.search(q_emb, len(chunks))
    sem_rank = {idx: 1/(rank+1) for rank, idx in enumerate(sem_idx[0])}

    tokenized = [c.lower().split() for c in chunks]
    bm25 = BM25Okapi(tokenized)
    bm25_scores = bm25.get_scores(query.lower().split())
    bm25_rank = {i: 1/(rank+1) for rank, i in enumerate(sorted(range(len(chunks)), key=lambda i: -bm25_scores[i]))}

    fused = {i: sem_rank.get(i, 0) + bm25_rank.get(i, 0) for i in range(len(chunks))}
    top = sorted(fused, key=fused.get, reverse=True)[:k]
    return [chunks[i] for i in top]

def hybrid_query(asset_id: str, query: str, k: int = 15, base_dir: str = "clients/sanad/manuals/faiss"):
    asset_dir = Path(base_dir) / asset_id
    index = faiss.read_index(str(asset_dir / "index.faiss"))
    with open(asset_dir / "chunks.pkl", "rb") as f:
        chunks = pickle.load(f)

    q_emb = MODEL.encode([query], normalize_embeddings=True)
    dense_scores, dense_idx = index.search(q_emb, len(chunks))
    dense_rank = {int(idx): 1/(rank+1) for rank, idx in enumerate(dense_idx[0])}
    tokenized = [tokenize(c) for c in chunks]
    bm25 = BM25Okapi(tokenized)
    bm25_scores = bm25.get_scores(tokenize(query))
    bm25_rank = {i: 1/(rank+1) for rank, i in enumerate(
        sorted(range(len(chunks)), key=lambda i: -bm25_scores[i]))}

    combined = {i: dense_rank.get(i, 0) + bm25_rank.get(i, 0) for i in range(len(chunks))}
    top_idx = sorted(combined, key=combined.get, reverse=True)[:k]

    return [chunks[i] for i in top_idx]

RERANKER = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")

def rerank_query(asset_id: str, query: str, k: int = 3, candidate_pool: int = 15, base_dir: str = "clients/sanad/manuals/faiss"):
    candidates = hybrid_query(asset_id, query, k=candidate_pool, base_dir=base_dir)
    pairs = [(query, c) for c in candidates]
    scores = RERANKER.predict(pairs)
    ranked = [c for _, c in sorted(zip(scores, candidates), key=lambda x: -x[0])]
    return ranked[:k]


if __name__ == "__main__":
    results = query_asset("crible_mf1861", "le crible s'arrête tout seul, surchauffe du mécanisme")
    for r in results:
        print("---\n", r)
