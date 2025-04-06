import os
from dotenv import load_dotenv


load_dotenv(dotenv_path=".env.production")


CLIENT_ID = os.environ.get('client-id', None)
CLIENT_SECRET = os.environ.get('client-secret', None)
SECRET_KEY = os.environ.get('secret-key', None)
ALHORITHM = os.environ.get('algorithm', None)
ACCESS_TOKEN_EXPIRE_MINUTES = os.environ.get('access-token-expire-minutes', None)
REFRESH_TOKEN_EXPIRE_DAYS = os.environ.get('refresh-token-expire-days', None)