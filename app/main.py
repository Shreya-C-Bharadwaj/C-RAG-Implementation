import uvicorn
from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from app import rag_pipeline, llm_module, mermaid_generator
import shutil
import os
import zipfile
from typing import List
import stat
import re 
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

class DiagramRequest(BaseModel):
    diagram_type: str # e.g., "flowchart", "class_diagram", "codebase_structure"
    file_path: str = None # Optional: for diagrams specific to a file
    entity_name: str = None # Optional: for diagrams specific to a function/class

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

    diagram = None
    # Try extracting function/class name from the question
    match = re.search(r"(function|class)\s+([A-Za-z_]\w*)", data.question, re.IGNORECASE)
    if match:
        entity_type, entity_name = match.groups()
        for chunk in chunks:
            code = chunk.get("content") if isinstance(chunk, dict) else getattr(chunk, "text", "")
            if not code:
                continue
            if entity_type.lower() == "function":
                diagram = mermaid_generator.generate_function_flowchart(code, entity_name)
            else:
                diagram = mermaid_generator.generate_class_diagram(code, entity_name)
            if diagram:
                break



    return {
        "question": data.question,
        "answer": answer,
        "retrieved_context": chunks,
        "diagram": diagram
    }

@app.post("/generate_diagram")
async def generate_diagram(req: DiagramRequest):
    if req.diagram_type == "flowchart":
        with open(req.file_path, "r", encoding="utf-8") as f:
            code_content = f.read()
        return {"diagram": mermaid_generator.generate_function_flowchart(code_content, req.entity_name)}

    elif req.diagram_type == "class_diagram":
        with open(req.file_path, "r", encoding="utf-8") as f:
            code_content = f.read()
        return {"diagram": mermaid_generator.generate_class_diagram(code_content, req.entity_name)}

    elif req.diagram_type == "codebase_structure":
        files_data = list_codebase()
        return {"diagram": mermaid_generator.generate_codebase_structure_diagram(files_data)}

    raise HTTPException(status_code=400, detail="Unsupported diagram type")



def remove_readonly(func, path, _):
    """Clear the readonly bit and reattempt the removal."""
    os.chmod(path, stat.S_IWRITE)
    func(path)


@app.post("/upload_codebase")
async def upload_codebase(file: UploadFile = File(...)):
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    # Clear old files (skip .git)
    for f in os.listdir(UPLOAD_DIR):
        file_path = os.path.join(UPLOAD_DIR, f)
        if f == ".git":
            continue
        if os.path.isfile(file_path) or os.path.islink(file_path):
            os.unlink(file_path)
        elif os.path.isdir(file_path):
            shutil.rmtree(file_path, onerror=remove_readonly)

    # Reset FAISS before re-building
    rag_pipeline.reset_index()

    file_path = os.path.join(UPLOAD_DIR, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

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

@app.post("/reset")
async def reset_codebase():
    # Clear uploaded files
    if os.path.exists(UPLOAD_DIR):
        for f in os.listdir(UPLOAD_DIR):
            file_path = os.path.join(UPLOAD_DIR, f)
            if os.path.isfile(file_path) or os.path.islink(file_path):
                os.unlink(file_path)
            elif os.path.isdir(file_path):
                shutil.rmtree(file_path, onerror=remove_readonly)

    # Reset FAISS index + chunks
    rag_pipeline.reset_index()

    return {"message": "Codebase and vector store reset successfully."}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
