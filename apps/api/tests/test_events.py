import pytest
from app.core.events import Event, EventBus


@pytest.mark.asyncio
async def test_event_bus_publish_subscribe():
    bus = EventBus()
    received_events = []

    def on_custom_event(event: Event):
        received_events.append(event)

    bus.subscribe("custom.test", on_custom_event)

    ev = Event("custom.test", {"message": "hello UBOP"})
    await bus.publish(ev)

    assert len(received_events) == 1
    assert received_events[0].payload["message"] == "hello UBOP"
    assert len(bus.get_history()) == 1


@pytest.mark.asyncio
async def test_event_bus_wildcard_subscription():
    bus = EventBus()
    wildcard_received = []

    async def on_all_events(event: Event):
        wildcard_received.append(event)

    bus.subscribe("*", on_all_events)

    await bus.publish(Event("order.created", {"order_id": 123}))
    await bus.publish(Event("customer.created", {"customer_id": 456}))

    assert len(wildcard_received) == 2
    assert wildcard_received[0].name == "order.created"
    assert wildcard_received[1].name == "customer.created"
