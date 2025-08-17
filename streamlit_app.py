# streamlit_app.py
import streamlit as st
from app.rag_pipeline import retrieve_relevant_chunks
from app.llm_module import generate_answer
from app.rag_pipeline import load_faiss_index_and_chunks, retrieve_relevant_chunks

index, chunks = load_faiss_index_and_chunks()


st.set_page_config(page_title="Chat with Code", layout="centered")
st.title("💬 Chat with Your Code")

query = st.text_input("Ask your question about the code:")

if query:
    with st.spinner("🔍 Retrieving relevant code..."):
        context_chunks = retrieve_relevant_chunks(query)
        only_code = [chunk["content"] for chunk in context_chunks]
    
    with st.spinner("Generating answer..."):
        answer = generate_answer(query, only_code)
    
    st.markdown("### 🧠 Answer:")
    st.success(answer)

    st.markdown("### 🧩 Relevant Code Snippets:")
    for idx, chunk in enumerate(context_chunks):
        with st.expander(f"Snippet {idx+1}"):
            st.markdown(f"📂 **File:** `{chunk['source']}`  \n📌 **Start Line:** {chunk['start_line']}")
            st.code(chunk["content"], language='cpp')
