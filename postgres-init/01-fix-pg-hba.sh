#!/bin/sh
# Fix pg_hba.conf for localhost and Docker network connections
# This script runs after PostgreSQL is initialized

# Wait for PostgreSQL to be ready
until pg_isready -U postgres > /dev/null 2>&1; do
  sleep 1
done

# Fix pg_hba.conf - remove old rules and add new ones
sed -i '/^host all all 127.0.0.1/d' /var/lib/postgresql/data/pg_hba.conf
sed -i '/^host all all ::1/d' /var/lib/postgresql/data/pg_hba.conf
sed -i '/^host all all 0.0.0.0/d' /var/lib/postgresql/data/pg_hba.conf
sed -i '/^host all all ::\/0/d' /var/lib/postgresql/data/pg_hba.conf
sed -i '/^host all all 172\.22\./d' /var/lib/postgresql/data/pg_hba.conf

# Add rules in correct order (specific first, then general)
# Trust for localhost (127.0.0.1 and ::1)
echo 'host all all 127.0.0.1/32 trust' >> /var/lib/postgresql/data/pg_hba.conf
echo 'host all all ::1/128 trust' >> /var/lib/postgresql/data/pg_hba.conf
# MD5 for Docker network (172.22.0.0/16) - requires password
echo 'host all all 172.22.0.0/16 md5' >> /var/lib/postgresql/data/pg_hba.conf
# MD5 for all other connections (fallback)
echo 'host all all 0.0.0.0/0 md5' >> /var/lib/postgresql/data/pg_hba.conf
echo 'host all all ::/0 md5' >> /var/lib/postgresql/data/pg_hba.conf

# Reload configuration
psql -U postgres -c 'SELECT pg_reload_conf();' > /dev/null 2>&1

# Set password for postgres user (for md5 connections)
# Get password from environment variable or use default
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-Lavanda1488}"
# Set password encryption to md5 for compatibility
psql -U postgres -c "SET password_encryption = 'md5';" > /dev/null 2>&1
psql -U postgres -c "ALTER USER postgres WITH PASSWORD '${POSTGRES_PASSWORD}';" > /dev/null 2>&1

echo "pg_hba.conf configured successfully"
