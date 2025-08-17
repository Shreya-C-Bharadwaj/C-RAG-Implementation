from flask import Flask, render_template, request, jsonify, session
from flask_cors import CORS
import os
import sqlite3
import bcrypt
from flask_session import Session
import json
from datetime import datetime

app = Flask(__name__)

# Enable CORS for React frontend
CORS(app, supports_credentials=True)

# Session config
app.secret_key = os.getenv("FLASK_SECRET_KEY", "your-secret-key-change-in-production")
app.config["SESSION_TYPE"] = "filesystem"
app.config["SESSION_PERMANENT"] = False
Session(app)

# Initialize DB
def get_db_connection():
    conn = sqlite3.connect("database.db", check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    db = get_db_connection()
    with db:
        db.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        db.execute("""
            CREATE TABLE IF NOT EXISTS query_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                query TEXT NOT NULL,
                response TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            );
        """)
        db.execute("""
            CREATE TABLE IF NOT EXISTS user_files (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                filename TEXT NOT NULL,
                content TEXT NOT NULL,
                file_type TEXT NOT NULL,
                uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            );
        """)
    db.close()

# Initialize database on startup
init_db()

# API Routes
@app.route('/api/signup', methods=['POST'])
def signup():
    try:
        data = request.get_json()
        name = data.get('name')
        email = data.get('email')
        password = data.get('password')

        if not (name and email and password):
            return jsonify({'error': 'All fields are required'}), 400

        # Hash password
        hashed_pw = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

        db = get_db_connection()
        cursor = db.cursor()
        
        # Check if email exists
        cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
        if cursor.fetchone():
            db.close()
            return jsonify({'error': 'Email already exists'}), 400
        
        # Insert new user
        cursor.execute("INSERT INTO users (name, email, password) VALUES (?, ?, ?)", 
                       (name, email, hashed_pw))
        db.commit()
        user_id = cursor.lastrowid
        db.close()

        # Set session
        session['user_id'] = user_id
        session['user_name'] = name
        session['user_email'] = email

        return jsonify({
            'success': True,
            'user': {
                'id': user_id,
                'name': name,
                'email': email
            }
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        if not (email and password):
            return jsonify({'error': 'Email and password are required'}), 400

        db = get_db_connection()
        cursor = db.cursor()
        cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
        user = cursor.fetchone()
        db.close()

        if user and bcrypt.checkpw(password.encode('utf-8'), user['password']):
            session['user_id'] = user['id']
            session['user_name'] = user['name']
            session['user_email'] = user['email']
            
            return jsonify({
                'success': True,
                'user': {
                    'id': user['id'],
                    'name': user['name'],
                    'email': user['email']
                }
            })
        else:
            return jsonify({'error': 'Invalid credentials'}), 401

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'success': True})

@app.route('/api/user', methods=['GET'])
def get_user():
    if 'user_id' in session:
        return jsonify({
            'user': {
                'id': session['user_id'],
                'name': session['user_name'],
                'email': session['user_email']
            }
        })
    return jsonify({'user': None})

@app.route('/api/upload-files', methods=['POST'])
def upload_files():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401

    try:
        data = request.get_json()
        files = data.get('files', [])
        user_id = session['user_id']

        if not files:
            return jsonify({'error': 'No files provided'}), 400

        db = get_db_connection()
        cursor = db.cursor()

        # Clear existing files for this user
        cursor.execute("DELETE FROM user_files WHERE user_id = ?", (user_id,))

        # Insert new files
        for file_data in files:
            cursor.execute("""
                INSERT INTO user_files (user_id, filename, content, file_type) 
                VALUES (?, ?, ?, ?)
            """, (user_id, file_data['name'], file_data['content'], file_data['type']))

        db.commit()
        db.close()

        return jsonify({'success': True, 'message': f'Uploaded {len(files)} files'})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/files', methods=['GET'])
def get_files():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401

    try:
        user_id = session['user_id']
        db = get_db_connection()
        cursor = db.cursor()
        
        cursor.execute("""
            SELECT filename, content, file_type, uploaded_at 
            FROM user_files 
            WHERE user_id = ? 
            ORDER BY uploaded_at DESC
        """, (user_id,))
        
        files = []
        for row in cursor.fetchall():
            files.append({
                'name': row['filename'],
                'content': row['content'],
                'type': row['file_type'],
                'uploaded_at': row['uploaded_at']
            })
        
        db.close()
        return jsonify({'files': files})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/chat', methods=['POST'])
def chat():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401

    try:
        data = request.get_json()
        query = data.get('query')
        user_id = session['user_id']

        if not query:
            return jsonify({'error': 'Query is required'}), 400

        # Get user's files for context
        db = get_db_connection()
        cursor = db.cursor()
        cursor.execute("SELECT filename, content FROM user_files WHERE user_id = ?", (user_id,))
        files = cursor.fetchall()

        # Simple response generation (replace with actual RAG implementation)
        context = ""
        for file in files:
            context += f"\n--- {file['filename']} ---\n{file['content']}\n"

        # Placeholder response (integrate with your AI service here)
        response = f"Based on your uploaded C/C++ files, here's information about: {query}\n\nContext from your codebase:\n{context[:500]}..."

        # Log the query
        cursor.execute("""
            INSERT INTO query_logs (user_id, query, response) 
            VALUES (?, ?, ?)
        """, (user_id, query, response))
        db.commit()
        db.close()

        return jsonify({
            'success': True,
            'response': response
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/query-logs', methods=['GET'])
def get_query_logs():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401

    try:
        user_id = session['user_id']
        db = get_db_connection()
        cursor = db.cursor()
        
        cursor.execute("""
            SELECT query, response, timestamp 
            FROM query_logs 
            WHERE user_id = ? 
            ORDER BY timestamp DESC 
            LIMIT 20
        """, (user_id,))
        
        logs = []
        for row in cursor.fetchall():
            logs.append({
                'query': row['query'],
                'response': row['response'],
                'timestamp': row['timestamp']
            })
        
        db.close()
        return jsonify({'logs': logs})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Serve React app
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react_app(path):
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True, port=5000)