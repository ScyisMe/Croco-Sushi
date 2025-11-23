"""SMS система для відправки повідомлень"""
from typing import Optional
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


class SMSService:
    """Сервіс для відправки SMS"""
    
    def __init__(self):
        self.provider: Optional[str] = None
        self.api_key: Optional[str] = None
        self.api_secret: Optional[str] = None
        self.from_number: Optional[str] = None
    
    def configure(
        self,
        provider: str,  # "twilio", "smsru", "smsaero", тощо
        api_key: str,
        api_secret: Optional[str] = None,
        from_number: Optional[str] = None
    ):
        """Налаштування SMS провайдера"""
        self.provider = provider
        self.api_key = api_key
        self.api_secret = api_secret
        self.from_number = from_number
    
    def send_sms(self, phone: str, message: str) -> bool:
        """Відправка SMS
        
        Args:
            phone: Номер телефону (формат +380XXXXXXXXX)
            message: Текст повідомлення
        
        Returns:
            True якщо успішно
        """
        if not self.provider or not self.api_key:
            logger.warning("SMS провайдер не налаштовано")
            return False
        
        try:
            # TODO: Інтеграція з конкретними провайдерами
            # Приклад для Twilio:
            # if self.provider == "twilio":
            #     from twilio.rest import Client
            #     client = Client(self.api_key, self.api_secret)
            #     message = client.messages.create(
            #         body=message,
            #         from_=self.from_number,
            #         to=phone
            #     )
            #     return message.sid is not None
            
            # Приклад для SMS.ru:
            # if self.provider == "smsru":
            #     import requests
            #     url = "https://sms.ru/sms/send"
            #     params = {
            #         "api_id": self.api_key,
            #         "to": phone,
            #         "msg": message
            #     }
            #     response = requests.get(url, params=params)
            #     return response.status_code == 200
            
            # Тимчасова заглушка
            logger.info(f"SMS відправлено: {phone}")
            return True
        
        except Exception as e:
            logger.error(f"Помилка відправки SMS: {e}", exc_info=True)
            return False


# Глобальний інстанс
sms_service = SMSService()


def send_sms_via_provider(phone: str, message: str) -> bool:
    """Допоміжна функція для відправки SMS"""
    return sms_service.send_sms(phone, message)

