@echo off
echo Stopping Docker containers...
docker compose down

echo Removing Postgres volume...
docker volume rm croco_sushi_postgres_data
if %errorlevel% neq 0 (
    echo.
    echo [WARNING] Could not remove 'croco_sushi_postgres_data'. 
    echo Trying to find other volumes...
    docker volume ls | findstr "postgres"
    echo.
    echo Please manually remove the volume name you see above using: docker volume rm <volumename>
    pause
    exit /b
)

echo.
echo Volume removed successfully.
echo Rebuilding and starting containers...
docker compose up -d --build

echo.
echo waiting for logs...
timeout /t 5
docker compose logs -f postgres
pause
