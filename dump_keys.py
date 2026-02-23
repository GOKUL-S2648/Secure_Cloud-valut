import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv(dotenv_path=".env.local")

url: str = os.environ.get("SUPABASE_URL", "")
key: str = os.environ.get("SUPABASE_KEY", "")
supabase: Client = create_client(url, key)

def generate_dynamic_key(user_id, salt=None):
    seed = str(user_id) + str(salt if salt else "cloudvault-legacy")
    hash_val = 0
    for char in seed:
        char_code = ord(char)
        res = (hash_val << 5)
        res = (res + 0x80000000) % 0x100000000 - 0x80000000
        res = res - hash_val
        res = (res + 0x80000000) % 0x100000000 - 0x80000000
        hash_val = res + char_code
        hash_val = (hash_val + 0x80000000) % 0x100000000 - 0x80000000
    h_str = format(abs(hash_val), 'x').upper()
    return h_str[:8]

try:
    res = supabase.table("users").select("id, email").execute()
    print("MATCHING KEYS:")
    for user in res.data:
        k = generate_dynamic_key(user['id'])
        print(f"EMAIL: {user['email']} | ID: {user['id']} | KEY: {k}")
except Exception as e:
    print(f"Error: {e}")
