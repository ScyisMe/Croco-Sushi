# 🐊 Налаштування Nginx для Croco Sushi

## Структура файлів

```
nginx-config/
├── nginx.conf           # Головна конфігурація Nginx
├── conf.d/
│   └── default.conf     # Конфігурація сайту
└── ssl/
    ├── fullchain.pem    # SSL сертифікат (для HTTPS)
    ├── privkey.pem      # Приватний ключ
    └── chain.pem        # Ланцюжок сертифікатів
```

## Швидкий старт

### 1. Скопіюйте env.example в .env

```bash
cp env.example .env
```

Відредагуйте `.env` та встановіть свої значення:
- `SECRET_KEY` - секретний ключ для JWT
- `POSTGRES_PASSWORD` - пароль бази даних
- та інші...

### 2. Запустіть проект

```bash
# Запуск всіх сервісів
docker-compose -f docker-compose.nginx.yml up -d

# Або використовуйте скрипт деплою
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

### 3. Перевірте статус

```bash
# Статус контейнерів
docker-compose -f docker-compose.nginx.yml ps

# Логи
docker-compose -f docker-compose.nginx.yml logs -f nginx
```

## Порти

| Сервіс | Внутрішній порт | Зовнішній порт |
|--------|-----------------|----------------|
| Nginx  | 80, 443         | 80, 443        |
| Backend| 8000            | (internal)     |
| Frontend| 3000           | (internal)     |
| PostgreSQL| 5432         | (internal)     |
| Redis  | 6379            | (internal)     |

## Налаштування SSL (HTTPS)

### Варіант 1: Let's Encrypt (безкоштовно)

```bash
chmod +x scripts/ssl-setup.sh
./scripts/ssl-setup.sh crocosushi.com.ua admin@crocosushi.com.ua
```

Після отримання сертифіката розкоментуйте в `nginx-config/conf.d/default.conf`:
- SSL listener (443 порт)
- SSL сертифікати
- HTTPS редірект

### Варіант 2: Власний сертифікат

Покладіть ваші сертифікати в `nginx-config/ssl/`:
- `fullchain.pem` - повний ланцюжок сертифікатів
- `privkey.pem` - приватний ключ
- `chain.pem` - проміжні сертифікати

## Rate Limiting

Nginx налаштовано з наступними обмеженнями:

| Зона | Ліміт | Призначення |
|------|-------|-------------|
| general | 10 req/s | Загальні запити |
| api | 30 req/s | API запити |
| auth | 5 req/s | Авторизація |

## Кешування

- **Статичні файли Next.js** (`/_next/static/`) - 1 рік
- **Оптимізовані зображення** (`/_next/image`) - 7 днів
- **Завантажені файли** (`/uploads/`) - 30 днів

## Gzip стиснення

Увімкнено для:
- JavaScript
- CSS
- JSON
- XML
- SVG
- шрифти

## Моніторинг

### Health checks

- `http://localhost/health` - перевірка Nginx
- `http://localhost/nginx-status` - статистика Nginx (тільки localhost)
- `http://localhost/api/v1/health` - перевірка Backend

### Логи

```bash
# Nginx логи
docker-compose -f docker-compose.nginx.yml logs nginx

# Backend логи
docker-compose -f docker-compose.nginx.yml logs backend

# Всі логи
docker-compose -f docker-compose.nginx.yml logs -f
```

## Резервне копіювання

```bash
chmod +x scripts/backup.sh
./scripts/backup.sh
```

Бекапи зберігаються в `./backups/` та автоматично видаляються через 7 днів.

## Корисні команди

```bash
# Перезапуск Nginx
docker-compose -f docker-compose.nginx.yml restart nginx

# Перевірка конфігурації Nginx
docker-compose -f docker-compose.nginx.yml exec nginx nginx -t

# Перезавантаження конфігурації без downtime
docker-compose -f docker-compose.nginx.yml exec nginx nginx -s reload

# Оновлення образів
docker-compose -f docker-compose.nginx.yml pull
docker-compose -f docker-compose.nginx.yml up -d

# Повна зупинка
docker-compose -f docker-compose.nginx.yml down

# Видалення з volumes
docker-compose -f docker-compose.nginx.yml down -v
```

## Troubleshooting

### 502 Bad Gateway

```bash
# Перевірте чи backend запущено
docker-compose -f docker-compose.nginx.yml ps backend
docker-compose -f docker-compose.nginx.yml logs backend
```

### 504 Gateway Timeout

Збільшіть таймаути в `nginx-config/conf.d/default.conf`:
```nginx
proxy_connect_timeout 120s;
proxy_send_timeout 120s;
proxy_read_timeout 120s;
```

### Permission denied для uploads

```bash
chmod -R 755 ./uploads
```

## Безпека

- ✅ Заголовки безпеки (X-Frame-Options, X-Content-Type-Options, etc.)
- ✅ Rate limiting проти DDoS
- ✅ Приховано версію Nginx
- ✅ Заборонено доступ до .env та інших системних файлів
- ✅ HTTPS підтримка (налаштуйте SSL)

