import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import init_db
import asyncio


@pytest.fixture(scope="session", autouse=True)
def setup_db():
    # Run init_db synchronously for the test session
    loop = asyncio.new_event_loop()
    loop.run_until_complete(init_db())
    loop.close()


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c
