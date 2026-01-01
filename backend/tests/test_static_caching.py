import pytest
from httpx import AsyncClient
from pathlib import Path
import os
from app.core.config import settings

@pytest.mark.asyncio
async def test_static_caching_headers(client: AsyncClient):
    """
    Test that static files (WOFF2, JSON) get correct Cache-Control headers.
    """
    upload_dir = Path(settings.UPLOAD_DIR).resolve()
    upload_dir.mkdir(parents=True, exist_ok=True)

    # Create dummy files
    files = {
        "test.woff2": b"dummy font content",
        "test.json": b'{"dummy": "json"}',
        "test.txt": b"dummy text content"
    }

    created_files = []
    
    try:
        for filename, content in files.items():
            filepath = upload_dir / filename
            filepath.write_bytes(content)
            created_files.append(filepath)

        # 1. Check WOFF2
        response = await client.get("/static/uploads/test.woff2")
        assert response.status_code == 200
        assert "Cache-Control" in response.headers
        assert response.headers["Cache-Control"] == "public, max-age=31536000, immutable"

        # 2. Check JSON
        response = await client.get("/static/uploads/test.json")
        assert response.status_code == 200
        assert "Cache-Control" in response.headers
        assert response.headers["Cache-Control"] == "public, max-age=3600"
        
        # 3. Check Other (txt) - Optional: check default or absence
        response = await client.get("/static/uploads/test.txt")
        assert response.status_code == 200
        # If no default set in static.py, it might not have Cache-Control or have a default one.
        # For now, we assume no specific requirement for .txt, so just ensure it renders 200.

    finally:
        # Cleanup
        for filepath in created_files:
            if filepath.exists():
                filepath.unlink()
