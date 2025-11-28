#!/bin/bash
# =============================================================================
# Скрипт резервного копіювання Croco Sushi
# =============================================================================

set -e

BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="croco_sushi_backup_$DATE"

echo "💾 Croco Sushi - Backup Script"
echo "=============================="

# Створення директорії для бекапів
mkdir -p $BACKUP_DIR

# Бекап бази даних
echo "📊 Створення бекапу бази даних..."
docker-compose -f docker-compose.nginx.yml exec -T postgres pg_dump \
    -U ${POSTGRES_USER:-croco} \
    ${POSTGRES_DB:-croco_sushi} \
    > "$BACKUP_DIR/${BACKUP_NAME}_db.sql"
echo "✓ База даних збережена"

# Бекап завантажених файлів
echo "📁 Створення бекапу uploads..."
tar -czf "$BACKUP_DIR/${BACKUP_NAME}_uploads.tar.gz" ./uploads
echo "✓ Uploads збережено"

# Бекап конфігурації
echo "⚙️ Створення бекапу конфігурації..."
tar -czf "$BACKUP_DIR/${BACKUP_NAME}_config.tar.gz" \
    ./nginx-config \
    ./.env \
    ./docker-compose.nginx.yml
echo "✓ Конфігурацію збережено"

# Об'єднання всіх бекапів
echo "📦 Створення загального архіву..."
tar -czf "$BACKUP_DIR/${BACKUP_NAME}.tar.gz" \
    "$BACKUP_DIR/${BACKUP_NAME}_db.sql" \
    "$BACKUP_DIR/${BACKUP_NAME}_uploads.tar.gz" \
    "$BACKUP_DIR/${BACKUP_NAME}_config.tar.gz"

# Видалення тимчасових файлів
rm -f "$BACKUP_DIR/${BACKUP_NAME}_db.sql"
rm -f "$BACKUP_DIR/${BACKUP_NAME}_uploads.tar.gz"
rm -f "$BACKUP_DIR/${BACKUP_NAME}_config.tar.gz"

# Видалення старих бекапів (старіші 7 днів)
find $BACKUP_DIR -name "croco_sushi_backup_*.tar.gz" -mtime +7 -delete

echo ""
echo "=============================="
echo "✅ Бекап завершено!"
echo "Файл: $BACKUP_DIR/${BACKUP_NAME}.tar.gz"
echo ""

# Показати розмір бекапу
ls -lh "$BACKUP_DIR/${BACKUP_NAME}.tar.gz"

