import asyncio
import sys
import os
from pathlib import Path

# Додаємо кореневу директорію до шляхів пошуку модулів, щоб можна було імпортувати app
sys.path.append(str(Path(__file__).parent.parent))

from app.core.config import settings
from app.core.email import send_email_smtp

def test_email(to_email: str):
    print(f"--- Тестування відправки Email ---")
    print(f"SMTP Server: {settings.SMTP_SERVER}")
    print(f"SMTP Port: {settings.SMTP_PORT}")
    print(f"SMTP User: {settings.SMTP_USER}")
    print(f"From: {settings.EMAIL_FROM}")
    print(f"----------------------------------")
    
    if not settings.SMTP_SERVER:
        print("ПОМИЛКА: SMTP сервер не налаштовано в .env файлі!")
        return

    print(f"Спроба відправити тестовий лист на {to_email}...")
    
    subject = "Тестовий лист Croco Sushi"
    body = "Це тестовий лист для перевірки налаштувань SMTP."
    html_body = """
    <div style="font-family: Arial; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
        <h1 style="color: #10b981;">SMTP Працює! ✅</h1>
        <p>Якщо ви бачите цей лист, значить налаштування пошти вірні.</p>
    </div>
    """
    
    try:
        success = send_email_smtp(
            to_email=to_email,
            subject=subject,
            body=body,
            html_body=html_body
        )
        
        if success:
            print("\n✅ УСПІХ: Лист відправлено успішно!")
            print(f"Перевірте поштову скриньку {to_email}")
        else:
            print("\n❌ ПОМИЛКА: Функція повернула False. Перевірте логи.")
            
    except Exception as e:
        print(f"\n❌ КРИТИЧНА ПОМИЛКА: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Використання: python scripts/test_email.py <email_отримувача>")
        # Спробуємо взяти email з налаштувань або дефолтний, якщо аргумент не передано
        default_email = settings.EMAIL_FROM or "test@example.com"
        print(f"Спроба відправити на дефолтний email: {default_email}")
        test_email(default_email)
    else:
        test_email(sys.argv[1])
