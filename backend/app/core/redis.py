import logging
import redis.asyncio as redis
from app.core.config import settings

logger = logging.getLogger(__name__)

class RedisManager:
    client: redis.Redis | None = None

    @classmethod
    async def connect(cls):
        try:
            cls.client = redis.from_url(settings.REDIS_URL, decode_responses=True)
            await cls.client.ping()
            logger.info("Connected to Redis")
        except Exception as e:
            logger.warning(f"Redis connection failed: {e}")
            cls.client = None

    @classmethod
    async def close(cls):
        if cls.client:
            await cls.client.aclose()
            logger.info("Redis connection closed")

    @classmethod
    def get_client(cls) -> redis.Redis | None:
        return cls.client
