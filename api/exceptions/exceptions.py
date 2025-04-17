from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.status import HTTP_500_INTERNAL_SERVER_ERROR
from psycopg2.errors import UniqueViolation
from sqlalchemy.exc import IntegrityError


class CustomAppException(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code


async def custom_app_exception_handler(exc: CustomAppException):
    return JSONResponse(status_code=exc.status_code, content={"error": exc.message})


async def http_exception_handler(exc: HTTPException):
    return JSONResponse(status_code=exc.status_code, content={"error": exc.detail})
