import time


def test_create_order_canonical(client):
    unique_cust_email = f"buyer_{int(time.time()*1000)}@shopifytest.com"
    cust_res = client.post(
        "/api/v1/crm/customers",
        json={"name": "Acme Industrial", "email": unique_cust_email, "status": "ACTIVE"},
    )
    customer_id = cust_res.json()["id"]

    order_payload = {
        "customer_id": customer_id,
        "customer_name": "Acme Industrial",
        "customer_email": unique_cust_email,
        "shipping_address": "88 Logistics Blvd, Chicago, IL 60601",
        "source_type": "SHOPIFY",
        "external_order_id": "SH-99214",
        "tax_total": 200.0,
        "items": [
            {"product_id": 1, "sku": "BOX-BLU-20", "product_name": "Container A", "quantity": 10, "unit_price": 200.0},
            {"product_id": 2, "sku": "LID-BLU-20", "product_name": "Lid B", "quantity": 10, "unit_price": 50.0},
        ],
    }
    res = client.post("/api/v1/oms/orders", json=order_payload)
    assert res.status_code == 201, res.text
    data = res.json()

    assert data["order_number"].startswith("ORD-")
    assert data["source_type"] == "SHOPIFY"
    assert data["external_order_id"] == "SH-99214"
    assert data["order_state"] == "OPEN"
    assert data["payment_state"] == "UNPAID"
    assert data["fulfillment_state"] == "UNFULFILLED"
    assert data["return_state"] == "NONE"
    assert data["sync_status"] == "HEALTHY"

    # Financial breakdown: subtotal = 10*200 + 10*50 = 2500; tax = 2500 * 0.08 = 200; grand_total = 2700
    assert data["subtotal"] == 2500.0
    assert data["tax_total"] == 200.0
    assert data["grand_total"] == 2700.0
    assert data["total_amount"] == 2700.0
    assert len(data["lines"]) == 2
    assert len(data["events"]) >= 1


def test_payment_and_fulfillment_journey(client):
    order_payload = {
        "customer_name": "Global Corp",
        "items": [
            {"sku": "ITEM-1", "product_name": "Server Unit", "quantity": 5, "unit_price": 1000.0},
        ],
    }
    create_res = client.post("/api/v1/oms/orders", json=order_payload)
    assert create_res.status_code == 201
    order_id = create_res.json()["id"]
    grand_total = create_res.json()["grand_total"]

    # 1. Partial Payment
    pay_partial_res = client.post(
        f"/api/v1/oms/orders/{order_id}/payments",
        json={"amount": 2000.0, "payment_method": "BANK_TRANSFER", "reference": "WIRE-01"},
    )
    assert pay_partial_res.status_code == 200
    assert pay_partial_res.json()["payment_state"] == "PARTIALLY_PAID"

    # 2. Remaining Payment -> Fully PAID
    remaining = grand_total - 2000.0
    pay_full_res = client.post(
        f"/api/v1/oms/orders/{order_id}/payments",
        json={"amount": remaining, "payment_method": "BANK_TRANSFER", "reference": "WIRE-02"},
    )
    assert pay_full_res.status_code == 200
    assert pay_full_res.json()["payment_state"] == "PAID"

    # 3. Partial Fulfillment: fulfill 2 of 5
    line_id = pay_full_res.json()["lines"][0]["id"]
    fulfill_partial_res = client.post(
        f"/api/v1/oms/orders/{order_id}/fulfillments",
        json={
            "location_reference": "MAIN",
            "carrier": "FedEx Ground",
            "tracking_number": "FX-112233",
            "items": [{"order_line_id": line_id, "quantity": 2}],
        },
    )
    assert fulfill_partial_res.status_code == 200
    assert fulfill_partial_res.json()["fulfillment_state"] == "PARTIALLY_FULFILLED"

    # 4. Reject over-fulfillment: try to fulfill 5 more when only 3 remain
    over_res = client.post(
        f"/api/v1/oms/orders/{order_id}/fulfillments",
        json={
            "location_reference": "MAIN",
            "items": [{"order_line_id": line_id, "quantity": 5}],
        },
    )
    assert over_res.status_code == 400
    assert "Remaining fulfillable quantity is 3" in over_res.json()["detail"]

    # 5. Fulfill remaining 3 items -> Fully FULFILLED
    fulfill_rem_res = client.post(
        f"/api/v1/oms/orders/{order_id}/fulfillments",
        json={
            "location_reference": "MAIN",
            "carrier": "FedEx Express",
            "tracking_number": "FX-445566",
            "items": [{"order_line_id": line_id, "quantity": 3}],
        },
    )
    assert fulfill_rem_res.status_code == 200
    assert fulfill_rem_res.json()["fulfillment_state"] == "FULFILLED"
    assert len(fulfill_rem_res.json()["fulfillments"]) == 2


