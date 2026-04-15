import jwt
from fastapi import Request, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jwt import PyJWKClient
from src.core.config import settings

# HTTP Bearer scheme setup
security = HTTPBearer()

# Initialize JWK Client to fetch public keys from Keycloak
jwks_client = PyJWKClient(settings.jwks_url)

def get_current_user_id(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    token = credentials.credentials
    try:
        # Fetch the signing key matching the token's kid parameter
        signing_key = jwks_client.get_signing_key_from_jwt(token)
        
        # We're validating the token natively
        payload = jwt.decode(
            token,
            key=signing_key.key,
            algorithms=["RS256"],
            audience="account", # Typically 'account' or the client-id in Keycloak, we'll loosen audience validation if needed, or disable it
            options={"verify_aud": False} # Since different clients might get different aud, we disable aud validation for this simple demo, or we could require KEYCLOAK_CLIENT_ID
        )
        
        user_id_sub = payload.get("sub")
        if not user_id_sub:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token does not contain 'sub' claim",
            )
        return user_id_sub
        
    except jwt.PyJWKClientError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unable to fetch signing keys",
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token signature has expired",
        )
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
        )
