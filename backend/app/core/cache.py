import json
from typing import Any, Optional, Callable
from functools import wraps
import hashlib
from fastapi import Request, Response
from app.core.redis import RedisManager

class CacheService:
    @staticmethod
    async def get(key: str) -> Any | None:
        client = RedisManager.get_client()
        if not client:
            return None
        
        data = await client.get(key)
        if data:
            try:
                return json.loads(data)
            except json.JSONDecodeError:
                return data
        return None

    @staticmethod
    async def set(key: str, value: Any, ttl: int = 300):
        client = RedisManager.get_client()
        if not client:
            return
            
        if isinstance(value, (dict, list, bool, int, float)):
            value = json.dumps(value, default=str)
            
        await client.setex(key, ttl, value)

    @staticmethod
    async def delete(key: str):
        client = RedisManager.get_client()
        if client:
            await client.delete(key)

    @staticmethod
    async def delete_pattern(pattern: str):
        client = RedisManager.get_client()
        if not client:
            return
        
        keys = []
        async for key in client.scan_iter(pattern):
            keys.append(key)
            
        if keys:
            await client.delete(*keys)

def cache_endpoint(ttl: int = 300, prefix: str = ""):
    """
    Simple decorator to cache GET endpoints.
    Note: Requires the function to return a Serializeable object (Pydantic model or dict/list).
    If it returns ORM objects directly, fastapi serialization happens later, so we might need 
    to convert to Pydantic first in the endpoint.
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Attempt to generate a unique key based on prefix + sorted kwargs
            # Filter out kwargs that are NOT serializable or relevant to the cache (like db session)
            
            cache_args = {k: v for k, v in kwargs.items() if k not in ['db', 'request', 'response', 'background_tasks']}
            
            # Simple serialization of args
            key_part = json.dumps(cache_args, sort_keys=True, default=str)
            key_hash = hashlib.md5(key_part.encode()).hexdigest()
            
            cache_key = f"api_cache:{prefix}:{key_hash}"
            
            # Try get from cache
            cached_data = await CacheService.get(cache_key)
            if cached_data is not None:
                return cached_data
                
            # Call function
            result = await func(*args, **kwargs)
            
            # Cache result
            # Note: result must be JSON serializable. 
            # If using Pydantic models, they often have .model_dump() or .dict()
            # But the endpoint typically returns the model instance, and FastAPI handles JSON.
            # We need to serialize it here to store in Redis.
            
            data_to_store = result
            
            # Basic attempt to serialize Pydantic models list or single
            if isinstance(result, list):
                data_to_store = [item.model_dump() if hasattr(item, 'model_dump') else item for item in result]
            elif hasattr(result, 'model_dump'):
                data_to_store = result.model_dump()
            
            await CacheService.set(cache_key, data_to_store, ttl)
            
            return result
        return wrapper
    return decorator
