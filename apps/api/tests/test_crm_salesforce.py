import time


def test_crm_leads_lifecycle_and_conversion(client):
    unique = int(time.time() * 1000)
    lead_payload = {
        "first_name": "Minh",
        "last_name": "Nguyen",
        "company_name": f"ABC Packaging {unique}",
        "job_title": "Procurement Director",
        "email": f"minh_{unique}@abcpackaging.vn",
        "phone": "+84 901 234 567",
        "source": "WEBSITE",
        "status": "NEW",
        "estimated_value": 150000000.0,
        "notes": "Looking for 50k corrugated boxes monthly.",
    }

    # 1. Create Lead
    res = client.post("/api/v1/crm/leads", json=lead_payload)
    assert res.status_code == 201, res.text
    lead = res.json()
    assert lead["id"] is not None
    assert lead["status"] == "NEW"
    assert lead["company_name"] == f"ABC Packaging {unique}"
    lead_id = lead["id"]

    # 2. Get Lead
    get_res = client.get(f"/api/v1/crm/leads/{lead_id}")
    assert get_res.status_code == 200
    assert get_res.json()["email"] == f"minh_{unique}@abcpackaging.vn"

    # 3. Log Activity on Lead
    act_res = client.post(
        f"/api/v1/crm/leads/{lead_id}/activities",
        json={
            "subject": "Discovery Call Completed",
            "type": "CALL",
            "status": "COMPLETED",
            "body": "Discussed delivery schedules and pricing terms.",
        },
    )
    assert act_res.status_code == 201
    assert act_res.json()["lead_id"] == lead_id

    # 4. Advance status: NEW -> CONTACTED -> QUALIFIED
    trans1 = client.post(
        f"/api/v1/crm/leads/{lead_id}/transition",
        json={"status": "CONTACTED", "reason": "Initial call made"},
    )
    assert trans1.status_code == 200
    assert trans1.json()["status"] == "CONTACTED"

    trans2 = client.post(
        f"/api/v1/crm/leads/{lead_id}/transition",
        json={"status": "QUALIFIED", "reason": "Meets BANT criteria"},
    )
    assert trans2.status_code == 200
    assert trans2.json()["status"] == "QUALIFIED"

    # 5. Convert Lead
    conv_payload = {
        "create_new_account": True,
        "account_name": f"ABC Packaging {unique} Corp",
        "create_new_contact": True,
        "create_opportunity": True,
        "opportunity_name": "Q4 Packaging Supply Contract",
        "opportunity_amount": 150000000.0,
        "initial_stage": "QUALIFICATION",
    }
    conv_res = client.post(f"/api/v1/crm/leads/{lead_id}/convert", json=conv_payload)
    assert conv_res.status_code == 200, conv_res.text
    conv_data = conv_res.json()
    assert conv_data["status"] == "CONVERTED"
    account_id = conv_data["account_id"]
    contact_id = conv_data["contact_id"]
    opportunity_id = conv_data["opportunity_id"]

    assert account_id is not None
    assert contact_id is not None
    assert opportunity_id is not None

    # Verify Account created
    acc_res = client.get(f"/api/v1/crm/accounts/{account_id}")
    assert acc_res.status_code == 200
    assert acc_res.json()["name"] == f"ABC Packaging {unique} Corp"

    # Verify Contact created and linked to Account
    cont_res = client.get(f"/api/v1/crm/contacts/{contact_id}")
    assert cont_res.status_code == 200
    assert cont_res.json()["account_id"] == account_id
    assert cont_res.json()["last_name"] == "Nguyen"

    # Verify Opportunity created and linked to Account
    opp_res = client.get(f"/api/v1/crm/opportunities/{opportunity_id}")
    assert opp_res.status_code == 200
    assert opp_res.json()["account_id"] == account_id
    assert opp_res.json()["stage"] == "QUALIFICATION"
    assert opp_res.json()["amount"] == 150000000.0

    # Verify Lead is now CONVERTED and cannot be converted again
    lead_check = client.get(f"/api/v1/crm/leads/{lead_id}")
    assert lead_check.json()["status"] == "CONVERTED"

    reconv = client.post(f"/api/v1/crm/leads/{lead_id}/convert", json=conv_payload)
    assert reconv.status_code == 400

    # Cannot transition converted lead
    bad_trans = client.post(
        f"/api/v1/crm/leads/{lead_id}/transition",
        json={"status": "NEW"},
    )
    assert bad_trans.status_code == 400


def test_crm_opportunity_lifecycle_and_stages(client):
    unique = int(time.time() * 1000)

    # 1. Create Account
    acc_res = client.post(
        "/api/v1/crm/accounts",
        json={
            "name": f"Global Logistics {unique}",
            "account_type": "CUSTOMER",
            "industry": "Supply Chain",
        },
    )
    assert acc_res.status_code == 201
    account_id = acc_res.json()["id"]

    # 2. Create Opportunity
    opp_res = client.post(
        "/api/v1/crm/opportunities",
        json={
            "name": f"Enterprise Fleet Tracking {unique}",
            "account_id": account_id,
            "stage": "PROSPECTING",
            "amount": 240000000.0,
            "probability": 10,
        },
    )
    assert opp_res.status_code == 201
    opp_id = opp_res.json()["id"]

    # 3. Transition Stages: PROSPECTING -> DISCOVERY -> PROPOSAL -> NEGOTIATION
    stage_res = client.post(
        f"/api/v1/crm/opportunities/{opp_id}/transition",
        json={"stage": "DISCOVERY"},
    )
    assert stage_res.status_code == 200
    assert stage_res.json()["stage"] == "DISCOVERY"
    assert stage_res.json()["probability"] == 40

    stage_res2 = client.post(
        f"/api/v1/crm/opportunities/{opp_id}/transition",
        json={"stage": "NEGOTIATION"},
    )
    assert stage_res2.status_code == 200
    assert stage_res2.json()["stage"] == "NEGOTIATION"
    assert stage_res2.json()["probability"] == 80

    # 4. Close Lost requires loss reason
    lost_fail = client.post(
        f"/api/v1/crm/opportunities/{opp_id}/close-lost",
        json={"loss_reason": "   "},
    )
    assert lost_fail.status_code == 400

    # 5. Close Won
    won_res = client.post(
        f"/api/v1/crm/opportunities/{opp_id}/close-won",
        json={"amount": 250000000.0},
    )
    assert won_res.status_code == 200
    won_data = won_res.json()
    assert won_data["stage"] == "CLOSED_WON"
    assert won_data["probability"] == 100
    assert won_data["actual_close_date"] is not None
    assert won_data["amount"] == 250000000.0
