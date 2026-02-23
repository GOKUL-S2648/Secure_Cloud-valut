import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv(dotenv_path=".env.local")

url: str = os.environ.get("SUPABASE_URL", "")
key: str = os.environ.get("SUPABASE_KEY", "")
supabase: Client = create_client(url, key)

# 1. Get a user
user_res = supabase.table("users").select("id").limit(1).execute()
if not user_res.data:
    print("No users found.")
    exit()

user_id = user_res.data[0]['id']

# 2. Get a file for that user
file_res = supabase.table("files").select("id, name").eq("owner_id", user_id).limit(1).execute()
if not file_res.data:
    print(f"No files found for user {user_id}.")
    exit()

file_id = file_res.data[0]['id']
file_name = file_res.data[0]['name']

print(f"Attempting to delete file '{file_name}' (ID: {file_id}) for user {user_id}...")

# 3. Simulate DELETE request (using supabase directly for simplicity in testing)
# In reality, the frontend calls the Flask API which does exactly this.
delete_res = supabase.table("files").delete().eq("owner_id", user_id).eq("id", file_id).execute()

if len(delete_res.data) > 0:
    print(f"Successfully deleted file {file_id}. Response: {delete_res.data}")
else:
    print(f"Failed to delete file {file_id}. It might have been already deleted or owner_id mismatch.")
