import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv(dotenv_path=".env.local")

url: str = os.environ.get("SUPABASE_URL", "")
key: str = os.environ.get("SUPABASE_KEY", "")
supabase: Client = create_client(url, key)

tables = ["access_requests", "system_notifications", "users", "files"]

for table in tables:
    try:
        res = supabase.table(table).select("id").limit(1).execute()
        print(f"Table '{table}': EXISTS")
        # Check for session_salt column specifically for users table
        if table == "users":
            try:
                # Try selecting it
                supabase.table("users").select("session_salt").limit(1).execute()
                print("  - Column 'session_salt': EXISTS")
            except Exception as e:
                print(f"  - Column 'session_salt': MISSING ({e})")
    except Exception as e:
        print(f"Table '{table}': ERROR or MISSING ({e})")
