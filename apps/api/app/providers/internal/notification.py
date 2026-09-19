from typing import List, Dict
from ..contracts import NotificationProvider


class InternalNotificationProvider(NotificationProvider):
    def __init__(self):
        self._sent_notifications: List[Dict[str, str]] = []

    async def send_notification(self, recipient: str, title: str, message: str) -> bool:
        self._sent_notifications.append({
            "recipient": recipient,
            "title": title,
            "message": message,
        })
        return True

    def get_notifications(self) -> List[Dict[str, str]]:
        return list(self._sent_notifications)
