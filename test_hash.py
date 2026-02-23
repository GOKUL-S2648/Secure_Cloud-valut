def js_hash_step(hash_val, char_code):
    # In JS: hash = ((hash << 5) - hash) + char_code; hash |= 0;
    
    # 1. hash << 5 (in JS this makes it 32-bit already)
    left_shifted = (hash_val << 5)
    # Truncate to 32-bit signed
    left_shifted = (left_shifted + 0x80000000) % 0x100000000 - 0x80000000
    
    # 2. (left_shifted - hash)
    subtracted = left_shifted - hash_val
    subtracted = (subtracted + 0x80000000) % 0x100000000 - 0x80000000
    
    # 3. + char_code
    added = subtracted + char_code
    added = (added + 0x80000000) % 0x100000000 - 0x80000000
    
    return added

# Let's compare with my current simpler version:
def current_sim(hash_val, char_code):
    hash_val = ((hash_val << 5) - hash_val) + char_code
    hash_val = (hash_val + 0x80000000) % 0x100000000 - 0x80000000
    return hash_val

seed = "706f4daa-c4e9-4c0f-9423-63bf7a289cdc123032"
h1 = 0
for char in seed:
    h1 = js_hash_step(h1, ord(char))

h2 = 0
for char in seed:
    h2 = current_sim(h2, ord(char))

print(f"JS-like: {h1} (Hex: {format(abs(h1), 'X')})")
print(f"Current: {h2} (Hex: {format(abs(h2), 'X')})")
