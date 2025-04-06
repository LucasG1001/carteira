from fastapi import FastAPI, status
from fastapi.responses import JSONResponse
from dto.user_create_dto import UserCreateDTO
from dto.user_login_request_dto import UserLoginDTO
from service.user_service import UserService

from config import CLIENT_ID, CLIENT_SECRET
from starlette.requests import Request
from starlette.middleware.sessions import SessionMiddleware
from authlib.integrations.starlette_client import OAuth, OAuthError

app = FastAPI()

app.add_middleware(SessionMiddleware, secret_key = "my-secret-key")
oauth = OAuth()

oauth.register(
    name='google',
    server_metadata_url = 'https://accounts.google.com/.well-known/openid-configuration',
    client_id = CLIENT_ID,
    client_secret = CLIENT_SECRET,
    client_kwargs={
        'scope': 'email openid profile',
        'prompt': 'select_account'
    }
)

@app.get('/')
def get():
    return {
        "statusCode": 200,
        "message": "get realizado com sucesso"
    }

@app.get('/login/google')
async def google_login(request: Request):
    url = request.url_for('auth')
    print(CLIENT_ID, CLIENT_SECRET)
    return await oauth.google.authorize_redirect(request, url)

@app.get('/auth')
async def auth(request: Request):
    try:
        token = await oauth.google.authorize_access_token(request)
    except OAuthError as e:
        pass
    user = token.get('userinfo')
    if user:
        request.session['user'] = dict(user)

@app.get("/logout")
def logout(request: Request):
    request.session.clear()


@app.post("/register")
def register(user: UserCreateDTO):
    user_service = UserService()
    user_service.create_user(user)
    return JSONResponse(status_code=status.HTTP_200_OK, content={'message': 'usuario registrado com sucesso'})

        


@app.post("/login")
def login(user: UserLoginDTO):
    user_service = UserService()
    user_service.user_is_authorized(user)
    return JSONResponse(status_code=status.HTTP_200_OK, content={'message': 'usuario criado com sucesso'})