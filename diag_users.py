import os
import time
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv(dotenv_path=".env.local")

url: str = os.environ.get("SUPABASE_URL", "")
key: str = os.environ.get("SUPABASE_KEY", "")
supabase: Client = create_client(url, key)

def generate_dynamic_key(user_id):
    hours = int(time.time() / (60 * 60 * 4))
    seed = str(user_id) + str(hours)
    hash_val = 0
    for char in seed:
        char_code = ord(char)
        # JS: hash = ((hash << 5) - hash) + char_code; hash |= 0;
        res = (hash_val << 5)
        res = (res + 0x80000000) % 0x100000000 - 0x80000000
        res = res - hash_val
        res = (res + 0x80000000) % 0x100000000 - 0x80000000
        hash_val = res + char_code
        hash_val = (hash_val + 0x80000000) % 0x100000000 - 0x80000000
    
    h_str = format(abs(hash_val), 'x').upper()
    return h_str[:8]

users = supabase.table("users").select("id, email").execute()
results = []
results.append(f"Current Time: {time.ctime()}")
for u in users.data:
    k = generate_dynamic_key(u['id'])
    results.append(f"Email: {u['email']} | Key: {k}")

with open("diag_output.txt", "w") as f:
    f.write("\n".join(results))
