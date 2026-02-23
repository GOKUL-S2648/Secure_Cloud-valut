import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from groq import Groq
from dotenv import load_dotenv
import json
import time
from typing import Dict, Any, List, Optional
from supabase import create_client, Client

load_dotenv(dotenv_path=".env.local")

app = Flask(__name__)
CORS(app)

# Supabase Configuration
url: str = os.environ.get("SUPABASE_URL", "")
key: str = os.environ.get("SUPABASE_KEY", "")
supabase: Client = create_client(url, key)

client = Groq(api_key=os.environ.get("VITE_GROQ_API_KEY"))

# Local DB Fallback Initialization
DB_FILE = "db.json"
def load_local_db():
    try:
        if os.path.exists(DB_FILE):
            with open(DB_FILE, "r") as f:
                return json.load(f)
        return {"users": {}, "files": {}}
    except Exception as e:
        print(f"ERROR: Could not load local DB: {e}")
        return {"users": {}, "files": {}}

def save_local_db(data):
    try:
        with open(DB_FILE, "w") as f:
            json.dump(data, f, indent=4)
    except Exception as e:
        print(f"ERROR: Could not save local DB: {e}")

def generate_dynamic_key(user_id: Any, salt: Optional[str] = None) -> str:
    # If no salt provided, we fall back to a legacy time-based key or constant
    # But with the new system, we should always have a salt
    seed = str(user_id) + str(salt if salt else "cloudvault-legacy")
    
    hash_val = 0
    for char in seed:
        char_code = ord(char)
        # JS: hash = ((hash << 5) - hash) + char_code; hash |= 0;
        
        # 1. hash << 5
        res = (hash_val << 5)
        # Truncate to 32-bit signed
        res = (res + 0x80000000) % 0x100000000 - 0x80000000
        
        # 2. - hash
        res = res - hash_val
        res = (res + 0x80000000) % 0x100000000 - 0x80000000
        
        # 3. + char_code
        hash_val = res + char_code
        hash_val = (hash_val + 0x80000000) % 0x100000000 - 0x80000000
    
    # JS: Math.abs(hash).toString(16).toUpperCase().substring(0, 8);
    h_str = format(abs(hash_val), 'x').upper()
    return h_str[:8]

@app.route('/')
def home():
    return jsonify({"status": "CloudVault API is running", "version": "1.0.0"})

