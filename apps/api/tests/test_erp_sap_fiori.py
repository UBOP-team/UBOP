import time


def test_warehouses_and_locations(client):
    code = f"WH-TEST-{int(time.time() * 1000)}"
    payload = {
        "code": code,
        "name": "Testing Annex Hub",
        "status": "ACTIVE",
        "address": "456 Industrial Blvd",
        "timezone": "Asia/Ho_Chi_Minh",
    }
    res = client.post("/api/v1/erp/warehouses", json=payload)
    assert res.status_code == 201, res.text
    data = res.json()
    assert data["code"] == code
    wh_id = data["id"]
    assert len(data["storage_locations"]) >= 2

    # Get by ID
    get_res = client.get(f"/api/v1/erp/warehouses/{wh_id}")
    assert get_res.status_code == 200
    assert get_res.json()["name"] == "Testing Annex Hub"


def test_inventory_positions_and_stock_adjustment(client):
    sku = f"SKU-ADJ-{int(time.time() * 1000)}"

    # Create initial position via adjustment
    adj_payload = {
        "product_reference": sku,
        "warehouse_id": 1,
        "adjustment_type": "INCREASE",
        "quantity": 100.0,
        "reason_code": "CYCLE_COUNT",
        "note": "Initial baseline count",
    }
    res = client.post("/api/v1/erp/inventory/adjustments", json=adj_payload)
    assert res.status_code == 200, res.text
    pos = res.json()
    assert pos["on_hand_quantity"] == 100.0
    assert pos["available_quantity"] == 100.0

    # Decrease adjustment
    dec_payload = {
        "product_reference": sku,
        "warehouse_id": 1,
        "adjustment_type": "DECREASE",
        "quantity": 15.0,
        "reason_code": "DAMAGED_GOODS",
        "note": "Damaged items scrapped",
    }
    dec_res = client.post("/api/v1/erp/inventory/adjustments", json=dec_payload)
    assert dec_res.status_code == 200
    assert dec_res.json()["on_hand_quantity"] == 85.0

    # Negative invariant guard
    invalid_dec = {
        "product_reference": sku,
        "warehouse_id": 1,
        "adjustment_type": "DECREASE",
        "quantity": 500.0,
        "reason_code": "SCRAP",
    }
    fail_res = client.post("/api/v1/erp/inventory/adjustments", json=invalid_dec)
    assert fail_res.status_code == 400
    assert "invariant violation" in fail_res.text.lower()

    # Check goods movements audit ledger
    mv_res = client.get(f"/api/v1/erp/stock-movements?product_reference={sku}")
    assert mv_res.status_code == 200
    movements = mv_res.json()
    assert len(movements) >= 2


