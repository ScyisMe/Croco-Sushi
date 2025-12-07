"""Email система для відправки листів"""
from typing import Optional, List, Dict
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
import smtplib
from pathlib import Path
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    """Сервіс для відправки email"""
    
    def __init__(self):
        self.smtp_server: Optional[str] = None
        self.smtp_port: Optional[int] = None
        self.smtp_user: Optional[str] = None
        self.smtp_password: Optional[str] = None
        self.from_email: Optional[str] = None
        self.from_name: str = "Croco Sushi"
    
    def configure(
        self,
        smtp_server: str,
        smtp_port: int,
        smtp_user: str,
        smtp_password: str,
        from_email: str,
        from_name: Optional[str] = None
    ):
        """Налаштування SMTP"""
        self.smtp_server = smtp_server
        self.smtp_port = smtp_port
        self.smtp_user = smtp_user
        self.smtp_password = smtp_password
        self.from_email = from_email
        if from_name:
            self.from_name = from_name
    
    def send_email(
        self,
        to_email: str,
        subject: str,
        body: str,
        html_body: Optional[str] = None,
        attachments: Optional[List[Dict]] = None
    ) -> bool:
        """Відправка email
        
        Args:
            to_email: Email одержувача
            subject: Тема
            body: Текстовий контент
            html_body: HTML контент (опціонально)
            attachments: Список вкладень [{"path": "...", "filename": "..."}]
        
        Returns:
            True якщо успішно
        """
        if not self.smtp_server:
            logger.warning("SMTP не налаштовано")
            return False
        
        try:
            # Створюємо повідомлення
            msg = MIMEMultipart("alternative")
            msg["From"] = f"{self.from_name} <{self.from_email}>"
            msg["To"] = to_email
            msg["Subject"] = subject
            
            # Додаємо текстову версію
            text_part = MIMEText(body, "plain", "utf-8")
            msg.attach(text_part)
            
            # Додаємо HTML версію якщо є
            if html_body:
                html_part = MIMEText(html_body, "html", "utf-8")
                msg.attach(html_part)
            
            # Додаємо вкладення якщо є
            if attachments:
                for attachment in attachments:
                    file_path = Path(attachment.get("path", ""))
                    filename = attachment.get("filename", file_path.name)
                    
                    if file_path.exists():
                        with open(file_path, "rb") as f:
                            part = MIMEBase("application", "octet-stream")
                            part.set_payload(f.read())
                            encoders.encode_base64(part)
                            part.add_header(
                                "Content-Disposition",
                                f'attachment; filename= "{filename}"'
                            )
                            msg.attach(part)
            
            # Відправляємо
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                # Try STARTTLS
                try:
                    server.starttls()
                except smtplib.SMTPNotSupportedError:
                    pass  # Skip if server doesn't support it (e.g. MailDev)
                except Exception as e:
                    logger.warning(f"SMTP STARTTLS error: {e}")

                if self.smtp_user and self.smtp_password:
                    server.login(self.smtp_user, self.smtp_password)
                
                server.send_message(msg)
            
            return True
        
        except Exception as e:
            logger.error(f"Помилка відправки email: {e}", exc_info=True)
            return False


# Глобальний інстанс
email_service = EmailService()
email_service.configure(
    smtp_server=settings.SMTP_SERVER,
    smtp_port=settings.SMTP_PORT,
    smtp_user=settings.SMTP_USER,
    smtp_password=settings.SMTP_PASSWORD,
    from_email=settings.EMAIL_FROM,
    from_name=settings.EMAIL_FROM_NAME
)


def send_email_smtp(
    to_email: str,
    subject: str,
    body: str,
    html_body: Optional[str] = None,
    attachments: Optional[List[Dict]] = None
) -> bool:
    """Допоміжна функція для відправки email"""
    return email_service.send_email(to_email, subject, body, html_body, attachments)

