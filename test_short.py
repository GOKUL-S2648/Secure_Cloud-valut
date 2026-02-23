def current_sim(hash_val, char_code):
    hash_val = ((hash_val << 5) - hash_val) + char_code
    hash_val = (hash_val + 0x80000000) % 0x100000000 - 0x80000000
    return hash_val

seed = "abc"
h = 0
for char in seed:
    h = current_sim(h, ord(char))
    print(f"Step: {char} | Hash: {h} | Hex: {format(abs(h), 'X')}")
