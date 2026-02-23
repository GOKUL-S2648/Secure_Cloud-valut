import time

def generate_dynamic_key(user_id):
    # Mimic JS logic from constants.js
    hours = int(time.time() / (60 * 60 * 4))
    seed = str(user_id) + str(hours)
    hash_val = 0
    for char in seed:
        hash_val = ((hash_val << 5) - hash_val) + ord(char)
        # Simulate 32-bit signed int (hash |= 0 in JS)
        hash_val = (hash_val + 0x80000000) % 0x100000000 - 0x80000000
    
    h_str = format(abs(hash_val), 'X')
    return h_str[:8]

# Test with a mock UUID
mock_uuid = "706f4daa-c4e9-4c0f-9423-63bf7a289cdc"
key = generate_dynamic_key(mock_uuid)
print(f"Hours: {int(time.time() / (60 * 60 * 4))}")
print(f"Seed: {mock_uuid}{int(time.time() / (60 * 60 * 4))}")
print(f"Generated Key: {key}")