@app.route('/api/shared-files/<target_key>', methods=['GET'])
def get_shared_files(target_key):
    try:
        owner_id = None
        owner_name = "Unknown"
        target_key_upper = target_key.upper()
        print(f"INFO: Attempting to match key: {target_key_upper}")

        # 1. Try identifying owner from Supabase
        try:
            try:
                users_result = supabase.table("users").select("id, username, session_salt").execute()
            except Exception as e:
                print(f"WARNING: session_salt column might be missing, falling back: {e}")
                users_result = supabase.table("users").select("id, username").execute()
            
            for user in users_result.data:
                user_id_str = str(user.get('id'))
                salt = user.get('session_salt')
                gen_key = generate_dynamic_key(user_id_str, salt)
                
                if gen_key == target_key_upper:
                    owner_id = user['id']
                    owner_name = user.get('username')
                    print(f"SUCCESS: Match found! Owner: {owner_name}")
                    break
        except Exception as e:
            print(f"WARNING: Supabase user match failed, checking local: {e}")

        # 2. Try identifying owner from Local DB if not found yet
        if not owner_id:
            local_db = load_local_db()
            for email, u in local_db.get("users", {}).items():
                u_id = u.get("id")
                u_salt = u.get("session_salt")
                gen_key = generate_dynamic_key(u_id, u_salt)
                if gen_key == target_key_upper:
                    owner_id = u_id
                    owner_name = u.get("username")
                    print(f"SUCCESS: Match found in Local DB! Owner: {owner_name}")
                    break

        if not owner_id:
            print(f"ERROR: No match found for key {target_key_upper}")
            return jsonify({"error": "No files found for this key or key has expired."}), 404

        # 3. Fetch files for this owner
        files = []
        try:
            files_result = supabase.table("files").select("*").eq("owner_id", owner_id).execute()
            files = files_result.data
        except Exception as e:
            print(f"WARNING: Supabase files fetch failed, falling back to local: {e}")
            local_db = load_local_db()
            files = local_db.get("files", {}).get(str(owner_id), [])
        
        # Map DB keys to Frontend keys
        mapped_files = []
        for f in files:
            mapped_files.append({
                "id": f.get("id"),
                "name": f.get("name"),
                "size": f.get("size"),
                "type": f.get("type"),
                "url": f.get("url"),
                "category": f.get("category"),
                "riskLevel": f.get("risk_level") or f.get("riskLevel"),
                "verdict": f.get("verdict"),
                "uploadedAt": f.get("uploaded_at") or f.get("uploadedAt"),
                "cipherContent": f.get("cipher_content") or f.get("cipherContent"),
                "iv": f.get("iv"),
                "ownerId": f.get("owner_id") or f.get("ownerId")
            })

        # 4. Log the access attempt (optional, don't fail if Supabase is down)
        try:
            supabase.table("access_logs").insert({
                "owner_id": owner_id,
                "access_key": target_key.upper()
            }).execute()
        except:
            pass

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
        try:
            existing = supabase.table("users").select("id, email, password, username, created_at").eq("email", email).execute()
            if existing.data:
                return jsonify({"error": "User already exists"}), 400
        except Exception as e:
            print(f"WARNING: Supabase check failed during register: {e}")
            local_db = load_local_db()
            if email in local_db["users"]:
                return jsonify({"error": "User already exists (local)"}), 400

        # Create user
        new_user = {
            "id": str(int(time.time() * 1000)), # Fallback ID
            "email": email,
            "password": password,
            "username": email.split('@')[0],
            "created_at": time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
        }
        
        try:
            result = supabase.table("users").insert(new_user).execute()
            user_data = result.data[0]
        except Exception as e:
            print(f"WARNING: Supabase insert failed, saving locally: {e}")
            local_data = load_local_db()
            if "users" not in local_data:
                local_data["users"] = {}
            
            users_dict = local_data["users"]
            users_dict[email] = new_user
            local_data["users"] = users_dict
            save_local_db(local_data)
            user_data = new_user

        return jsonify(user_data), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    try:
        user = None
        try:
            result = supabase.table("users").select("id, email, password, username, created_at").eq("email", email).eq("password", password).execute()
            if result.data:
                user = result.data[0]
        except Exception as e:
            print(f"WARNING: Supabase login failed, checking local: {e}")
        
        if not user:
            local_db = load_local_db()
            if email in local_db["users"] and local_db["users"][email]["password"] == password:
                user = local_db["users"][email]
            else:
                return jsonify({"error": "Invalid credentials"}), 401
        
        # Generate new session salt on every login
        import secrets
        import string
        new_salt = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(16))
        
        # Update user with new salt
        try:
            supabase.table("users").update({"session_salt": new_salt}).eq("id", user['id']).execute()
            user['session_salt'] = new_salt
            print(f"INFO: Updated session salt for {email}")
        except Exception as update_err:
            print(f"WARNING: Could not update session_salt for {email}: {update_err}")
            # Fallback to local salt rotation
            local_data = load_local_db()
            if email in local_data.get("users", {}):
                users_map = local_data["users"]
                users_map[email]["session_salt"] = new_salt
                local_data["users"] = users_map
                save_local_db(local_data)
            user['session_salt'] = new_salt
        
        return jsonify(user), 200
    except Exception as e:
        print(f"CRITICAL: Login error for {email}: {e}")
        return jsonify({"error": str(e)}), 500

# Access Requests & Notifications Endpoints

@app.route('/api/access-requests', methods=['POST'])
def create_access_request():
    data = request.json
    file_id = data.get('fileId')
    owner_id = data.get('ownerId')
    requester_key = data.get('requesterKey')
    print(f"DEBUG: New access request for file={file_id}, owner={owner_id}, key={requester_key}")
    
    # Log attempt to file
    with open("access_debug.log", "a") as f_log:
        f_log.write(f"ATTEMPT: file={file_id} owner={owner_id} key={requester_key}\n")

    try:
        # Safety check: if owner_id is missing or looks invalid, resolve it from the file table
        if not owner_id or owner_id == 'undefined':
            print(f"INFO: owner_id missing or undefined, fetching from DB for file {file_id}")
            file_res = supabase.table("files").select("owner_id").eq("id", file_id).execute()
            if file_res.data:
                owner_id = file_res.data[0]['owner_id']
                print(f"SUCCESS: Resolved owner_id to {owner_id}")
            else:
                print(f"ERROR: Could not find owner for file {file_id}")
                return jsonify({"error": "File not found for mapping owner"}), 404

        # 1. Create the request
        req_data = {
            "id": str(int(time.time() * 1000)),
            "file_id": file_id,
            "owner_id": owner_id,
            "requester_key": requester_key,
            "status": "pending",
            "created_at": time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
        }
        
        try:
            res = supabase.table("access_requests").insert(req_data).execute()
            req_result = res.data[0]
        except Exception as e:
            print(f"WARNING: Supabase access_request insert failed, saving locally: {e}")
            local_db = load_local_db()
            if "access_requests" not in local_db or not isinstance(local_db["access_requests"], list):
                local_db["access_requests"] = []
            local_db["access_requests"].append(req_data)
            save_local_db(local_db)
            req_result = req_data
        print(f"DEBUG: Inserted access_request record")
        
        # 2. Create a notification for the owner
        notif_data = {
            "id": str(int(time.time() * 1000) + 1),
            "user_id": owner_id,
            "title": "Decryption Request",
            "message": f"A user is requesting to decrypt a file in your vault.",
            "type": "alert",
            "is_read": False,
            "created_at": time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
        }
        try:
            supabase.table("system_notifications").insert(notif_data).execute()
        except Exception as e:
            print(f"WARNING: Supabase notification insert failed, saving locally: {e}")
            local_db = load_local_db()
            if "notifications" not in local_db or not isinstance(local_db["notifications"], list):
                local_db["notifications"] = []
            local_db["notifications"].append(notif_data)
            save_local_db(local_db)
        print(f"DEBUG: Created system_notification for user {owner_id}")
        
        # Log to a file we can read
        with open("access_debug.log", "a") as f_log:
            f_log.write(f"REQ: file={file_id} owner={owner_id} key={requester_key}\n")

        return jsonify(req_result), 201
    except Exception as e:
        print(f"ERROR in access-request: {e}")
        with open("access_debug.log", "a") as f_log:
            f_log.write(f"ERROR: {str(e)}\n")
        return jsonify({"error": str(e)}), 500

