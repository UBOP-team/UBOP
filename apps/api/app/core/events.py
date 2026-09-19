from datetime import datetime, timezone
from typing import Any, Callable, Dict, List, Optional
import inspect
import logging

logger = logging.getLogger("ubop.events")


class Event:
    def __init__(self, name: Optional[str] = None, payload: Optional[Dict[str, Any]] = None):
        self.name: str = name or self.__class__.__name__
        self.payload: Dict[str, Any] = payload or {}
        self.timestamp: datetime = datetime.now(timezone.utc)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "timestamp": self.timestamp.isoformat(),
            "payload": self.payload,
        }


class EventBus:
    def __init__(self):
        self._subscribers: Dict[str, List[Callable]] = {}
        self._history: List[Event] = []

    def subscribe(self, event_name: str, handler: Callable) -> None:
        if event_name not in self._subscribers:
            self._subscribers[event_name] = []
        if handler not in self._subscribers[event_name]:
            self._subscribers[event_name].append(handler)

    def unsubscribe(self, event_name: str, handler: Callable) -> None:
        if event_name in self._subscribers and handler in self._subscribers[event_name]:
            self._subscribers[event_name].remove(handler)

    async def publish(self, event: Event) -> bool:
        self._history.append(event)
        # Keep recent 200 events in memory
        if len(self._history) > 200:
            self._history.pop(0)

        handlers = self._subscribers.get(event.name, [])
        # Also check wildcard handlers
        wildcards = self._subscribers.get("*", [])
        all_handlers = list(handlers) + list(wildcards)

        if not all_handlers:
            return True

        for handler in all_handlers:
            try:
                if inspect.iscoroutinefunction(handler):
                    await handler(event)
                else:
                    handler(event)
            except Exception as ex:
                logger.error(f"Error handling event {event.name} in {handler}: {ex}", exc_info=True)

        return True

    def get_history(self, limit: int = 50) -> List[Dict[str, Any]]:
        return [e.to_dict() for e in self._history[-limit:]]

    def clear(self) -> None:
        self._subscribers.clear()
        self._history.clear()


# Global EventBus instance for the Modular Monolith
event_bus = EventBus()