def test_procure_to_receive_full_lifecycle(client):
    sku = f"SKU-PROC-{int(time.time() * 1000)}"

    # 1. Create Supplier
    sup_code = f"SUP-P-{int(time.time() * 1000)}"
    sup_res = client.post(
        "/api/v1/erp/suppliers",
        json={
            "supplier_code": sup_code,
            "name": "Global Plastics Co",
            "status": "ACTIVE",
            "payment_terms": "NET_30",
        },
    )
    assert sup_res.status_code == 201
    supplier_id = sup_res.json()["id"]

    # 2. Purchase Requisition Lifecycle
    pr_res = client.post(
        "/api/v1/erp/requisitions",
        json={
            "requester_id": "huy_engineer",
            "reason": "Production raw materials",
            "lines": [
                {
                    "product_reference": sku,
                    "quantity": 500.0,
                    "unit": "kg",
                    "estimated_unit_cost": 20000.0,
                    "preferred_supplier_id": supplier_id,
                    "warehouse_id": 1,
                }
            ],
        },
    )
    assert pr_res.status_code == 201
    pr_id = pr_res.json()["id"]
    assert pr_res.json()["status"] == "DRAFT"

    # Submit PR
    sub_res = client.post(f"/api/v1/erp/requisitions/{pr_id}/submit")
    assert sub_res.status_code == 200
    assert sub_res.json()["status"] == "SUBMITTED"

    # Approve PR
    app_res = client.post(f"/api/v1/erp/requisitions/{pr_id}/approve")
    assert app_res.status_code == 200
    assert app_res.json()["status"] == "APPROVED"

    # 3. Create Purchase Order
    po_res = client.post(
        "/api/v1/erp/purchase-orders",
        json={
            "supplier_id": supplier_id,
            "buyer_id": "buyer_lan",
            "warehouse_id": 1,
            "currency": "VND",
            "tax_total": 1000000.0,
            "lines": [
                {
                    "product_reference": sku,
                    "ordered_quantity": 500.0,
                    "unit": "kg",
                    "unit_cost": 20000.0,
                }
            ],
        },
    )
    assert po_res.status_code == 201, po_res.text
    po_data = po_res.json()
    po_id = po_data["id"]
    po_line_id = po_data["lines"][0]["id"]
    assert po_data["status"] == "DRAFT"
    assert po_data["subtotal"] == 10000000.0
    assert po_data["grand_total"] == 11000000.0

    # Submit and Approve PO
    client.post(f"/api/v1/erp/purchase-orders/{po_id}/submit")
    client.post(f"/api/v1/erp/purchase-orders/{po_id}/approve")
    send_res = client.post(f"/api/v1/erp/purchase-orders/{po_id}/send")
    assert send_res.status_code == 200
    assert send_res.json()["status"] == "SENT"

    # 4. Goods Receipt - Partial Delivery (300 kg out of 500 kg)
    gr1_res = client.post(
        "/api/v1/erp/goods-receipts",
        json={
            "purchase_order_id": po_id,
            "warehouse_id": 1,
            "received_by": "clerk_nam",
            "lines": [
                {
                    "purchase_order_line_id": po_line_id,
                    "product_reference": sku,
                    "received_quantity": 300.0,
                    "accepted_quantity": 290.0,
                    "blocked_quantity": 10.0,
                    "damaged_quantity": 0.0,
                    "unit": "kg",
                }
            ],
        },
    )
    assert gr1_res.status_code == 201, gr1_res.text

    # Check PO is PARTIALLY_RECEIVED
    po_check = client.get(f"/api/v1/erp/purchase-orders/{po_id}").json()
    assert po_check["status"] == "PARTIALLY_RECEIVED"
    assert po_check["lines"][0]["received_quantity"] == 300.0

    # 5. Goods Receipt - Remaining Delivery (200 kg)
    gr2_res = client.post(
        "/api/v1/erp/goods-receipts",
        json={
            "purchase_order_id": po_id,
            "warehouse_id": 1,
            "received_by": "clerk_nam",
            "lines": [
                {
                    "purchase_order_line_id": po_line_id,
                    "product_reference": sku,
                    "received_quantity": 200.0,
                    "accepted_quantity": 200.0,
                    "blocked_quantity": 0.0,
                    "damaged_quantity": 0.0,
                    "unit": "kg",
                }
            ],
        },
    )
    assert gr2_res.status_code == 201

    # Check PO is now RECEIVED
    po_final = client.get(f"/api/v1/erp/purchase-orders/{po_id}").json()
    assert po_final["status"] == "RECEIVED"
    assert po_final["lines"][0]["received_quantity"] == 500.0


