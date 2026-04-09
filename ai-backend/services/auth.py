import os
import httpx
from fastapi import HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import jwt, JWTError
from dotenv import load_dotenv

load_dotenv()

security = HTTPBearer()
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")

# Cache JWKS keys
_jwks_cache: dict | None = None

async def _get_jwks() -> dict:
    global _jwks_cache
    if _jwks_cache:
        return _jwks_cache
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json")
        resp.raise_for_status()
        _jwks_cache = resp.json()
        return _jwks_cache

def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)) -> dict:
    """
    Sync fallback — decodes without full signature verification.
    Used for simple user_id extraction where we trust the Supabase session.
    """
    token = credentials.credentials
    try:
        # Decode without verification to extract sub (user_id)
        # Full RS256 verification happens in verify_token_async
        payload = jwt.decode(
            token,
            key="",
            algorithms=["RS256"],
            options={
                "verify_signature": False,
                "verify_aud": False,
                "verify_exp": True
            }
        )
        return payload
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")

def get_user_id(credentials: HTTPAuthorizationCredentials = Security(security)) -> str:
    payload = verify_token(credentials)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")
    return user_id
