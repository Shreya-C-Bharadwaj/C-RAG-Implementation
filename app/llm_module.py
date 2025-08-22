from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline
from app.config import MODEL_NAME

print("Loading Qwen model...")
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, trust_remote_code=True)
model = AutoModelForCausalLM.from_pretrained(MODEL_NAME, trust_remote_code=True)
pipe = pipeline("text-generation", model=model, tokenizer=tokenizer)

def generate_answer(question, chunks):
    print("DEBUG chunks:", chunks)
    context = "\n\n".join(
        (chunk.text if hasattr(chunk, 'text') else
         chunk.get('text') if isinstance(chunk, dict) and 'text' in chunk else
         str(chunk))
        for chunk in chunks
    )
    messages = [
        {"role": "system",
          "content": "You are a code generation assistant. Your task is to provide only the requested code or code modifications, without any additional conversational text, explanations, or examples. Focus strictly on the code. STICK TO THE CODE "
          },

        {"role": "user", "content": f"""Answer the question using only the code context below:

CODE:
{context}

QUESTION:
{question}
"""}
    ]
    prompt = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
    response = pipe(prompt, max_new_tokens=300)[0]["generated_text"]

    # Remove the prompt from generated text
    answer_text = response[len(prompt):].strip()

    # Optional: Remove unwanted prefixes like "Assistant:"
    if "Assistant:" in answer_text:
        answer_text = answer_text.split("Assistant:")[-1].strip()
    
    return answer_text
