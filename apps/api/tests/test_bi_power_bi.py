def test_bi_home_hub(client):
    res = client.get("/api/v1/bi/home")
    assert res.status_code == 200, res.text
    data = res.json()
    assert "favorites" in data
    assert "recents" in data
    assert "data_health" in data
    assert len(data["favorites"]) >= 1
    assert data["data_health"]["total_models"] >= 1


def test_semantic_models_and_metrics(client):
    # List models
    res = client.get("/api/v1/bi/semantic-models")
    assert res.status_code == 200, res.text
    models = res.json()
    assert len(models) >= 3
    model_ids = [m["id"] for m in models]
    assert "sm_commerce_ops" in model_ids

    # Get model detail
    detail_res = client.get("/api/v1/bi/semantic-models/sm_commerce_ops")
    assert detail_res.status_code == 200, detail_res.text
    detail = detail_res.json()
    assert detail["name"] == "Commerce Operations"
    assert len(detail.get("entities", [])) >= 1
    assert len(detail.get("metrics", [])) >= 1

    # List metrics
    metrics_res = client.get("/api/v1/bi/metrics")
    assert metrics_res.status_code == 200, metrics_res.text
    metrics = metrics_res.json()
    metric_names = [m["name"] for m in metrics]
    assert "revenue" in metric_names
    assert "order_count" in metric_names


def test_bi_query_engine(client):
    # Query aggregated channel performance
    payload = {
        "semantic_model_id": "sm_commerce_ops",
        "measures": ["revenue", "order_count", "avg_order_value"],
        "dimensions": ["channel"],
        "filters": [
            {
                "field": "year",
                "operator": "EQUALS",
                "values": [2026],
                "scope": "REPORT",
            }
        ],
        "sort": [{"field": "revenue", "direction": "DESC"}],
        "limit": 10,
    }
    res = client.post("/api/v1/bi/query", json=payload)
    assert res.status_code == 200, res.text
    query_data = res.json()
    assert "rows" in query_data
    assert len(query_data["rows"]) >= 1
    row0 = query_data["rows"][0]
    assert "channel" in row0
    assert "revenue" in row0
    assert row0["revenue"] > 0
    assert "avg_order_value" in row0
    assert query_data["is_stale"] is False

    # Test stale query model
    stale_payload = {
        "semantic_model_id": "sm_procurement",
        "measures": ["revenue"],
        "dimensions": ["channel"],
        "filters": [],
    }
    stale_res = client.post("/api/v1/bi/query", json=stale_payload)
    assert stale_res.status_code == 200
    assert stale_res.json()["is_stale"] is True
    assert stale_res.json()["warning"] is not None


def test_reports_lifecycle(client):
    # List reports
    res = client.get("/api/v1/bi/reports")
    assert res.status_code == 200, res.text
    reports = res.json()
    assert len(reports) >= 1
    rep0 = reports[0]
    rep_id = rep0["id"]

    # Get Report Detail
    detail_res = client.get(f"/api/v1/bi/reports/{rep_id}")
    assert detail_res.status_code == 200
    report = detail_res.json()
    assert len(report["pages"]) >= 2
    assert report["pages"][0]["name"] == "Executive Summary"
    assert len(report["pages"][0]["visuals"]) >= 3

    # Create Draft Report
    create_payload = {
        "semantic_model_id": "sm_crm_pipeline",
        "name": "Q3 Sales Pipeline Velocity",
        "description": "Executive opportunity conversion and win-rate report.",
        "status": "DRAFT",
    }
    create_res = client.post("/api/v1/bi/reports", json=create_payload)
    assert create_res.status_code == 201, create_res.text
    new_rep = create_res.json()
    new_id = new_rep["id"]
    assert new_rep["status"] == "DRAFT"

    # Publish Report
    pub_res = client.post(f"/api/v1/bi/reports/{new_id}/publish")
    assert pub_res.status_code == 200
    assert pub_res.json()["status"] == "PUBLISHED"


def test_analytical_bookmarks(client):
    rep_id = "rep_sales_performance"
    bm_payload = {
        "name": "Custom Executive Filter View",
        "is_default": False,
        "state": {
            "active_page_id": "page_exec_summary",
            "slicers": {"channel": "Direct B2B"},
        },
    }
    res = client.post(f"/api/v1/bi/reports/{rep_id}/bookmarks", json=bm_payload)
    assert res.status_code == 201, res.text
    created = res.json()
    assert created["name"] == "Custom Executive Filter View"

    # List bookmarks
    list_res = client.get(f"/api/v1/bi/reports/{rep_id}/bookmarks")
    assert list_res.status_code == 200
    bookmarks = list_res.json()
    assert len(bookmarks) >= 1


def test_dashboards(client):
    res = client.get("/api/v1/bi/dashboards")
    assert res.status_code == 200, res.text
    dashboards = res.json()
    assert len(dashboards) >= 1
    dash_id = dashboards[0]["id"]

    detail_res = client.get(f"/api/v1/bi/dashboards/{dash_id}")
    assert detail_res.status_code == 200
    dash = detail_res.json()
    assert dash["is_executive"] is True
    assert len(dash["tiles"]) >= 4


def test_data_refresh_workflow(client):
    # List runs
    runs_res = client.get("/api/v1/bi/refresh-runs")
    assert runs_res.status_code == 200, runs_res.text
    runs = runs_res.json()
    assert len(runs) >= 1

    # Trigger manual retry refresh on stale procurement model
    refresh_res = client.post("/api/v1/bi/semantic-models/sm_procurement/refresh?trigger_type=MANUAL_RETRY")
    assert refresh_res.status_code == 200, refresh_res.text
    result = refresh_res.json()
    assert result["status"] == "SUCCEEDED"
    assert result["rows_processed"] > 0


def test_backward_compatibility_kpi_and_trend(client):
    kpis = client.get("/api/v1/bi/kpis")
    assert kpis.status_code == 200
    assert "total_revenue" in kpis.json()

    trend = client.get("/api/v1/bi/sales-trend")
    assert trend.status_code == 200
    assert len(trend.json()) > 0