def test_goods_receipt_reversal(client):
    sku = f"SKU-REV-{int(time.time() * 1000)}"

    # Create and approve PO
    sup_res = client.post(
        "/api/v1/erp/suppliers",
        json={"supplier_code": f"SUP-R-{int(time.time() * 1000)}", "name": "Reversal Supplier", "status": "ACTIVE"},
    )
    sup_id = sup_res.json()["id"]

    po_res = client.post(
        "/api/v1/erp/purchase-orders",
        json={
            "supplier_id": sup_id,
            "warehouse_id": 1,
            "lines": [{"product_reference": sku, "ordered_quantity": 100.0, "unit_cost": 50000.0}],
        },
    )
    po_id = po_res.json()["id"]
    po_line_id = po_res.json()["lines"][0]["id"]
    client.post(f"/api/v1/erp/purchase-orders/{po_id}/submit")
    client.post(f"/api/v1/erp/purchase-orders/{po_id}/approve")
    client.post(f"/api/v1/erp/purchase-orders/{po_id}/send")

    # Post Goods Receipt
    gr_res = client.post(
        "/api/v1/erp/goods-receipts",
        json={
            "purchase_order_id": po_id,
            "warehouse_id": 1,
            "lines": [
                {
                    "purchase_order_line_id": po_line_id,
                    "product_reference": sku,
                    "received_quantity": 100.0,
                    "accepted_quantity": 100.0,
                    "unit": "pcs",
                }
            ],
        },
    )
    gr_id = gr_res.json()["id"]

    # Reversal
    rev_res = client.post(f"/api/v1/erp/goods-receipts/{gr_id}/reverse", json={"reason": "Incorrect batch delivered"})
    assert rev_res.status_code == 200
    assert rev_res.json()["status"] == "REVERSED"

    # PO should revert to SENT
    po_after = client.get(f"/api/v1/erp/purchase-orders/{po_id}").json()
    assert po_after["status"] == "SENT"
    assert po_after["lines"][0]["received_quantity"] == 0.0


def test_stock_transfer_in_transit_flow(client):
    sku = f"SKU-TRANS-{int(time.time() * 1000)}"

    # Ensure source warehouse has 50 pcs
    client.post(
        "/api/v1/erp/inventory/adjustments",
        json={"product_reference": sku, "warehouse_id": 1, "adjustment_type": "INCREASE", "quantity": 50.0, "reason_code": "RESTOCK"},
    )

    # Create destination warehouse
    wh_res = client.post(
        "/api/v1/erp/warehouses",
        json={"code": f"WH-DEST-{int(time.time() * 1000)}", "name": "Dest Annex", "status": "ACTIVE"},
    )
    dest_wh_id = wh_res.json()["id"]

    # Create Stock Transfer
    trans_res = client.post(
        "/api/v1/erp/stock-transfers",
        json={
            "from_warehouse_id": 1,
            "to_warehouse_id": dest_wh_id,
            "created_by": "transfer_manager",
            "lines": [{"product_reference": sku, "requested_quantity": 20.0, "unit": "pcs"}],
        },
    )
    assert trans_res.status_code == 201
    trans_id = trans_res.json()["id"]

    # Ship transfer
    ship_res = client.post(f"/api/v1/erp/stock-transfers/{trans_id}/ship")
    assert ship_res.status_code == 200
    assert ship_res.json()["status"] == "IN_TRANSIT"

    # Source stock must now be 30
    src_pos = client.get(f"/api/v1/erp/inventory/positions?warehouse_id=1&product_reference={sku}").json()
    assert src_pos[0]["on_hand_quantity"] == 30.0

    # Receive transfer
    rcv_res = client.post(f"/api/v1/erp/stock-transfers/{trans_id}/receive")
    assert rcv_res.status_code == 200
    assert rcv_res.json()["status"] == "RECEIVED"

    # Destination stock must now be 20
    dest_pos = client.get(f"/api/v1/erp/inventory/positions?warehouse_id={dest_wh_id}&product_reference={sku}").json()
    assert dest_pos[0]["on_hand_quantity"] == 20.0


def test_stock_reservation_port(client):
    sku = f"SKU-RES-{int(time.time() * 1000)}"

    # Add 100 items on hand
    client.post(
        "/api/v1/erp/inventory/adjustments",
        json={"product_reference": sku, "warehouse_id": 1, "adjustment_type": "INCREASE", "quantity": 100.0, "reason_code": "RESTOCK"},
    )

    # 1. Reserve 30
    order_num = f"ORD-RES-{int(time.time() * 1000)}"
    res_payload = {
        "product_reference": sku,
        "warehouse_id": 1,
        "source_type": "OMS_ORDER",
        "source_reference": order_num,
        "quantity": 30.0,
    }
    r_res = client.post("/api/v1/erp/inventory/reservations", json=res_payload)
    assert r_res.status_code == 200
    assert r_res.json()["status"] == "ACTIVE"

    # Check available quantity is now 70
    pos_data = client.get(f"/api/v1/erp/inventory/positions?warehouse_id=1&product_reference={sku}").json()
    assert pos_data[0]["reserved_quantity"] == 30.0
    assert pos_data[0]["available_quantity"] == 70.0

    # 2. Consume reservation (fulfillment)
    cons_res = client.post(f"/api/v1/erp/inventory/reservations/consume?product_reference={sku}&source_reference={order_num}")
    assert cons_res.status_code == 200

    # Check on-hand is now 70 and reserved is 0
    pos_after = client.get(f"/api/v1/erp/inventory/positions?warehouse_id=1&product_reference={sku}").json()
    assert pos_after[0]["reserved_quantity"] == 0.0
    assert pos_after[0]["on_hand_quantity"] == 70.0


