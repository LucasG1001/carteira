from fastapi import HTTPException
from domain.user import User
from dto import user_create_dto, user_login_request_dto
from repository.user_repository import UserRepository
from service.security_service import SecurityService


class UserService:
    def __init__(self):
        self.user_repository = UserRepository()
        self.security_service = SecurityService()

    def create_user(self, userCreateDTO: user_create_dto) -> None:
        user = self.user_repository.get_user_by_email(email=userCreateDTO.email)
        if(user):
            raise HTTPException(status_code=400, detail="E-mail já cadastrado")
        
        hashed_password = self.security_service.encode_password(userCreateDTO.password)
        new_user = User(email= userCreateDTO.email, password=hashed_password)
        self.user_repository.save(new_user)

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
        
        print(user.email, user.password)
           
        is_valid = self.security_service.compare_password(password=userLoginDTO.password, hashed_pasword=user.password)

        if(is_valid == False):
            raise HTTPException(status_code=400, detail="E-mail ou password incorretos")





        