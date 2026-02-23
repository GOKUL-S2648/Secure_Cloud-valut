def generate_dynamic_key_py(user_id, salt=None):
    seed = str(user_id) + str(salt if salt else "cloudvault-legacy")
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
    return str(h_str)[:8]

# Identical logic from constants.js (manually ported for testing)
def generate_dynamic_key_js_mock(userId, salt=None):
    seed = str(userId) + (salt if salt else "cloudvault-legacy")
    # Javascript ((hash << 5) - hash) + charCode followed by | 0
    # Let's see if Python's intermediate truncation matches JS behavior
    import ctypes
    hash_val = ctypes.c_int32(0).value
    for char in seed:
        char_code = ord(char)
        # hash = ((hash << 5) - hash) + char_code
        val = (ctypes.c_int32(hash_val).value << 5) - hash_val + char_code
        hash_val = ctypes.c_int32(val).value
    
    # Math.abs(hash).toString(16).toUpperCase().substring(0, 8)
    h_str = format(abs(hash_val), 'x').upper()
    return str(h_str)[:8]

user_id = "706f4daa-c4e9-4c5b-9d7a-18bf3f753549"
print(f"User ID: {user_id}")
print(f"Py Logic: {generate_dynamic_key_py(user_id)}")
print(f"JS Mock: {generate_dynamic_key_js_mock(user_id)}")
