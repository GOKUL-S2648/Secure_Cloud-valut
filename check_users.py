import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv(dotenv_path=".env.local")

url: str = os.environ.get("SUPABASE_URL", "")
key: str = os.environ.get("SUPABASE_KEY", "")
supabase: Client = create_client(url, key)

try:
    result = supabase.table("users").select("*").execute()
    print("Users Data:")
    for user in result.data:
        print(f"ID: {user['id']}, Email: {user['email']}, Salt: {user.get('session_salt', 'NOT FOUND')}")
except Exception as e:
    print(f"Error: {e}")
