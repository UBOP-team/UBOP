import time
import logging
from typing import Any, Dict, Optional
import httpx
from app.core.config import settings

logger = logging.getLogger("ubop.providers.live")


class StripeClient:
    """Real Stripe API Client for Payments, Refunds, and Latency Handshake."""

    BASE_URL = "https://api.stripe.com/v1"

    @property
    def api_key(self) -> str:
        return settings.STRIPE_SECRET_KEY

    async def test_connection(self) -> Dict[str, Any]:
        if not self.api_key:
            return {
                "success": False,
                "provider": "stripe",
                "status_code": 400,
                "latency_ms": 0,
                "message": "STRIPE_SECRET_KEY is not configured in root .env",
            }

        start = time.perf_counter()
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.get(
                    f"{self.BASE_URL}/balance",
                    headers={"Authorization": f"Bearer {self.api_key}"},
                )
                latency = round((time.perf_counter() - start) * 1000)

                if res.status_code == 200:
                    data = res.json()
                    return {
                        "success": True,
                        "provider": "stripe",
                        "status_code": 200,
                        "latency_ms": latency,
                        "message": "Stripe Live API Handshake Verified.",
                        "details": {
                            "livemode": data.get("livemode", False),
                            "currencies": [b.get("currency") for b in data.get("available", [])],
                        },
                    }
                else:
                    err = res.json().get("error", {}).get("message", res.text)
                    return {
                        "success": False,
                        "provider": "stripe",
                        "status_code": res.status_code,
                        "latency_ms": latency,
                        "message": f"Stripe Error ({res.status_code}): {err}",
                    }
        except Exception as exc:
            latency = round((time.perf_counter() - start) * 1000)
            return {
                "success": False,
                "provider": "stripe",
                "status_code": 500,
                "latency_ms": latency,
                "message": f"Stripe Network Exception: {str(exc)}",
            }

    async def create_payment_intent(
        self, amount_dollars: float, currency: str = "usd", order_id: Optional[str] = None
    ) -> Dict[str, Any]:
        if not self.api_key:
            raise ValueError("STRIPE_SECRET_KEY not set")

        amount_cents = int(amount_dollars * 100)
        data = {
            "amount": str(amount_cents),
            "currency": currency.lower(),
        }
        if order_id:
            data["metadata[order_id]"] = str(order_id)

        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.post(
                f"{self.BASE_URL}/payment_intents",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                data=data,
            )
            return {"status_code": res.status_code, "data": res.json()}


class ShopifyClient:
    """Real Shopify Admin REST API Client for Orders, Products, and Shop Handshake."""

    @property
    def domain(self) -> str:
        return settings.SHOPIFY_SHOP_DOMAIN.strip().replace("https://", "").replace("http://", "")

    @property
    def token(self) -> str:
        return settings.SHOPIFY_ADMIN_API_ACCESS_TOKEN

    @property
    def version(self) -> str:
        return settings.SHOPIFY_API_VERSION or "2024-07"

    async def test_connection(self) -> Dict[str, Any]:
        if not self.domain or not self.token:
            return {
                "success": False,
                "provider": "shopify",
                "status_code": 400,
                "latency_ms": 0,
                "message": "SHOPIFY_SHOP_DOMAIN or SHOPIFY_ADMIN_API_ACCESS_TOKEN missing in root .env",
            }

        start = time.perf_counter()
        url = f"https://{self.domain}/admin/api/{self.version}/shop.json"
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.get(
                    url,
                    headers={
                        "X-Shopify-Access-Token": self.token,
                        "Content-Type": "application/json",
                    },
                )
                latency = round((time.perf_counter() - start) * 1000)

                if res.status_code == 200:
                    shop = res.json().get("shop", {})
                    return {
                        "success": True,
                        "provider": "shopify",
                        "status_code": 200,
                        "latency_ms": latency,
                        "message": f"Shopify Connected: {shop.get('name', self.domain)}",
                        "details": {
                            "shop_name": shop.get("name"),
                            "currency": shop.get("currency"),
                            "email": shop.get("email"),
                            "domain": shop.get("domain"),
                        },
                    }
                else:
                    return {
                        "success": False,
                        "provider": "shopify",
                        "status_code": res.status_code,
                        "latency_ms": latency,
                        "message": f"Shopify Handshake Failed ({res.status_code}): {res.text[:120]}",
                    }
        except Exception as exc:
            latency = round((time.perf_counter() - start) * 1000)
            return {
                "success": False,
                "provider": "shopify",
                "status_code": 500,
                "latency_ms": latency,
                "message": f"Shopify Network Connection Error: {str(exc)}",
            }

    async def get_orders(self, limit: int = 10) -> Dict[str, Any]:
        url = f"https://{self.domain}/admin/api/{self.version}/orders.json?status=any&limit={limit}"
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.get(
                url,
                headers={"X-Shopify-Access-Token": self.token},
            )
            return {"status_code": res.status_code, "data": res.json()}


