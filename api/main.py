from fastapi import FastAPI
from controller.auth_controller import auth_router

app = FastAPI(title="Minha API")

app.include_router(auth_router)


if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
