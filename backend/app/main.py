from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.v1.api import api_router

app = FastAPI(
    title="Croco Sushi API",
    description="API для сайту доставки суші",
    version="0.1.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Підключення роутерів
app.include_router(api_router, prefix="/api/v1")


@app.get("/")
async def root():
    return {"message": "Croco Sushi API", "version": "0.1.0"}


@app.get("/health")
async def health_check():
    return {"status": "ok"}


