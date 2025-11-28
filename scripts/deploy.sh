#!/bin/bash
# =============================================================================
# Скрипт деплою Croco Sushi
# =============================================================================

set -e

echo "🐊 Croco Sushi - Deployment Script"
echo "=================================="

# Кольори
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Перевірка .env файлу
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env файл не знайдено!${NC}"
    echo "Скопіюйте env.example в .env та заповніть змінні"
    exit 1
fi

# Функція для виведення статусу
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Зупинка існуючих контейнерів
echo ""
echo "📦 Зупинка існуючих контейнерів..."
docker-compose -f docker-compose.nginx.yml down --remove-orphans || true
print_status "Контейнери зупинено"

# Збірка образів
echo ""
echo "🔨 Збірка Docker образів..."
docker-compose -f docker-compose.nginx.yml build --no-cache
print_status "Образи зібрано"

# Запуск контейнерів
echo ""
echo "🚀 Запуск контейнерів..."
docker-compose -f docker-compose.nginx.yml up -d
print_status "Контейнери запущено"

# Очікування запуску БД
echo ""
echo "⏳ Очікування запуску PostgreSQL..."
sleep 10

# Застосування міграцій
echo ""
echo "📊 Застосування міграцій..."
docker-compose -f docker-compose.nginx.yml exec -T backend alembic upgrade head
print_status "Міграції застосовано"

# Перевірка статусу
echo ""
echo "📋 Статус контейнерів:"
docker-compose -f docker-compose.nginx.yml ps

# Перевірка здоров'я
echo ""
echo "🏥 Перевірка здоров'я сервісів..."
sleep 5

# Backend health
if curl -s http://localhost/api/v1/health > /dev/null 2>&1; then
    print_status "Backend: OK"
else
    print_warning "Backend: перевірте логи"
fi

# Frontend health
if curl -s http://localhost/ > /dev/null 2>&1; then
    print_status "Frontend: OK"
else
    print_warning "Frontend: перевірте логи"
fi

# Nginx health
if curl -s http://localhost/health > /dev/null 2>&1; then
    print_status "Nginx: OK"
else
    print_warning "Nginx: перевірте логи"
fi

echo ""
echo "=================================="
echo -e "${GREEN}🎉 Деплой завершено!${NC}"
echo ""
echo "Сайт доступний: http://localhost"
echo "API доступний: http://localhost/api"
echo ""
echo "Для перегляду логів:"
echo "  docker-compose -f docker-compose.nginx.yml logs -f"
echo ""

