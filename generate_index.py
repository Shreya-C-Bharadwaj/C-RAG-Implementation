from app.rag_pipeline import process_and_store_local_code

if __name__ == "__main__":
    print("Generating vector store from codebase...")
    process_and_store_local_code()
    print("Vector store created successfully!")
