from fastapi import Request

def get_client_ip(request: Request) -> str:
    """Отримання IP адреси клієнта з урахуванням проксі"""
    # Перевірка X-Forwarded-For (якщо застосунок за проксі)
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        # Беремо перший IP (оригінальний клієнт)
        # X-Forwarded-For може містити кілька IP через кому
        client_ip = forwarded_for.split(",")[0].strip()
        # Базова валідація IP адреси
        if client_ip and len(client_ip) <= 45:  # Максимальна довжина IPv6
            return client_ip
    
    # Перевірка X-Real-IP (альтернативний заголовок)
    real_ip = request.headers.get("X-Real-IP")
    if real_ip and len(real_ip) <= 45:
        return real_ip.strip()
    
    # Fallback на стандартний спосіб
    if request.client:
        return request.client.host
    
    return "unknown"
