import os 
import json
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer

from app.utils import extract_code_chunks
from app.config import *

model = SentenceTransformer(EMBED_MODEL_NAME)
index = None
chunks_list = []

CHUNK_FILE = "vector_store/id_mapping.json"
INDEX_FILE = "vector_store/index.faiss"

def get_code_files(directory):
    supported_exts = (".cpp", ".c", ".h", ".hpp", ".cc", ".cxx",
                      ".py", ".java", ".js", ".ts", ".tsx",
                      ".cs", ".go", ".php", ".rb", ".swift")
    return [
        os.path.join(dp, f)
        for dp, _, files in os.walk(directory)
        for f in files if f.lower().endswith(supported_exts)
    ]


def process_and_store_local_code(base_path=CODE_FOLDER):
    """
    Processes the given codebase folder and stores FAISS index + chunk mapping.
    Always rebuilds the index when called.
    """
    global index, chunks_list

    os.makedirs(os.path.dirname(CHUNK_FILE), exist_ok=True)

    files = get_code_files(base_path)
    if not files:
        print(f"No supported code files found in {base_path}")
        return

    documents = []

    for filepath in files:
        try:
            with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                code = f.read()
                chunks = extract_code_chunks(code, filepath)
                documents.extend(chunks)
        except Exception as e:
            print(f" Could not read {filepath}: {e}")

    if not documents:
        print(" No chunks generated from code files.")
        return

    embeddings = model.encode([c["content"] for c in documents])
    index = faiss.IndexFlatL2(embeddings.shape[1])
    index.add(np.array(embeddings, dtype=np.float32))
    chunks_list = documents

    with open(CHUNK_FILE, "w", encoding="utf-8") as f:
        json.dump(documents, f, indent=2)

    faiss.write_index(index, INDEX_FILE)
    print(f"Indexed {len(documents)} chunks from {len(files)} files in {base_path}")

def load_faiss_index_and_chunks():
    """
    Loads the FAISS index and chunk mapping from disk.
    """
    global index, chunks_list
    if not os.path.exists(CHUNK_FILE) or not os.path.exists(INDEX_FILE):
        raise FileNotFoundError("Vector store files not found. Run process_and_store_local_code() first.")

    with open(CHUNK_FILE, "r", encoding="utf-8") as f:
        chunks_list = json.load(f)

    index = faiss.read_index(INDEX_FILE)
    print("FAISS index and chunks loaded for use.")

    return index, chunks_list

def retrieve_relevant_chunks(query, k=5):
    """
    Retrieves top-k relevant chunks for a given query.
    """
    global index, chunks_list
    if index is None or not chunks_list:
        raise RuntimeError("FAISS index not initialized. Call process_and_store_local_code() first.")

    query_vec = model.encode([query])
    distances, indices = index.search(np.array(query_vec, dtype=np.float32), k)
    return [chunks_list[i] for i in indices[0] if i < len(chunks_list)]