@app.route('/api/access-requests/<user_id>', methods=['GET'])
def get_access_requests(user_id):
    try:
        final_requests = []
        try:
            res = supabase.table("access_requests").select("*, files(name)").eq("owner_id", user_id).eq("status", "pending").execute()
            final_requests = res.data
        except Exception as e:
            print(f"WARNING: Supabase access_requests fetch failed, checking local: {e}")
            local_db = load_local_db()
            local_requests = local_db.get("access_requests")
            if not isinstance(local_requests, list):
                local_requests = []
            
            # Filter pending requests for this owner
            owner_requests = [r for r in local_requests if isinstance(r, dict) and r.get("owner_id") == user_id and r.get("status") == "pending"]
            
            # Mock file name joined (simple)
            for r in owner_requests:
                if "files" not in r:
                    r["files"] = {"name": f"File-{r.get('file_id')}"}
            final_requests = owner_requests
        
        return jsonify(final_requests), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/access-requests/<request_id>', methods=['PATCH'])
def update_access_request(request_id):
    data = request.json
    status = data.get('status') # 'approved' or 'denied'
    try:
        updated_data = None
        try:
            res = supabase.table("access_requests").update({"status": status}).eq("id", request_id).execute()
            if res.data:
                updated_data = res.data[0]
        except Exception as e:
            print(f"WARNING: Supabase access_request update failed, trying local: {e}")
            local_db = load_local_db()
            local_requests = local_db.get("access_requests")
            if not isinstance(local_requests, list):
                local_requests = []
                
            for r in local_requests:
                if isinstance(r, dict) and str(r.get("id")) == str(request_id):
                    r["status"] = status
                    updated_data = r
                    break
            if updated_data:
                local_db["access_requests"] = local_requests
                save_local_db(local_db)
        
        if not updated_data:
            return jsonify({"error": "Request not found"}), 404
            
        return jsonify(updated_data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/notifications/<user_id>', methods=['GET'])
def get_notifications(user_id):
    try:
        final_notifs = []
        try:
            res = supabase.table("system_notifications").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
            final_notifs = res.data
        except Exception as e:
            print(f"WARNING: Supabase notifications fetch failed, checking local: {e}")
            local_db = load_local_db()
            local_notifs = local_db.get("notifications")
            if not isinstance(local_notifs, list):
                local_notifs = []
                
            final_notifs = [n for n in local_notifs if isinstance(n, dict) and n.get("user_id") == user_id]
            final_notifs.sort(key=lambda x: x.get("created_at", ""), reverse=True)
            
        return jsonify(final_notifs), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/notifications/<notif_id>', methods=['PATCH'])
def mark_notification_read(notif_id):
    try:
        updated_notif = None
        try:
            res = supabase.table("system_notifications").update({"is_read": True}).eq("id", notif_id).execute()
            if res.data:
                updated_notif = res.data[0]
        except Exception as e:
            print(f"WARNING: Supabase notification update failed, trying local: {e}")
            local_db = load_local_db()
            local_notifs = local_db.get("notifications")
            if not isinstance(local_notifs, list):
                local_notifs = []
                
            for n in local_notifs:
                if isinstance(n, dict) and str(n.get("id")) == str(notif_id):
                    n["is_read"] = True
                    updated_notif = n
                    break
            if updated_notif:
                local_db["notifications"] = local_notifs
                save_local_db(local_db)
        
        if not updated_notif:
            return jsonify({"error": "Notification not found"}), 404
            
        return jsonify(updated_notif), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/check-approval', methods=['POST'])
def check_approval():
    data = request.json
    file_id = data.get('fileId')
    requester_key = data.get('requesterKey')
    try:
        is_approved = False
        try:
            res = supabase.table("access_requests")\
                .select("*")\
                .eq("file_id", file_id)\
                .eq("requester_key", requester_key)\
                .eq("status", "approved")\
                .execute()
            is_approved = len(res.data) > 0
        except Exception as e:
            print(f"WARNING: Supabase check-approval failed, checking local: {e}")
            local_db = load_local_db()
            local_requests = local_db.get("access_requests")
            if not isinstance(local_requests, list):
                local_requests = []
            is_approved = any(r for r in local_requests if isinstance(r, dict) and r.get("file_id") == file_id and r.get("requester_key") == requester_key and r.get("status") == "approved")
            
        return jsonify({"approved": is_approved}), 200
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
        # Relaxed validation: allow UUID or numeric fallback IDs
        if not user_id:
            return jsonify({"error": "User ID required"}), 400

        try:
            result = supabase.table("files").select("*").eq("owner_id", user_id).execute()
            files = result.data
        except Exception as e:
            print(f"WARNING: Supabase GET error, falling back to local: {e}")
            local_db = load_local_db()
            files = local_db.get("files", {}).get(str(user_id), [])
        
        # Map DB keys to Frontend keys
        mapped_files = []
        for f in files:
            mapped_files.append({
                "id": f.get("id"),
                "name": f.get("name"),
                "size": f.get("size"),
                "type": f.get("type"),
                "url": f.get("url"),
                "category": f.get("category"),
                "riskLevel": f.get("risk_level") or f.get("riskLevel"),
                "verdict": f.get("verdict"),
                "uploadedAt": f.get("uploaded_at") or f.get("uploadedAt"),
                "cipherContent": f.get("cipher_content") or f.get("cipherContent"),
                "iv": f.get("iv")
            })
            
        return jsonify(mapped_files), 200
    except Exception as e:
        print(f"GET files error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/files/<user_id>', methods=['POST'])
def save_user_files(user_id):
    new_files = request.json
    if not isinstance(new_files, list):
        return jsonify({"error": "Invalid data format"}), 400

    try:
        if not user_id:
            return jsonify({"error": "User ID required"}), 400

        supabase_success = True
        try:
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
                    "verdict": file.get('verdict'),
                    "cipher_content": file.get('cipherContent'),
                    "iv": file.get('iv')
                }

                # Check if file already exists for this user to avoid duplicates
                existing = supabase.table("files").select("id").eq("owner_id", user_id).eq("name", file_name).execute()
                
                if existing.data:
                    # Update existing record
                    supabase.table("files").update(file_data).eq("id", existing.data[0]['id']).execute()
                else:
                    # Insert new record
                    supabase.table("files").insert(file_data).execute()
        except Exception as e:
            print(f"WARNING: Supabase save failed, using local fallback: {e}")
            supabase_success = False

        # Always sync to local DB for fallback reliability
        local_db_data = load_local_db()
        user_id_str = str(user_id)
        if "files" not in local_db_data or not isinstance(local_db_data["files"], dict):
            local_db_data["files"] = {}
        
        files_map = local_db_data["files"]
        if user_id_str not in files_map:
            files_map[user_id_str] = []
        
        # Simple merge: replace existing or add new
        current_local_files = files_map[user_id_str]
        for nf in new_files:
            found = False
            for i, of in enumerate(current_local_files):
                if of.get("name") == nf.get("name"):
                    current_local_files[i] = nf
                    found = True
                    break
            if not found:
                current_local_files.append(nf)
        
        files_map[user_id_str] = current_local_files
        local_db_data["files"] = files_map
        save_local_db(local_db_data)
        
        return jsonify({"status": "success", "supabase": supabase_success}), 200
    except Exception as e:
        print(f"Error saving files: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/files/<user_id>/<file_id>', methods=['DELETE'])
def delete_file(user_id, file_id):
    try:
        if not user_id:
             return jsonify({"error": "User ID required"}), 400
             
        # Delete from Supabase
        supabase_success = True
        try:
            supabase.table("files").delete().eq("owner_id", user_id).eq("id", file_id).execute()
        except Exception as e:
            print(f"WARNING: Supabase delete failed, using local fallback: {e}")
            supabase_success = False
            
        # Local delete
        local_data = load_local_db()
        files_root = local_data.get("files", {})
        user_files = files_root.get(str(user_id), [])
        new_user_files = [f for f in user_files if str(f.get("id")) != str(file_id)]
        
        if not isinstance(files_root, dict):
            files_root = {}
        files_root[str(user_id)] = new_user_files
        local_data["files"] = files_root
        save_local_db(local_data)
        
        return jsonify({"status": "success", "supabase": supabase_success}), 200
    except Exception as e:
        print(f"Error deleting file: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
