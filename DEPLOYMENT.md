# 🚀 Croco Sushi VPS Deployment Guide

This guide will help you deploy the Croco Sushi project to a fresh Ubuntu VPS (22.04 or newer).

## 1. Prerequisites
- A VPS with Ubuntu 22.04+ (Recommended: Hetzner CPX21 or DigitalOcean 4GB Droplet).
- SSH access to the server.
- A domain name pointing to your server's IP (A records for `@` and `www`).

## 2. Server Setup
Login to your server via SSH:
```bash
ssh root@your-server-ip
```

### Update System and Install Basics
```bash
apt update && apt upgrade -y
apt install -y curl git ufw
```

### Configure Firewall (Optional but Recommended)
```bash
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

## 3. Install Docker & Docker Compose
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
rm get-docker.sh
```

## 4. Setup Project

### Clone Repository
```bash
cd /opt
git clone https://github.com/ScyisMe/Croco-Sushi.git
cd Croco-Sushi
```

### Configure Environment Variables
Copy the production environment example:
```bash
cp production.env .env
```
**IMPORTANT:** Edit the `.env` file to set your secure passwords and domain:
```bash
nano .env
```
- Set `POSTGRES_PASSWORD` to a strong unique password.
- Set `SECRET_KEY` and `JWT_SECRET_KEY` to long random strings (e.g., use `openssl rand -hex 32`).
- Ensure `CORS_ORIGINS` includes your actual domain (e.g., `https://your-domain.com`).
- Ensure `NEXT_PUBLIC_API_URL` points to `https://your-domain.com`.

## 5. Deployment

### Build and Start Containers
We use the production compose file:
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### Verify Status
Check if all containers are running:
```bash
docker compose -f docker-compose.prod.yml ps
```

### Run Migrations
Initialize the database:
```bash
docker compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

### Create Admin User
Create an initial superuser for the dashboard:
```bash
docker compose -f docker-compose.prod.yml exec backend python create_admin.py
```

## 6. Maintenance

### View Logs
```bash
docker compose -f docker-compose.prod.yml logs -f backend
```

### Update Application
To deploy new code from GitHub:
```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build
```
