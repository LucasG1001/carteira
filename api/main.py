from fastapi import FastAPI, HTTPException
from starlette.middleware.sessions import SessionMiddleware
from config import settings
from exceptions.exceptions import CustomAppException
from routes import auth_route, google_route

from exceptions.exceptions import (

    custom_app_exception_handler,
    http_exception_handler,
)

app = FastAPI()
app.add_middleware(SessionMiddleware, secret_key=settings.SECRET_KEY)

app.include_router(auth_route.router)
app.include_router(google_route.router)
app.add_exception_handler(CustomAppException, custom_app_exception_handler)
app.add_exception_handler(HTTPException, http_exception_handler)


if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app="main:app", host="localhost", port=8000, reload=True)