def test_supplier_invoice_three_way_match(client):
    sku = f"SKU-INV-{int(time.time() * 1000)}"

    sup_res = client.post(
        "/api/v1/erp/suppliers",
        json={"supplier_code": f"SUP-I-{int(time.time() * 1000)}", "name": "Invoice Supplier", "status": "ACTIVE"},
    )
    sup_id = sup_res.json()["id"]

    po_res = client.post(
        "/api/v1/erp/purchase-orders",
        json={
            "supplier_id": sup_id,
            "warehouse_id": 1,
            "tax_total": 0.0,
            "lines": [{"product_reference": sku, "ordered_quantity": 10.0, "unit_cost": 100000.0}],
        },
    )
    po_id = po_res.json()["id"]
    client.post(f"/api/v1/erp/purchase-orders/{po_id}/submit")
    client.post(f"/api/v1/erp/purchase-orders/{po_id}/approve")
    client.post(f"/api/v1/erp/purchase-orders/{po_id}/send")

    # Create Invoice with Price Mismatch (1.2M instead of 1.0M)
    inv_res = client.post(
        "/api/v1/erp/supplier-invoices",
        json={"supplier_id": sup_id, "purchase_order_id": po_id, "subtotal": 1200000.0, "tax_total": 0.0},
    )
    assert inv_res.status_code == 201
    inv_data = inv_res.json()
    assert inv_data["status"] == "MISMATCH"
    assert inv_data["match_status"] == "PRICE_MISMATCH"
    assert inv_data["variance_amount"] == 200000.0
    inv_id = inv_data["id"]

    # Resolve mismatch
    res_res = client.post(
        f"/api/v1/erp/supplier-invoices/{inv_id}/resolve",
        json={"resolution_action": "ACCEPT_VARIANCE", "note": "Approved by CFO"},
    )
    assert res_res.status_code == 200
    assert res_res.json()["status"] == "MATCHED"

    # Approve invoice
    app_res = client.post(f"/api/v1/erp/supplier-invoices/{inv_id}/approve")
    assert app_res.status_code == 200
    assert app_res.json()["status"] == "APPROVED"


def test_supplier_hold_guard(client):
    sup_res = client.post(
        "/api/v1/erp/suppliers",
        json={"supplier_code": f"SUP-HOLD-{int(time.time() * 1000)}", "name": "Hold Supplier", "status": "ACTIVE"},
    )
    sup_id = sup_res.json()["id"]

    # Toggle hold
    toggle_res = client.post(f"/api/v1/erp/suppliers/{sup_id}/toggle-hold")
    assert toggle_res.status_code == 200
    assert toggle_res.json()["status"] == "ON_HOLD"

    # Creating PO must fail with 400
    po_res = client.post(
        "/api/v1/erp/purchase-orders",
        json={"supplier_id": sup_id, "warehouse_id": 1, "lines": [{"product_reference": "ANY", "ordered_quantity": 10.0, "unit_cost": 10.0}]},
    )
    assert po_res.status_code == 400
    assert "on_hold" in po_res.text.lower()


def test_erp_overview_metrics(client):
    res = client.get("/api/v1/erp/overview/metrics")
    assert res.status_code == 200
    metrics = res.json()
    assert "total_stock_value" in metrics
    assert "low_stock_count" in metrics
    assert "open_pos_count" in metrics
    assert "invoices_awaiting_review" in metrics
