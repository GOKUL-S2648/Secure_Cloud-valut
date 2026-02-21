import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from groq import Groq
from dotenv import load_dotenv
import json
import time
from typing import Dict, Any, List
from supabase import create_client, Client

load_dotenv(dotenv_path=".env.local")

app = Flask(__name__)
CORS(app)

# Supabase Configuration
url: str = os.environ.get("SUPABASE_URL", "")
key: str = os.environ.get("SUPABASE_KEY", "")
supabase: Client = create_client(url, key)

client = Groq(api_key=os.environ.get("VITE_GROQ_API_KEY"))

# Removed local DB functions in favor of Supabase

def generate_dynamic_key(user_id: Any) -> str:
    # Mimic JS logic from constants.js
    hours = int(time.time() / (60 * 60 * 4))
    seed = str(user_id) + str(hours)
    hash_val = 0
    for char in seed:
        hash_val = ((hash_val << 5) - hash_val) + ord(char)
        # Simulate 32-bit signed int (hash |= 0 in JS)
        hash_val = (hash_val + 0x80000000) % 0x100000000 - 0x80000000
    
    # Use string formatting to avoid indexing issues with hex()
    h_str: str = format(abs(hash_val), 'X')
    return h_str[:8]

@app.route('/')
def home():
    return jsonify({"status": "CloudVault API is running", "version": "1.0.0"})

@app.route('/api/shared-files/<target_key>', methods=['GET'])
def get_shared_files(target_key):
    try:
        # 1. Identify owner from the key
        # We search all users to find which one generates this key
        users_result = supabase.table("users").select("id, username").execute()
        owner_id = None
        owner_name = "Unknown"
        
        for user in users_result.data:
            if generate_dynamic_key(user['id']) == target_key.upper():
                owner_id = user['id']
                owner_name = user.get('username')
                break
        
        if not owner_id:
            return jsonify({"error": "No files found for this key or key has expired"}), 404

        # 2. Fetch files for this owner
        files_result = supabase.table("files").select("*").eq("owner_id", owner_id).execute()
        
        # Map DB keys to Frontend keys
        mapped_files = []
        for f in files_result.data:
            mapped_files.append({
                "id": f.get("id"),
                "name": f.get("name"),
                "size": f.get("size"),
                "type": f.get("type"),
                "url": f.get("url"),
                "category": f.get("category"),
                "riskLevel": f.get("risk_level"),
                "verdict": f.get("verdict"),
                "uploadedAt": f.get("uploaded_at")
            })

        # 3. Log the access attempt
        supabase.table("access_logs").insert({
            "owner_id": owner_id,
            "access_key": target_key.upper()
        }).execute()

        return jsonify({
            "owner": owner_name,
            "files": mapped_files
        })
    except Exception as e:
        print(f"Error accessing shared files: {e}")
        return jsonify({"error": str(e)}), 500

# Persistent Database

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    
    try:
        # Check if user exists
        existing = supabase.table("users").select("*").eq("email", email).execute()
        if existing.data:
            return jsonify({"error": "User already exists"}), 400

        # Create user
        new_user = {
            "email": email,
            "password": password,
            "username": email.split('@')[0]
        }
        result = supabase.table("users").insert(new_user).execute()
        return jsonify(result.data[0]), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    try:
        result = supabase.table("users").select("*").eq("email", email).eq("password", password).execute()
        if not result.data:
            return jsonify({"error": "Invalid credentials"}), 401
        
        return jsonify(result.data[0]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/analyze', methods=['POST'])
def analyze():
    data = request.json
    file_name = data.get('fileName')
    file_type = data.get('fileType')
    
    try:
        completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are a cybersecurity expert. Analyze files and return JSON output with keys: 'verdict' (brief sentence), 'category' (Legal, Financial, Technical, Multimedia, or Other), and 'riskLevel' (Low, Medium, High).",
                },
                {
                    "role": "user",
                    "content": f'Analyze file: Name="{file_name}", Type="{file_type}".',
                },
            ],
            model="llama-3.3-70b-versatile",
            response_format={"type": "json_object"}
        )
        return completion.choices[0].message.content
    except Exception as e:
        print(f"Groq error: {e}")
        return jsonify({
            "verdict": "Security scan unavailable.",
            "category": "Other",
            "riskLevel": "Low"
        }), 500

@app.route('/api/files/<user_id>', methods=['GET'])
def get_files(user_id):
    try:
        # Check if user_id is a valid UUID
        from uuid import UUID
        try:
            UUID(user_id)
        except ValueError:
            # If not a UUID, it's likely a legacy ID. Return empty list instead of 500.
            return jsonify([]), 200

        result = supabase.table("files").select("*").eq("owner_id", user_id).execute()
        
        # Map DB keys to Frontend keys
        mapped_files = []
        for f in result.data:
            mapped_files.append({
                "id": f.get("id"),
                "name": f.get("name"),
                "size": f.get("size"),
                "type": f.get("type"),
                "url": f.get("url"),
                "category": f.get("category"),
                "riskLevel": f.get("risk_level"),
                "verdict": f.get("verdict"),
                "uploadedAt": f.get("uploaded_at")
            })
            
        return jsonify(mapped_files), 200
    except Exception as e:
        print(f"Supabase GET error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/files/<user_id>', methods=['POST'])
def save_user_files(user_id):
    new_files = request.json
    if not isinstance(new_files, list):
        return jsonify({"error": "Invalid data format"}), 400

    try:
        from uuid import UUID
        try:
            UUID(user_id)
        except ValueError:
            return jsonify({"error": "Invalid User ID format. Please log out and log in again."}), 400

        for file in new_files:
            file_name = file.get('name')
            if not file_name:
                continue

            # Mapping frontend keys to DB keys
            file_data = {
                "owner_id": user_id,
                "name": file_name,
                "size": file.get('size'),
                "type": file.get('type'),
                "url": file.get('url'),
                "category": file.get('category'),
                "risk_level": file.get('riskLevel'),
                "verdict": file.get('verdict')
            }

            # Check if file already exists for this user to avoid duplicates
            existing = supabase.table("files").select("id").eq("owner_id", user_id).eq("name", file_name).execute()
            
            if existing.data:
                # Update existing record
                supabase.table("files").update(file_data).eq("id", existing.data[0]['id']).execute()
            else:
                # Insert new record
                supabase.table("files").insert(file_data).execute()
        
        return jsonify({"status": "success"}), 200
    except Exception as e:
        print(f"Error saving files: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)
