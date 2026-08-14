from fastapi import Header, HTTPException
import sys, os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from auth_utils import decode_access_token


def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")

    token = authorization.split(" ")[1]
    payload = decode_access_token(token)

    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    return payload  # contains {"sub": email, "name": name}