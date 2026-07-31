"""Password hashing and opaque access-token helpers."""

from __future__ import annotations

import hashlib
import hmac
import secrets


SCRYPT_N = 2**14
SCRYPT_R = 8
SCRYPT_P = 1
SALT_BYTES = 16


def hash_password(password: str) -> str:
    """Hash a password using scrypt and return a self-describing string."""

    if not password:
        raise ValueError("Password cannot be empty")

    salt = secrets.token_bytes(SALT_BYTES)
    digest = hashlib.scrypt(
        password.encode("utf-8"),
        salt=salt,
        n=SCRYPT_N,
        r=SCRYPT_R,
        p=SCRYPT_P,
        dklen=32,
    )

    return "$".join(
        [
            "scrypt",
            str(SCRYPT_N),
            str(SCRYPT_R),
            str(SCRYPT_P),
            salt.hex(),
            digest.hex(),
        ]
    )


def verify_password(password: str, encoded_hash: str) -> bool:
    """Verify a plain password against a hash created by ``hash_password``."""

    try:
        algorithm, n, r, p, salt_hex, digest_hex = encoded_hash.split("$", 5)
        if algorithm != "scrypt":
            return False

        actual_digest = hashlib.scrypt(
            password.encode("utf-8"),
            salt=bytes.fromhex(salt_hex),
            n=int(n),
            r=int(r),
            p=int(p),
            dklen=len(bytes.fromhex(digest_hex)),
        )
        return hmac.compare_digest(actual_digest.hex(), digest_hex)
    except (TypeError, ValueError):
        return False


def create_access_token() -> str:
    """Create a cryptographically secure opaque access token."""

    return secrets.token_urlsafe(48)


def hash_access_token(token: str) -> str:
    """Hash an access token before it is persisted in the database."""

    return hashlib.sha256(token.encode("utf-8")).hexdigest()


__all__ = [
    "create_access_token",
    "hash_access_token",
    "hash_password",
    "verify_password",
]
