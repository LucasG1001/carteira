from fastapi import HTTPException, Request
from domain.user import User
from dto import user_login_request_dto, user_register_request_dto
from dto.auth_response_dto import AuthResponseDTO
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

    def create_user(self, userCreateDTO: user_register_request_dto) -> AuthResponseDTO:
        user = self.user_repository.get_user_by_email(
            email=userCreateDTO.email)
        if (user):
            raise HTTPException(status_code=400, detail="E-mail já cadastrado")

        hashed_password = self.security_service.encode_password(
            userCreateDTO.password)

        new_user = User(email=userCreateDTO.email, password=hashed_password)
        self.user_repository.save(new_user)

        saved_user = self.user_repository.get_user_by_email(
            email=userCreateDTO.email)

        return self._generate_auth_response(saved_user)

    def use_email_exists(self, email: str) -> bool:
        user = self.user_repository.get_user_by_email(email=email)
        if (user):
            return True
        else:
            return False

    def authenticate_user(self, userLoginDTO: user_login_request_dto, request: Request) -> AuthResponseDTO:
        user = self.user_repository.get_user_by_email(userLoginDTO.email)
        if not user or not self.security_service.compare_password(password=userLoginDTO.password, hashed_pasword=user.password):
            raise HTTPException(
                status_code=400, detail="E-mail ou password incorretos")

        clientMetadata = self.token_service.extract_request_metadata(request)

        self.token_service.delete_refresh_token(
            user.id, clientMetadata.ip, clientMetadata.user_agent)

        return self._generate_auth_response(user, request)

    def _generate_auth_response(self, user: User, request: Request) -> AuthResponseDTO:
        token_payload = {
            "sub": user.id,
            "username": user.email
        }

        clientMetadata = self.token_service.extract_request_metadata(request)

        token = self.token_service.generate_access_token(token_payload)
        refresh_token = self.token_service.generate_refresh_token(
            user.id, clientMetadata)

        auth_response = AuthResponseDTO(
            token=token, refresh_token=refresh_token.token_hash)

        self.token_service.save_refresh_token(refresh_token)

        return auth_response
