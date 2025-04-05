import os
from dotenv import load_dotenv


load_dotenv(dotenv_path=".env.production")


CLIENT_ID = os.environ.get('client-id', None)
CLIENT_SECRET = os.environ.get('client-secret', None)
print(CLIENT_ID, CLIENT_SECRET)