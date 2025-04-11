from fastapi import FastAPI
from starlette.middleware.sessions import SessionMiddleware
from config import settings
from routes import auth_route, google_route

app = FastAPI()
app.add_middleware(SessionMiddleware, secret_key= settings.SECRET_KEY)

app.include_router(auth_route.router)
app.include_router(google_route.router)


if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app="main:app", host="localhost", port=8000, reload=True)
