from fastapi import FastAPI
from api.routes import router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Incident Detection API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Your Vite/React port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