class SlackClient:
    """Real Slack Client for Webhook and Bot Dispatch."""

    @property
    def webhook_url(self) -> str:
        return settings.SLACK_WEBHOOK_URL

    async def test_connection(self) -> Dict[str, Any]:
        if not self.webhook_url:
            return {
                "success": False,
                "provider": "slack",
                "status_code": 400,
                "latency_ms": 0,
                "message": "SLACK_WEBHOOK_URL is not configured in root .env",
            }

        start = time.perf_counter()
        try:
            # Send real synthetic ping message
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.post(
                    self.webhook_url,
                    json={
                        "text": "🟢 *UBOP Platform Alert*: External Handshake Ping Verified successfully."
                    },
                )
                latency = round((time.perf_counter() - start) * 1000)
                if res.status_code == 200:
                    return {
                        "success": True,
                        "provider": "slack",
                        "status_code": 200,
                        "latency_ms": latency,
                        "message": "Slack Webhook Verified & Notification Delivered.",
                    }
                else:
                    return {
                        "success": False,
                        "provider": "slack",
                        "status_code": res.status_code,
                        "latency_ms": latency,
                        "message": f"Slack Webhook Rejected: {res.text}",
                    }
        except Exception as exc:
            latency = round((time.perf_counter() - start) * 1000)
            return {
                "success": False,
                "provider": "slack",
                "status_code": 500,
                "latency_ms": latency,
                "message": f"Slack Handshake Error: {str(exc)}",
            }

    async def send_message(self, text: str) -> Dict[str, Any]:
        if not self.webhook_url:
            raise ValueError("SLACK_WEBHOOK_URL is not configured")

        async with httpx.AsyncClient(timeout=8.0) as client:
            res = await client.post(self.webhook_url, json={"text": text})
            return {"status_code": res.status_code, "text": res.text}


class TelegramClient:
    """Real Telegram Bot API Client."""

    @property
    def token(self) -> str:
        return settings.TELEGRAM_BOT_TOKEN

    @property
    def chat_id(self) -> str:
        return settings.TELEGRAM_CHAT_ID

    async def test_connection(self) -> Dict[str, Any]:
        if not self.token:
            return {
                "success": False,
                "provider": "telegram",
                "status_code": 400,
                "latency_ms": 0,
                "message": "TELEGRAM_BOT_TOKEN is not configured in root .env",
            }

        start = time.perf_counter()
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.get(f"https://api.telegram.org/bot{self.token}/getMe")
                latency = round((time.perf_counter() - start) * 1000)

                if res.status_code == 200:
                    bot_data = res.json().get("result", {})
                    return {
                        "success": True,
                        "provider": "telegram",
                        "status_code": 200,
                        "latency_ms": latency,
                        "message": f"Telegram Bot Verified: @{bot_data.get('username')}",
                    }
                else:
                    return {
                        "success": False,
                        "provider": "telegram",
                        "status_code": res.status_code,
                        "latency_ms": latency,
                        "message": f"Telegram API Error: {res.text}",
                    }
        except Exception as exc:
            latency = round((time.perf_counter() - start) * 1000)
            return {
                "success": False,
                "provider": "telegram",
                "status_code": 500,
                "latency_ms": latency,
                "message": f"Telegram Network Error: {str(exc)}",
            }

    async def send_message(self, text: str) -> Dict[str, Any]:
        if not self.token or not self.chat_id:
            raise ValueError("TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID missing")

        async with httpx.AsyncClient(timeout=8.0) as client:
            res = await client.post(
                f"https://api.telegram.org/bot{self.token}/sendMessage",
                json={"chat_id": self.chat_id, "text": text, "parse_mode": "Markdown"},
            )
            return {"status_code": res.status_code, "data": res.json()}


# Singletons
stripe_client = StripeClient()
shopify_client = ShopifyClient()
slack_client = SlackClient()
telegram_client = TelegramClient()
