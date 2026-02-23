import os
import secrets
import string
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv(dotenv_path=".env.local")

url: str = os.environ.get("SUPABASE_URL", "")
key: str = os.environ.get("SUPABASE_KEY", "")
supabase: Client = create_client(url, key)

def generate_salt(length=16):
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))

try:
    # Try to update a user with a new field to see if it works
    # We'll use a dummy update on the first user found
    users = supabase.table("users").select("id").limit(1).execute()
    if users.data:
        user_id = users.data[0]['id']
        test_salt = generate_salt()
        print(f"Attempting to update user {user_id} with session_salt...")
        res = supabase.table("users").update({"session_salt": test_salt}).eq("id", user_id).execute()
        print("Update successful! The column exists or was created (unlikely to be created automatically).")
        print(res.data)
    else:
        print("No users found.")
except Exception as e:
    print(f"Update failed: {e}")
    print("This likely means the 'session_salt' column does not exist in the 'users' table.")
