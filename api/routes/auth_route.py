from fastapi import APIRouter, Depends, status, Request
from fastapi.responses import JSONResponse
from dto.auth_response_dto import AuthResponseDTO
from dto.user_register_request_dto import UserRegisterRequestDTO
from dto.user_login_request_dto import UserLoginRequestDTO
from enums.auth_provider_enum import AuthProviderEnum
from service.user_service import UserService
from service.token_service import TokenService

router = APIRouter(prefix="/auth")

@router.get('/')
def get():
    return {
        "statusCode": 200,
        "message": "API funcionando corretamento."
    }

# @router.get("/logout")
# def logout(request: Request):
#     request.session.clear()


@router.post("/register", response_model = AuthResponseDTO)
def register(user: UserRegisterRequestDTO):
    user_service = UserService()
    provider = AuthProviderEnum.local
    user.provider = provider
    authResponseDTO = user_service.create_user(user)
    return JSONResponse(status_code=status.HTTP_200_OK, content=authResponseDTO.dict())

@router.post("/login", response_model = AuthResponseDTO,)
def login(user: UserLoginRequestDTO, request: Request):
    user_service = UserService()
    authResponseDTO = user_service.user_is_authorized(user, request)
    return JSONResponse(status_code=status.HTTP_200_OK, content=authResponseDTO.dict())


@router.get("/protect")
def protect(token: str = Depends(TokenService.validate_token)):
    return JSONResponse(status_code=status.HTTP_200_OK, content="Você está com permissão")