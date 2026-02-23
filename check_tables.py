import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv(dotenv_path=".env.local")

url: str = os.environ.get("SUPABASE_URL", "")
key: str = os.environ.get("SUPABASE_KEY", "")
supabase: Client = create_client(url, key)

try:
    # There isn't a direct "list tables" in PostgREST, but we can try common names
    # or look at the files table which we know exists.
    res = supabase.table("files").select("*").limit(1).execute()
    print(f"Files columns: {res.data[0].keys() if res.data else 'No files'}")
    
    # Check if there's an access_logs table (mentioned in server.py)
    res = supabase.table("access_logs").select("*").limit(1).execute()
    print(f"Access Logs columns: {res.data[0].keys() if res.data else 'No logs'}")

except Exception as e:
    print(f"Error: {e}")
