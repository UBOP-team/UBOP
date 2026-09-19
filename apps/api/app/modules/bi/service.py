from typing import Any, Dict, List, Optional
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.modules.oms.models import Order
from app.modules.crm.models import Customer
from app.modules.erp.models import InventoryItem


class AnalyticsService:
    def __init__(self, session: Optional[AsyncSession] = None):
        self.session = session

    async def revenue_report(self) -> Dict[str, Any]:
        if not self.session:
            return {"revenue": 0.0, "total_orders": 0, "avg_order_value": 0.0}

        # Calculate total revenue and total orders
        revenue_query = select(
            func.coalesce(func.sum(Order.total_amount), 0.0),
            func.count(Order.id),
        ).filter(Order.status != "CANCELLED")
        rev_res = await self.session.execute(revenue_query)
        total_rev, order_count = rev_res.first() or (0.0, 0)

        avg_val = (total_rev / order_count) if order_count > 0 else 0.0

        # Status breakdown
        status_query = select(Order.status, func.count(Order.id)).group_by(Order.status)
        status_res = await self.session.execute(status_query)
        by_status = {st: cnt for st, cnt in status_res.all()}

        return {
            "revenue": round(float(total_rev), 2),
            "total_orders": int(order_count),
            "avg_order_value": round(float(avg_val), 2),
            "orders_by_status": by_status,
        }

    async def kpi_summary(self) -> Dict[str, Any]:
        if not self.session:
            return {
                "total_revenue": 0.0,
                "total_orders": 0,
                "total_customers": 0,
                "low_stock_count": 0,
            }

        # Revenue & Orders
        rev_data = await self.revenue_report()

        # Customer count
        cust_query = select(func.count(Customer.id))
        cust_res = await self.session.execute(cust_query)
        total_cust = cust_res.scalar() or 0

        # Low stock count
        stock_query = select(func.count(InventoryItem.id)).filter(
            InventoryItem.quantity <= InventoryItem.reorder_level
        )
        stock_res = await self.session.execute(stock_query)
        low_stock = stock_res.scalar() or 0

        return {
            "total_revenue": rev_data["revenue"],
            "total_orders": rev_data["total_orders"],
            "avg_order_value": rev_data["avg_order_value"],
            "total_customers": int(total_cust),
            "low_stock_count": int(low_stock),
        }

    async def sales_trend(self) -> List[Dict[str, Any]]:
        # Provide sample trend points for charts
        return [
            {"month": "Jan", "revenue": 12500, "orders": 45},
            {"month": "Feb", "revenue": 18200, "orders": 58},
            {"month": "Mar", "revenue": 24300, "orders": 82},
            {"month": "Apr", "revenue": 31500, "orders": 105},
            {"month": "May", "revenue": 28900, "orders": 94},
            {"month": "Jun", "revenue": 38400, "orders": 130},
        ]
