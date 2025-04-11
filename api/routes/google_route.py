from fastapi import APIRouter, Depends, FastAPI, status
from fastapi.responses import JSONResponse
from dto.auth_response_dto import AuthResponseDTO
from dto.user_register_request_dto import UserRegisterRequestDTO
from dto.user_login_request_dto import UserLoginRequestDTO
from enums.auth_provider_enum import AuthProviderEnum
from service.user_service import UserService
from service.token_service import TokenService

from config import settings
from starlette.requests import Request
from starlette.middleware.sessions import SessionMiddleware
from authlib.integrations.starlette_client import OAuth, OAuthError

router = APIRouter(prefix="/google", tags=["Google Auth"])

oauth = OAuth()

oauth.register(
    name='google',
    server_metadata_url = 'https://accounts.google.com/.well-known/openid-configuration',
    client_id = settings.CLIENT_ID,
    client_secret = settings.CLIENT_SECRET,
    client_kwargs={
        'scope': 'email openid profile',
        'prompt': 'select_account'
    }
)

@router.get('/')
def get():
    return {
        "statusCode": 200,
        "message": "get realizado com sucesso"
    }

@router.get('/login/google')
async def google_login(request: Request):
    url = request.url_for('auth')
    return await oauth.google.authorize_redirect(request, url)

@router.get('/auth')
async def auth(request: Request):
    try:
        token = await oauth.google.authorize_access_token(request)
    except OAuthError as e:
        pass
    user = token.get('userinfo')
    if user:
        request.session['user'] = dict(user)