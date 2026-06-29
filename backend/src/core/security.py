from src.core.config import settings


def get_current_user_id() -> str:
    return settings.SINGLE_USER_ID
