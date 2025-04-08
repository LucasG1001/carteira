from fastapi import HTTPException
from domain.user import User
from dto import user_login_request_dto, user_register_request_dto
from dto.user_register_response_dto import UserRegisterResponseDTO
from repository.user_repository import UserRepository
from service.security_service import SecurityService
from service.token_service import TokenService
from repository.refresh_token_repository import RefreshTokenRepository


class UserService:
    def __init__(self):
        self.user_repository = UserRepository()
        self.security_service = SecurityService()
        self.token_service = TokenService()
        self.refresh_token_repository = RefreshTokenRepository()

    def create_user(self, userCreateDTO: user_register_request_dto) -> UserRegisterResponseDTO:
        user = self.user_repository.get_user_by_email(email=userCreateDTO.email)
        if(user):
            raise HTTPException(status_code=400, detail="E-mail já cadastrado")
        
        hashed_password = self.security_service.encode_password(userCreateDTO.password)

        new_user = User(email= userCreateDTO.email, password=hashed_password)
        self.user_repository.save(new_user)


        user_create = self.user_repository.get_user_by_email(email=userCreateDTO.email)

        data = {
            "sub": user_create.id,
            "username": user_create.email
        }

        token = self.token_service.generate_token(data)
        refresh_token = self.token_service.generate_refresh_token(user_create.id)

        user_registred = UserRegisterResponseDTO(token=token, refresh_token= refresh_token.value)
        self.token_service.save_refresh_token(refresh_token=refresh_token)

        return user_registred

    def use_email_exists(self, email: str) -> bool:
        user = self.user_repository.get_user_by_email(email=email)
        if(user):
            return True
        else:
            return False

    def user_is_authorized(self, userLoginDTO: user_login_request_dto) -> bool:
        user = self.user_repository.get_user_by_email(userLoginDTO.email)
        if(user == None):
            raise HTTPException(status_code=400, detail="E-mail ou password incorretos")
           
        is_valid = self.security_service.compare_password(password=userLoginDTO.password, hashed_pasword=user.password)

        if(is_valid == False):
            raise HTTPException(status_code=400, detail="E-mail ou password incorretos")





        