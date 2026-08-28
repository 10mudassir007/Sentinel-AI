"""Generate Argon2id hashes of CNICs for the AUTHORIZED_CNICS .env variable.

Argon2 is a one-way hash, so the stored value can never be decrypted back
to the CNIC - login verifies by re-hashing the submitted CNIC and comparing.

Usage:
    python tools/hash_cnic.py 42101-2345678-9
    python tools/hash_cnic.py 42101-2345678-9 35202-1234567-1  # one hash per line

Paste the output into .env as:
    AUTHORIZED_CNICS=$argon2id$v=19$m=65536,t=4,p=4$...
For multiple CNICs, join their hashes with semicolons (no spaces).
"""

import os
import sys

# Make `core` importable when run as `python tools/hash_cnic.py`.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv  # noqa: E402

load_dotenv()
# Importing core.security pulls in core.config, which requires GROQ_API_KEY.
# The script only needs the hasher, so fall back to a placeholder.
os.environ.setdefault("GROQ_API_KEY", "hash-script")

from core.security import hash_cnic  # noqa: E402


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__)
        return 1
    for raw in sys.argv[1:]:
        try:
            print(hash_cnic(raw))
        except ValueError as exc:
            print(f"error: {exc}", file=sys.stderr)
            return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
