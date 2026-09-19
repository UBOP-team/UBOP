import time


def test_crm_customer_flow(client):
    unique_email = f"contact_{int(time.time()*1000)}@acme.com"
    payload = {
        "name": "Acme Corp",
        "email": unique_email,
        "phone": "+1-555-0100",
        "company": "Acme Corporation",
        "status": "ACTIVE",
    }
    response = client.post("/api/v1/crm/customers", json=payload)
    assert response.status_code == 201, response.text
    data = response.json()
    assert data["name"] == "Acme Corp"
    assert "id" in data
    customer_id = data["id"]

    # Get Customer
    get_res = client.get(f"/api/v1/crm/customers/{customer_id}")
    assert get_res.status_code == 200
    assert get_res.json()["email"] == unique_email

    # List Customers
    list_res = client.get("/api/v1/crm/customers")
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1


def test_erp_product_and_inventory_flow(client):
    unique_sku = f"SKU-TEST-{int(time.time()*1000)}"
    product_payload = {
        "sku": unique_sku,
        "name": "Enterprise Server",
        "description": "High performance server rack",
        "price": 2500.0,
        "cost": 1500.0,
        "initial_quantity": 50,
        "warehouse": "MAIN",
    }
    response = client.post("/api/v1/erp/products", json=product_payload)
    assert response.status_code == 201, response.text
    product_data = response.json()
    assert product_data["sku"] == unique_sku
    product_id = product_data["id"]

    # Check Inventory
    inv_res = client.get("/api/v1/erp/inventory")
    assert inv_res.status_code == 200
    items = inv_res.json()
    assert any(item["product_id"] == product_id and item["quantity"] == 50 for item in items)

    # Adjust Stock
    adj_payload = {
        "product_id": product_id,
        "quantity_delta": -10,
        "warehouse": "MAIN",
        "reason": "Test adjustment",
    }
    adj_res = client.post("/api/v1/erp/inventory/adjust", json=adj_payload)
    assert adj_res.status_code == 200, adj_res.text
    assert adj_res.json()["quantity"] == 40


def test_oms_order_lifecycle(client):
    # First create a customer and product for the order
    cust_res = client.post(
        "/api/v1/crm/customers",
        json={"name": "Buyer 1", "email": f"buyer_{int(time.time()*1000)}@test.com", "status": "ACTIVE"},
    )
    customer_id = cust_res.json()["id"]

    prod_res = client.post(
        "/api/v1/erp/products",
        json={"sku": f"ORD-PROD-{int(time.time()*1000)}", "name": "Item A", "price": 100.0, "initial_quantity": 20},
    )
    product_id = prod_res.json()["id"]

    order_payload = {
        "customer_id": customer_id,
        "items": [
            {"product_id": product_id, "quantity": 2, "unit_price": 100.0}
        ],
    }
    response = client.post("/api/v1/oms/orders", json=order_payload)
    assert response.status_code == 201, response.text
    order_data = response.json()
    assert order_data["total_amount"] == 200.0
    assert order_data["status"] == "PENDING"
    order_id = order_data["id"]

    # Update Status
    status_update = {"status": "CONFIRMED"}
    patch_res = client.patch(f"/api/v1/oms/orders/{order_id}/status", json=status_update)
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "CONFIRMED"


def test_bi_analytics(client):
    # Test KPI summary
    kpi_res = client.get("/api/v1/bi/kpis")
    assert kpi_res.status_code == 200, kpi_res.text
    kpis = kpi_res.json()
    assert "total_revenue" in kpis
    assert "total_orders" in kpis
    assert "total_customers" in kpis

    # Test Sales Trend
    trend_res = client.get("/api/v1/bi/sales-trend")
    assert trend_res.status_code == 200
    assert len(trend_res.json()) > 0


def test_workflow_engine(client):
    # Create Workflow Rule
    rule_payload = {
        "name": "Notify on Order Confirmed",
        "event_pattern": "order.status_updated",
        "action_type": "NOTIFY",
        "action_payload": '{"channel": "slack"}',
        "is_active": True,
    }
    res = client.post("/api/v1/workflow/rules", json=rule_payload)
    assert res.status_code == 201, res.text
    rule = res.json()
    assert rule["name"] == "Notify on Order Confirmed"

    # List Rules
    rules_res = client.get("/api/v1/workflow/rules")
    assert rules_res.status_code == 200
    assert len(rules_res.json()) >= 1

    # Execute workflow endpoint
    exec_res = client.post("/api/v1/workflow/execute", json={"action": "reindex"})
    assert exec_res.status_code == 200
    assert exec_res.json()["status"] == "success"
