from fastapi import FastAPI
from controller.auth_controller import auth_router
import os
from dotenv import load_dotenv

app = FastAPI(title="Minha API")

app.include_router(auth_router)


if __name__ == '__main__':
    from dotenv import load_dotenv

    env = os.getenv("ENV", "development")

    env_file = f".env.{env}"

    env = load_dotenv(env_file)

    SECRET_KEY = os.getenv("SECRET_KEY")
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
