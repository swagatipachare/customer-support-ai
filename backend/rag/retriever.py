import os
import pickle
import numpy as np
from fastembed import TextEmbedding
import faiss

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
VECTORSTORE_DIR = os.path.join(BASE_DIR, "..", "vectorstore")

# Load model, index, and metadata once (reused across queries)
model = TextEmbedding(model_name="BAAI/bge-small-en-v1.5")
index = faiss.read_index(os.path.join(VECTORSTORE_DIR, "faiss_index.bin"))

with open(os.path.join(VECTORSTORE_DIR, "chunks_metadata.pkl"), "rb") as f:
    chunks_metadata = pickle.load(f)


def retrieve_relevant_chunks(query, top_k=3):
    """Given a user question, return the top_k most relevant chunks."""
    query_embedding = np.array(list(model.embed([query]))).astype("float32")
    distances, indices = index.search(query_embedding, top_k)

    results = []
    for idx, dist in zip(indices[0], distances[0]):
        if idx < len(chunks_metadata):
            results.append({
                "source": chunks_metadata[idx]["source"],
                "text": chunks_metadata[idx]["text"],
                "distance": float(dist)
            })
    return results


if __name__ == "__main__":
    test_query = "How long does shipping take?"
    print(f"Query: {test_query}\n")
    results = retrieve_relevant_chunks(test_query)
    for i, r in enumerate(results, 1):
        print(f"--- Result {i} (source: {r['source']}, distance: {r['distance']:.4f}) ---")
        print(r['text'][:200] + "...\n")