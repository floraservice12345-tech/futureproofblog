from pathlib import Path
import struct

path = Path(__file__).with_name("futureproof-services-promo.webm")
data = path.read_bytes()
info_id = b"\x15\x49\xa9\x66"
start = data.find(info_id)
if start < 0:
    raise SystemExit("WebM Info element not found")

size_at = start + len(info_id)
first = data[size_at]
mask = 0x80
size_width = 1
while size_width <= 8 and not first & mask:
    mask >>= 1
    size_width += 1
if size_width > 8:
    raise SystemExit("Invalid EBML Info size")
info_size = first & (mask - 1)
for byte in data[size_at + 1:size_at + size_width]:
    info_size = (info_size << 8) | byte
payload_at = size_at + size_width
payload_end = payload_at + info_size
if data[payload_at:payload_end].find(b"\x44\x89") >= 0:
    print("Duration element already exists")
    raise SystemExit(0)

duration = b"\x44\x89\x88" + struct.pack(">d", 17600.0)
new_size = info_size + len(duration)
max_value = (1 << (7 * size_width)) - 1
if new_size > max_value:
    raise SystemExit("Info size no longer fits its EBML size field")
encoded = new_size.to_bytes(size_width, "big")
encoded = bytes([encoded[0] | mask]) + encoded[1:]
patched = data[:size_at] + encoded + data[payload_at:payload_end] + duration + data[payload_end:]
path.write_bytes(patched)
print(f"Added 17.6-second duration metadata to {path} ({len(patched):,} bytes)")
