import os
import re

def generate_function_flowchart(code_content, function_name):
    """
    Generates a simple Mermaid flowchart for a given function's control flow.
    This is a basic example and might need more sophisticated parsing for complex logic.
    """
    lines = code_content.splitlines()
    flowchart_nodes = []
    flowchart_links = []
    node_id_counter = 0
    function_found = False
    in_function = False
    current_node = None

    # Simple state machine for parsing
    for i, line in enumerate(lines):
        stripped_line = line.strip()

        if re.search(r'\b' + re.escape(function_name) + r'\b.*\(.*\)\s*{', stripped_line):
            function_found = True
            in_function = True
            node_id_counter += 1
            start_node_id = f"N{node_id_counter}"
            flowchart_nodes.append(f"{start_node_id}[Start {function_name}]")
            current_node = start_node_id
            continue

        if in_function:
            if stripped_line == "}": # End of function
                node_id_counter += 1
                end_node_id = f"N{node_id_counter}"
                flowchart_nodes.append(f"{end_node_id}[End {function_name}]")
                if current_node:
                    flowchart_links.append(f"{current_node} --> {end_node_id}")
                in_function = False
                break # Assuming one function per request for simplicity

            if stripped_line.startswith(("if ", "for ", "while ", "switch ")):
                node_id_counter += 1
                condition_node_id = f"N{node_id_counter}"
                flowchart_nodes.append(f"{condition_node_id}{{{stripped_line}}}")
                if current_node:
                    flowchart_links.append(f"{current_node} --> {condition_node_id}")
                current_node = condition_node_id
            elif stripped_line and not stripped_line.startswith(("//", "/*", "*", "*/")): # Process non-comment lines
                node_id_counter += 1
                action_node_id = f"N{node_id_counter}"
                flowchart_nodes.append(f"{action_node_id}[{stripped_line.replace('[', '(').replace(']', ')')}]") # Sanitize for Mermaid
                if current_node:
                    flowchart_links.append(f"{current_node} --> {action_node_id}")
                current_node = action_node_id

    if not function_found:
        return f"Function '{function_name}' not found in the provided code content."

    if not flowchart_nodes:
        return "No flowchart nodes generated. Function might be empty or parsing failed."

    mermaid_syntax = "graph TD\n"
    mermaid_syntax += "\n".join(flowchart_nodes) + "\n"
    mermaid_syntax += "\n".join(flowchart_links)

    return mermaid_syntax

def generate_class_diagram(code_content, class_name):
    """
    Generates a simple Mermaid class diagram for a given class.
    This is a basic example and might need more sophisticated parsing for inheritance, methods, etc.
    """
    lines = code_content.splitlines()
    class_found = False
    in_class = False
    attributes = []
    methods = []

    for line in lines:
        stripped_line = line.strip()

        if re.match(r'^(class|interface)\s+' + re.escape(class_name) + r'\s*({|$)', stripped_line):
            class_found = True
            in_class = True
            continue

        if in_class:
            if stripped_line == "}":
                in_class = False
                break

            # Basic attribute/method detection (can be improved with regex for types, visibility)
            if stripped_line and not stripped_line.startswith(("//", "/*", "*", "*/")):
                if "(" in stripped_line and ")" in stripped_line:
                    methods.append(stripped_line.split('(')[0].strip() + "()")
                elif "=" in stripped_line or stripped_line.endswith(";"):
                    attributes.append(stripped_line.split('=')[0].strip())

    if not class_found:
        return f"Class '{class_name}' not found in the provided code content."

    mermaid_syntax = f"classDiagram\nclass {class_name} {{\n"
    for attr in attributes:
        mermaid_syntax += f"  {attr}\n"
    for method in methods:
        mermaid_syntax += f"  {method}\n"
    mermaid_syntax += "}"

    return mermaid_syntax

# You can add more generation functions here, e.g., for module dependencies, call graphs, etc.
# These would likely require more advanced AST parsing or a more comprehensive code analysis.

def generate_codebase_structure_diagram(files_data):
    """
    Generates a Mermaid graph representing the overall codebase structure (files and their types).
    """
    mermaid_syntax = "graph TD\n"
    nodes = []
    links = []

    # Create nodes for each file
    for file_info in files_data:
        file_name = os.path.basename(file_info["name"]).replace('.', '_') # Sanitize for Mermaid node ID
        file_type = file_info["type"]
        nodes.append(f"{file_name}[{file_info['name']}<br/>({file_type})]")

    # Add links (conceptual, as direct file-to-file links aren't easily derived here without deeper parsing)
    # For a more meaningful diagram, you'd need to parse imports/includes.
    # For now, let's just show the files.

    mermaid_syntax += "\n".join(nodes)
    if links:
        mermaid_syntax += "\n" + "\n".join(links)

    return mermaid_syntax

