def test_actions_and_subflows_catalog(client):
    # 1. Test Action Catalog
    res = client.get("/api/v1/workflow/actions")
    assert res.status_code == 200, res.text
    actions = res.json()
    assert len(actions) >= 5
    action_keys = [a["key"] for a in actions]
    assert "crm.task.create" in action_keys
    assert "oms.order.add_tag" in action_keys
    assert "erp.inventory.reserve" in action_keys
    assert "bi.semantic_model.refresh" in action_keys
    assert "notification.send_inapp" in action_keys

    # Filter by category
    crm_res = client.get("/api/v1/workflow/actions?category=CRM")
    assert crm_res.status_code == 200
    crm_actions = crm_res.json()
    assert all(a["category"] == "CRM" for a in crm_actions)

    # 2. Test Subflow Library
    sub_res = client.get("/api/v1/workflow/subflows")
    assert sub_res.status_code == 200, sub_res.text
    subflows = sub_res.json()
    assert len(subflows) >= 1
    assert subflows[0]["name"] == "Notify Responsible Owner"
    assert len(subflows[0]["input_schema"]) >= 2

    # 3. Test Templates
    tpl_res = client.get("/api/v1/workflow/templates")
    assert tpl_res.status_code == 200, tpl_res.text
    templates = tpl_res.json()
    assert len(templates) >= 4
    tpl_names = [t["name"] for t in templates]
    assert "Large Order Approval" in tpl_names
    assert "Low Stock Alert" in tpl_names


def test_flow_lifecycle_and_versioning(client):
    # 1. List flows
    res = client.get("/api/v1/workflow/flows")
    assert res.status_code == 200, res.text
    flows = res.json()
    assert len(flows) >= 3

    large_order = next((f for f in flows if f["id"] == "flow_large_order_approval"), None)
    assert large_order is not None
    assert large_order["status"] == "ACTIVE"
    assert large_order["active_version"] is not None
    assert large_order["active_version"]["version_number"] >= 3

    # 2. Create a new flow
    new_flow_payload = {
        "name": "Supplier Invoice Mismatch Alert",
        "description": "Alerts accounts payable when 3-way match price variance exceeds 5%.",
        "category": "ERP",
        "trigger": {
            "trigger_type": "DOMAIN_EVENT",
            "event_name": "ERP.SupplierInvoiceMismatch",
            "enabled": True,
        },
        "steps": [
            {
                "step_key": "step_1_condition",
                "step_type": "CONDITION",
                "name": "Check Variance > 5%",
                "condition_group": {
                    "operator": "AND",
                    "rules": [{"field_ref": "trigger.variance_percent", "operator": "GT", "value": 5}],
                },
                "true_steps": [
                    {
                        "step_key": "step_alert_ap",
                        "step_type": "ACTION",
                        "name": "Notify AP Supervisor",
                        "action_key": "notification.send_inapp",
                        "inputs": {
                            "recipient": "ap-supervisor@ubop.vn",
                            "subject": "Invoice Variance Detected: {{ trigger.invoice_number }}",
                            "message": "Invoice {{ trigger.invoice_number }} has variance of {{ trigger.variance_percent }}%.",
                        },
                    }
                ],
                "false_steps": [],
            }
        ],
    }

    create_res = client.post("/api/v1/workflow/flows", json=new_flow_payload)
    assert create_res.status_code == 201, create_res.text
    created = create_res.json()
    flow_id = created["id"]
    assert created["status"] == "DRAFT"
    assert created["draft_version_id"] is not None
    assert created["active_version_id"] is None

    # 3. Validate the created draft
    val_res = client.post(f"/api/v1/workflow/flows/{flow_id}/validate")
    assert val_res.status_code == 200
    val_data = val_res.json()
    assert val_data["is_valid"] is True
    assert len(val_data["errors"]) == 0

    # 4. Test execution of the draft in sandbox
    test_payload = {
        "trigger_type": "DOMAIN_EVENT",
        "payload": {
            "invoice_number": "INV-2026-901",
            "variance_percent": 8.5,
            "po_number": "PO-9912",
        },
    }
    test_res = client.post(f"/api/v1/workflow/flows/{flow_id}/test", json=test_payload)
    assert test_res.status_code == 200, test_res.text
    test_run = test_res.json()
    assert test_run["status"] == "SUCCEEDED"
    assert len(test_run["step_runs"]) >= 1
    # Check that condition evaluated to TRUE and executed nested alert step
    step0 = test_run["step_runs"][0]
    assert step0["step_type"] == "CONDITION"
    assert step0["outputs"]["branch"] == "TRUE"

    # 5. Activate the draft
    act_res = client.post(f"/api/v1/workflow/flows/{flow_id}/activate")
    assert act_res.status_code == 200, act_res.text
    act_flow = act_res.json()
    assert act_flow["status"] == "ACTIVE"
    assert act_flow["active_version_id"] is not None
    assert act_flow["draft_version_id"] is None

    # 6. Deactivate the flow
    deact_res = client.post(f"/api/v1/workflow/flows/{flow_id}/deactivate")
    assert deact_res.status_code == 200
    assert deact_res.json()["status"] == "INACTIVE"


def test_flow_runs_and_execution_details(client):
    # 1. List runs
    res = client.get("/api/v1/workflow/runs")
    assert res.status_code == 200, res.text
    runs = res.json()
    assert len(runs) >= 1
    run0 = runs[0]

    # 2. Get execution details
    detail_res = client.get(f"/api/v1/workflow/runs/{run0['id']}")
    assert detail_res.status_code == 200, detail_res.text
    detail = detail_res.json()
    assert detail["flow_name"] is not None
    assert "step_runs" in detail
    assert len(detail["step_runs"]) >= 1

    # Check step runs structure (ServiceNow Execution Details inspector)
    sr = detail["step_runs"][0]
    assert "step_name" in sr
    assert "status" in sr
    assert "duration_ms" in sr
    assert "resolved_inputs" in sr
    assert "outputs" in sr


def test_approvals_inbox_and_decision(client):
    # 1. List approvals
    res = client.get("/api/v1/workflow/approvals")
    assert res.status_code == 200, res.text
    approvals = res.json()
    assert len(approvals) >= 1

    pending_appr = next((a for a in approvals if a["status"] == "PENDING"), None)
    assert pending_appr is not None
    appr_id = pending_appr["id"]

    # 2. Decide approval (APPROVE)
    decision_payload = {
        "decision": "APPROVED",
        "comment": "Approved following VIP customer commercial terms sign-off.",
    }
    dec_res = client.post(f"/api/v1/workflow/approvals/{appr_id}/decide", json=decision_payload)
    assert dec_res.status_code == 200, dec_res.text
    dec_data = dec_res.json()
    assert dec_data["status"] == "APPROVED"
    assert dec_data["decision"] == "APPROVED"
    assert "VIP customer commercial terms" in dec_data["comment"]
    assert dec_data["responded_at"] is not None


def test_legacy_rules_and_logs(client):
    # Rules
    rules_res = client.get("/api/v1/workflow/rules")
    assert rules_res.status_code == 200
    assert isinstance(rules_res.json(), list)

    # Logs
    logs_res = client.get("/api/v1/workflow/logs")
    assert logs_res.status_code == 200
    assert isinstance(logs_res.json(), list)
