import os
import sys
import pickle
import numpy as np
from fastembed import TextEmbedding
import faiss

# Allow importing chunker.py from ../rag
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(os.path.join(BASE_DIR, "..", "rag"))
from chunker import load_and_chunk_all_pdfs

VECTORSTORE_DIR = os.path.join(BASE_DIR, "..", "vectorstore")
os.makedirs(VECTORSTORE_DIR, exist_ok=True)

def build_vectorstore():
    print("Loading and chunking PDFs...")
    chunks = load_and_chunk_all_pdfs()
    texts = [c["text"] for c in chunks]

    print("Loading embedding model (first run downloads it, be patient)...")
    model = TextEmbedding(model_name="BAAI/bge-small-en-v1.5")

    print(f"Generating embeddings for {len(texts)} chunks...")
    embeddings = list(model.embed(texts))
    embeddings = np.array(embeddings).astype("float32")

    print("Building FAISS index...")
    dimension = embeddings.shape[1]
    index = faiss.IndexFlatL2(dimension)
    index.add(embeddings)

    # Save the FAISS index
    faiss.write_index(index, os.path.join(VECTORSTORE_DIR, "faiss_index.bin"))

    # Save the chunk metadata (so we can map index results back to text)
    with open(os.path.join(VECTORSTORE_DIR, "chunks_metadata.pkl"), "wb") as f:
        pickle.dump(chunks, f)

    print(f"\n✅ Done! Stored {len(chunks)} chunks in the vector database.")
    print(f"Files saved in: {VECTORSTORE_DIR}")

if __name__ == "__main__":
    build_vectorstore()