import re
import unicodedata


def slugify(text: str) -> str:
    """
    Генерація slug з тексту
    Приклад: "Роли Філадельфія" -> "roli-filadelfiya"
    """
    # Нормалізація Unicode (конвертація кирилиці в латиницю)
    text = unicodedata.normalize('NFKD', text)
    
    # Конвертація в нижній регістр
    text = text.lower()
    
    # Заміна пробілів та спецсимволів на дефіси
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[-\s]+', '-', text)
    
    # Видалення дефісів на початку та в кінці
    text = text.strip('-')
    
    return text


