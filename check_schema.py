import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv(dotenv_path=".env.local")

url: str = os.environ.get("SUPABASE_URL", "")
key: str = os.environ.get("SUPABASE_KEY", "")
supabase: Client = create_client(url, key)

try:
    # Try to fetch one user and see all columns
    res = supabase.table("users").select("*").limit(1).execute()
    if res.data:
        print(f"Columns in 'users' table: {res.data[0].keys()}")
    else:
        print("No users found to check columns.")
except Exception as e:
    print(f"Error checking columns: {e}")
