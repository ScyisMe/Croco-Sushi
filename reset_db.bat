@echo off
echo Stopping Docker containers...
docker compose down

echo Removing Postgres volume (trying possible names)...
docker volume rm croco_sushi_postgres_data
docker volume rm croco-sushi_postgres_data
docker volume rm crocosushi_postgres_data

echo.
echo Cleaning Frontend builds (fixes 'next not found')...
rmdir /s /q "frontend\.next"
rmdir /s /q "frontend\node_modules"

echo.
echo Rebuilding and starting containers...
docker compose up -d --build

echo.
echo waiting for logs...
timeout /t 5
docker compose logs -f postgres
pause
