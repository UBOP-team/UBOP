import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.events import Event
from app.modules.workflow.service import WorkflowEngine


@pytest.mark.asyncio
async def test_providers_health():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/v1/providers/health")
        assert res.status_code == 200
        data = res.json()
        assert "stripe" in data
        assert "shopify" in data
        assert "slack" in data
        assert "telegram" in data
        assert "redis" in data


@pytest.mark.asyncio
async def test_providers_ping_internal():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.post("/api/v1/providers/ping/internal_oms")
        assert res.status_code == 200
        data = res.json()
        assert data["success"] is True
        assert data["provider"] == "internal_oms"
        assert "latency_ms" in data


@pytest.mark.asyncio
async def test_providers_ping_stripe():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.post("/api/v1/providers/ping/stripe")
        assert res.status_code == 200
        data = res.json()
        assert "success" in data
        assert data["provider"] == "stripe"
        assert "latency_ms" in data


@pytest.mark.asyncio
async def test_providers_ping_shopify():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.post("/api/v1/providers/ping/shopify")
        assert res.status_code == 200
        data = res.json()
        assert "success" in data
        assert data["provider"] == "shopify"


@pytest.mark.asyncio
async def test_providers_ping_redis():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.post("/api/v1/providers/ping/redis")
        assert res.status_code == 200
        data = res.json()
        assert "success" in data
        assert data["provider"] == "redis"


@pytest.mark.asyncio
async def test_workflow_engine_execute_action():
    engine = WorkflowEngine()
    event = Event(name="order.created", payload={"order_id": "ORD-1234", "amount": 99.0})

    # Test Notify Action
    res = await engine.execute_action(
        action_type="NOTIFY",
        action_payload_str='{"channel": "operations-alert"}',
        event=event,
    )
    assert res["status"] in ("SUCCESS", "FAILED")
    assert "ms]" in res["output"].lower() or "dispatched" in res["output"].lower()

    # Test Payment Action
    p_res = await engine.execute_action(
        action_type="STRIPE_CHARGE",
        action_payload_str='{}',
        event=event,
    )
    assert p_res["status"] in ("SUCCESS", "FAILED")
    assert "ms]" in p_res["output"].lower()
