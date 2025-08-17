import re

def extract_code_chunks(code, source_path):
    chunks = []
    lines = code.splitlines()
    i = 0
    while i < len(lines):
        if re.match(r'^[a-zA-Z_][\w\s\*\(\),]*$', lines[i].strip()):
            signature = lines[i].strip()
            j = i + 1
            while j < len(lines) and "{" not in lines[j]:
                signature += " " + lines[j].strip()
                j += 1
            if j < len(lines) and "{" in lines[j]:
                brace_count = 0
                buffer = []
                start_line = i
                while j < len(lines):
                    brace_count += lines[j].count("{")
                    brace_count -= lines[j].count("}")
                    buffer.append(lines[j])
                    j += 1
                    if brace_count == 0:
                        break
                chunks.append({
                    "content": "\n".join(buffer),
                    "source": source_path,
                    "start_line": start_line,
                    "signature": signature
                })
                i = j
            else:
                i += 1
        else:
            i += 1
    return chunks