def test_return_and_refund_lifecycle(client):
    order_payload = {
        "customer_name": "Apex Returns Ltd",
        "items": [
            {"sku": "RET-ITEM", "product_name": "Industrial Sensor", "quantity": 4, "unit_price": 500.0},
        ],
    }
    create_res = client.post("/api/v1/oms/orders", json=order_payload)
    order_id = create_res.json()["id"]
    grand_total = create_res.json()["grand_total"]
    line_id = create_res.json()["lines"][0]["id"]

    # Pay order
    client.post(
        f"/api/v1/oms/orders/{order_id}/payments",
        json={"amount": grand_total, "payment_method": "CREDIT_CARD"},
    )

    # Fulfill order
    client.post(
        f"/api/v1/oms/orders/{order_id}/fulfillments",
        json={
            "location_reference": "MAIN",
            "carrier": "DHL",
            "tracking_number": "DHL-991122",
            "items": [{"order_line_id": line_id, "quantity": 4}],
        },
    )

    # 1. Create Return for 2 items
    return_res = client.post(
        f"/api/v1/oms/orders/{order_id}/returns",
        json={
            "reason_summary": "Customer reported 2 defective sensors",
            "items": [{"order_line_id": line_id, "quantity": 2, "reason": "DAMAGED"}],
        },
    )
    assert return_res.status_code == 200
    assert return_res.json()["return_state"] == "REQUESTED"
    return_id = return_res.json()["returns"][0]["id"]

    # 2. Review & Approve Return
    rev_res = client.post(
        f"/api/v1/oms/returns/{return_id}/review",
        json={"action": "APPROVE", "receiving_location": "MAIN"},
    )
    assert rev_res.status_code == 200
    assert rev_res.json()["status"] == "APPROVED"

    # 3. Process & Inspect Return
    ret_line_id = rev_res.json()["lines"][0]["id"]
    proc_res = client.post(
        f"/api/v1/oms/returns/{return_id}/process",
        json={
            "items": [
                {"return_line_id": ret_line_id, "condition": "DAMAGED", "restock_disposition": "DO_NOT_RESTOCK"}
            ]
        },
    )
    assert proc_res.status_code == 200
    assert proc_res.json()["status"] == "COMPLETED"

    # 4. Issue Refund
    refund_res = client.post(
        f"/api/v1/oms/orders/{order_id}/refunds",
        json={
            "amount": 1000.0,
            "reason": "Reimbursement for 2 damaged units",
            "return_id": return_id,
        },
    )
    assert refund_res.status_code == 200
    assert refund_res.json()["payment_state"] == "PARTIALLY_REFUNDED"
    assert len(refund_res.json()["refunds"]) == 1

    # 5. Over-refund should be rejected
    over_refund_res = client.post(
        f"/api/v1/oms/orders/{order_id}/refunds",
        json={"amount": 50000.0, "reason": "Invalid amount"},
    )
    assert over_refund_res.status_code == 400
    assert "exceeds remaining net paid balance" in over_refund_res.json()["detail"]


def test_order_cancellation_guards(client):
    order_payload = {
        "customer_name": "Test Cancel",
        "items": [{"sku": "SKU-C", "product_name": "Switch", "quantity": 1, "unit_price": 300.0}],
    }
    create_res = client.post("/api/v1/oms/orders", json=order_payload)
    order_id = create_res.json()["id"]

    # Cancel open unfulfilled order -> Should succeed
    cancel_res = client.post(
        f"/api/v1/oms/orders/{order_id}/cancel",
        json={"reason": "Wrong item ordered by mistake", "restock": True},
    )
    assert cancel_res.status_code == 200
    assert cancel_res.json()["order_state"] == "CANCELLED"
    assert cancel_res.json()["status"] == "CANCELLED"

    # Cancelling again -> should fail
    again_res = client.post(
        f"/api/v1/oms/orders/{order_id}/cancel",
        json={"reason": "Cancel again"},
    )
    assert again_res.status_code == 400
    assert "already cancelled" in again_res.json()["detail"]


def test_provider_sync_retry(client):
    order_payload = {
        "customer_name": "Sync Test",
        "source_type": "SHOPIFY",
        "items": [{"sku": "SKU-S", "product_name": "Widget", "quantity": 2, "unit_price": 50.0}],
    }
    create_res = client.post("/api/v1/oms/orders", json=order_payload)
    order_id = create_res.json()["id"]

    # Retry sync endpoint
    sync_res = client.post(f"/api/v1/oms/orders/{order_id}/sync/retry")
    assert sync_res.status_code == 200
    assert sync_res.json()["sync_status"] == "HEALTHY"


def test_oms_overview_metrics(client):
    metrics_res = client.get("/api/v1/oms/overview/metrics")
    assert metrics_res.status_code == 200
    data = metrics_res.json()
    assert "orders_today" in data
    assert "revenue_today" in data
    assert "unfulfilled_count" in data
    assert "unpaid_count" in data
    assert "returns_needing_work" in data
    assert "sync_failures_count" in data
    assert isinstance(data["needs_attention"], list)
    assert isinstance(data["fulfillment_workload"], dict)
    assert isinstance(data["provider_health"], list)


def test_oms_products_catalog(client):
    unique_sku = f"PROD-CAT-{int(time.time()*1000)}"
    create_res = client.post(
        "/api/v1/oms/products",
        json={
            "name": "Heavy Duty Crate",
            "sku": unique_sku,
            "price": 120.0,
            "description": "Industrial grade crate",
            "status": "ACTIVE",
        },
    )
    assert create_res.status_code == 201
    prod_id = create_res.json()["id"]

    get_res = client.get(f"/api/v1/oms/products/{prod_id}")
    assert get_res.status_code == 200
    assert get_res.json()["sku"] == unique_sku

    list_res = client.get("/api/v1/oms/products")
    assert list_res.status_code == 200
    assert any(p["id"] == prod_id for p in list_res.json())
