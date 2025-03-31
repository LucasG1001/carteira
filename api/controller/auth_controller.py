from fastapi import APIRouter, HTTPException, Request
from dto.UserCreateDTO import UserCreateDTO
from dto.UserLoginDTO import UserLoginDTO
from repository.user_repository import UserRepository
from domain.user import User
from service.security_service import SecurityService
from service.user_service import UserService

auth_router = APIRouter(prefix="/auth", tags=["Autenticação"])



@auth_router.post("/register")
def register(user: UserCreateDTO):
    user_service = UserService()
    user_service.create_user(user)
    return {"message": "Usuário registrado com sucesso"}
        


@auth_router.post("/login")
def login(user: UserLoginDTO):
    user_service = UserService()
    user_service.user_is_authorized(user)
    return {"message": "Usuário logado com sucesso"}

# @auth_router.post("/login/google")
# async def login(request: Request):
#     redirect_url = request.url_for("auth")
#     return await oauth