import uvicorn
from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from app import rag_pipeline, llm_module
import shutil
import os
import zipfile
from typing import List
import stat

app = FastAPI()

# Enable CORS so frontend can call it
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QuestionInput(BaseModel):
    question: str
    temperature: float = 0.2
    top_k: int = 5
    similarity_threshold: float = 0.7

UPLOAD_DIR = "data/codebase"

ALLOWED_EXTENSIONS = {
    '.c', '.cpp', '.h', '.hpp', '.py', '.java', '.js', '.ts', '.tsx',
    '.cs', '.go', '.php', '.rb', '.swift', '.zip'
}

def is_allowed(filename: str) -> bool:
    return os.path.splitext(filename)[1].lower() in ALLOWED_EXTENSIONS



@app.on_event("startup")
def startup():
    """Load FAISS index if exists, else build it from codebase."""
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    try:
        rag_pipeline.load_faiss_index_and_chunks()
        print("✅ FAISS index loaded successfully.")
    except FileNotFoundError:
        print("⚠️ No FAISS index found, building a new one...")
        rag_pipeline.process_and_store_local_code(base_path=UPLOAD_DIR)

@app.post("/ask_model")
async def ask_model(data: QuestionInput):
    """
    Local model RAG endpoint.
    """
    print("Using LOCAL model")
    chunks = rag_pipeline.retrieve_relevant_chunks(data.question, k=data.top_k)
    answer = llm_module.generate_answer(data.question, chunks)
    return {
        "question": data.question,
        "answer": answer,
        "retrieved_context": chunks
    }

def remove_readonly(func, path, _):
    """Clear the readonly bit and reattempt the removal."""
    os.chmod(path, stat.S_IWRITE)
    func(path)


@app.post("/upload_codebase")
async def upload_codebase(file: UploadFile = File(...)):
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    # Clear old files, skipping .git
    for f in os.listdir(UPLOAD_DIR):
        file_path = os.path.join(UPLOAD_DIR, f)
        if f == ".git":  # skip git folder
            continue
        if os.path.isfile(file_path) or os.path.islink(file_path):
            os.unlink(file_path)
        elif os.path.isdir(file_path):
            shutil.rmtree(file_path, onerror=remove_readonly)

    file_path = os.path.join(UPLOAD_DIR, file.filename)

    # Save uploaded file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # If it's a zip, extract it
    if file.filename.endswith(".zip"):
        with zipfile.ZipFile(file_path, "r") as zip_ref:
            zip_ref.extractall(UPLOAD_DIR)
        os.remove(file_path)

    rag_pipeline.process_and_store_local_code(base_path=UPLOAD_DIR)
    return {"message": "Codebase uploaded and processed successfully."}


@app.get("/list_codebase")
def list_codebase():
    """
    Return a list of uploaded files (name, content, type) so the frontend can display them.
    """
    files_data = []
    if not os.path.exists(UPLOAD_DIR):
        return files_data

    for root, _, files in os.walk(UPLOAD_DIR):
        for f in files:
            file_path = os.path.join(root, f)
            try:
                with open(file_path, "r", encoding="utf-8", errors="ignore") as fp:
                    content = fp.read()
            except Exception as e:
                content = f"<<unreadable file: {str(e)}>>"

            ext = os.path.splitext(f)[1].lstrip(".").lower()
            files_data.append({
                "name": f,
                "content": content,
                "type": ext or "unknown"
            })

    return files_data


@app.get("/")
def root():
    return {"message": "Local model RAG is running"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
