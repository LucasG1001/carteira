from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
class SecurityService:
    def encode_password(self, password: str):
        password_encoded = pwd_context.hash(password)
        return password_encoded
    
    def compare_password(self, password: str, hashed_pasword: str) -> bool:
        return pwd_context.verify(password, hashed_pasword)