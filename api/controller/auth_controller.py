from fastapi import FastAPI
from fastapi.responses import JSONResponse
# from dto.UserCreateDTO import UserCreateDTO
# from dto.UserLoginDTO import UserLoginDTO
# from service.user_service import UserService

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

# @app.get("/callback")
# async def google_auth_callback(request: Request):
#     try:
#         token = await oauth.google.authorize_access_token(request)
#         user = await oauth.google.parse_id_token(request, token)
#         return JSONResponse(content={"token": token, "user": user})
#     except OAuthError as error:
#         raise HTTPException(status_code=400, detail=str(error))


# @app.post("/register")
# def register(user: UserCreateDTO):
#     user_service = UserService()
#     user_service.create_user(user)
#     return {"message": "Usuário registrado com sucesso"}
        


# @app.post("/login")
# def login(user: UserLoginDTO):
#     user_service = UserService()
#     user_service.user_is_authorized(user)
#     return {"message": "Usuário logado com sucesso"}