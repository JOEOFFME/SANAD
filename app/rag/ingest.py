import os, json, pickle
from pathlib import Path
from pypdf import PdfReader
from sentence_transformers import SentenceTransformer
import faiss
import re 

MODEL = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")

def extract_text(pdf_path: str) -> str:
    reader = PdfReader(pdf_path)
    raw = "\n".join(page.extract_text() or "" for page in reader.pages)
    raw = re.sub(r'[ \t]+', ' ', raw)
    raw = re.sub(r'\n{3,}', '\n\n', raw)
    return raw

CHUNK_SIZE = 1200
CHUNK_OVERLAP = 200


def chunk_text(text: str) -> list[str]:
    pattern = r'(?=\n\d\.\d+\s+[A-Z])'
    raw_chunks = re.split(pattern, text)

    final = []
    for c in raw_chunks:
        c = c.strip()
        if len(c) < 50:
            continue
        if len(c) > 1500:
            for i in range(0, len(c), 1200):
                final.append(c[i:i+1200])
        else:
            final.append(c)
    return final


def build_index(asset_id: str, pdf_path: str, out_dir: str = "clients/sanad/manuals/faiss"):
    text = extract_text(pdf_path)
    chunks = chunk_text(text)
    embeddings = MODEL.encode(chunks, normalize_embeddings=True)

    index = faiss.IndexFlatIP(embeddings.shape[1])
    index.add(embeddings)
    asset_dir = Path(out_dir) / asset_id
    asset_dir.mkdir(parents=True, exist_ok=True)
    faiss.write_index(index, str(asset_dir / "index.faiss"))
    with open(asset_dir / "chunks.pkl", "wb") as f:
        pickle.dump(chunks, f)

    print(f"[{asset_id}] {len(chunks)} chunks indexed → {asset_dir}")

if __name__ == "__main__":
    build_index(
        asset_id="crible_mf1861",
        pdf_path="clients/sanad/manuals/crible_MF1861-2_OM.pdf",
    )
