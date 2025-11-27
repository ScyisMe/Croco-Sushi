#!/bin/bash
# =============================================================================
# Скрипт налаштування SSL сертифікатів (Let's Encrypt)
# =============================================================================

set -e

DOMAIN=${1:-crocosushi.com.ua}
EMAIL=${2:-admin@crocosushi.com.ua}

echo "🔐 Налаштування SSL для $DOMAIN"
echo "=================================="

# Перевірка наявності certbot
if ! command -v certbot &> /dev/null; then
    echo "Встановлення certbot..."
    apt-get update
    apt-get install -y certbot
fi

# Створення директорії для certbot
mkdir -p /var/www/certbot

# Отримання сертифіката
echo "Отримання SSL сертифіката..."
certbot certonly \
    --webroot \
    -w /var/www/certbot \
    -d $DOMAIN \
    -d www.$DOMAIN \
    --email $EMAIL \
    --agree-tos \
    --non-interactive

# Копіювання сертифікатів
echo "Копіювання сертифікатів..."
mkdir -p nginx-config/ssl
cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem nginx-config/ssl/
cp /etc/letsencrypt/live/$DOMAIN/privkey.pem nginx-config/ssl/
cp /etc/letsencrypt/live/$DOMAIN/chain.pem nginx-config/ssl/

# Налаштування автооновлення
echo "Налаштування автооновлення..."
(crontab -l 2>/dev/null; echo "0 0 1 * * certbot renew --quiet && docker-compose -f docker-compose.nginx.yml exec nginx nginx -s reload") | crontab -

echo ""
echo "✅ SSL налаштовано!"
echo ""
echo "Тепер розкоментуйте SSL налаштування в nginx-config/conf.d/default.conf"
echo "та перезапустіть nginx:"
echo "  docker-compose -f docker-compose.nginx.yml restart nginx"

