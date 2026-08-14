import os
from pypdf import PdfReader

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
KB_DIR = os.path.join(BASE_DIR, "..", "..", "knowledge_base")

def extract_text_from_pdf(pdf_path):
    reader = PdfReader(pdf_path)
    text = ""
    for page in reader.pages:
        text += page.extract_text() + "\n"
    return text

def chunk_text(text, chunk_size=500, overlap=50):
    """Split text into overlapping word chunks."""
    words = text.split()
    chunks = []
    start = 0
    while start < len(words):
        end = start + chunk_size
        chunk = " ".join(words[start:end])
        chunks.append(chunk)
        start += chunk_size - overlap
    return chunks

def load_and_chunk_all_pdfs():
    """Returns a list of dicts: {source, chunk_text}"""
    all_chunks = []
    for filename in os.listdir(KB_DIR):
        if filename.endswith(".pdf"):
            path = os.path.join(KB_DIR, filename)
            text = extract_text_from_pdf(path)
            chunks = chunk_text(text)
            for chunk in chunks:
                all_chunks.append({"source": filename, "text": chunk})
    return all_chunks

if __name__ == "__main__":
    chunks = load_and_chunk_all_pdfs()
    print(f"Total chunks created: {len(chunks)}")
    print("\nExample chunk:")
    print(chunks[0])