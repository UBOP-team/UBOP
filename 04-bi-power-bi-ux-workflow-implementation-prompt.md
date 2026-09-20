# UBOP — MODULE 04 BI
## Implementation Prompt for AI Agent
### Reference UX/Workflow: Microsoft Power BI
### Scope Lock: BI only — do not start Workflow Automation

---

# 0. MANDATORY EXECUTION RULE

You are implementing **only the BI (Business Intelligence) module of UBOP**.

You MUST NOT begin implementation of:
- Workflow Automation / Flow Designer,
- unrelated CRM changes,
- unrelated OMS changes,
- unrelated ERP changes,
- unrelated provider marketplace changes,
- machine-learning features,
- forecasting engines,
- natural-language analytics,
- data warehouse products outside current scope,
- microservice extraction,
- global shell redesign unless BI cannot function without a narrowly scoped shared change.

You MAY consume existing CRM, OMS and ERP data through approved read contracts, events, projections, analytical views or read models.

You MUST NOT:
- query another module's persistence directly from frontend code,
- duplicate source-of-truth transactional models into BI business logic,
- mutate CRM / OMS / ERP transactional records from BI,
- create a second source of truth.

BI is primarily read-oriented.

When Module 04 satisfies its Definition of Done, STOP.

Do not continue to Module 05 Workflow Automation.

Execution order:

1. Read all project context required by `CLAUDE.md`.
2. Inspect current Core, CRM, OMS, ERP and Provider architecture.
3. Identify available analytical data sources.
4. Produce the BI implementation plan before coding.
5. Implement BI one slice at a time.
6. Add unit/integration/frontend tests immediately per slice.
7. Run build/lint/type/tests after every meaningful slice.
8. Update context and progress documentation.
9. Report completed BI scope and limitations.
10. STOP.

---

# 1. YOUR ROLE

Act as a:
- Senior Enterprise Product Designer,
- Senior Analytics Product Designer,
- Senior Data/Backend Engineer,
- Senior Frontend Engineer.

Primary product reference:

**Microsoft Power BI**

Adopt Power BI's useful interaction principles:
- clear separation between dashboards and reports,
- one-page executive dashboard vs multi-page exploratory report,
- semantic-model-driven authoring,
- reading mode vs editing mode,
- report page tabs,
- slicers,
- filters pane,
- visual-level / page-level / report-level filters,
- cross-filtering,
- cross-highlighting,
- drill-down,
- drill-through,
- bookmarks / saved analytical states,
- focused visual interactions,
- dashboards as curated monitoring surfaces,
- reports as exploratory analytical surfaces,
- reusable metrics/measures,
- role-aware content visibility,
- governed semantic definitions.

Do NOT copy:
- Microsoft branding,
- Power BI logo,
- exact Power BI visual chrome,
- exact colors,
- proprietary icon assets,
- pixel-for-pixel UI.

Clone:
- mental model,
- analytical workflow,
- information architecture,
- reading/editing separation,
- interaction hierarchy,
- filter behavior,
- drill behavior,
- report/dashboard distinction,
- semantic-model governance.

Keep UBOP's own shell, typography, spacing, design tokens, components, iconography and navigation language.

---

# 2. PRODUCT GOAL

The BI module transforms operational data from CRM, OMS and ERP into governed, reusable decision-support experiences.

The module must answer:
- What is happening?
- Why is it happening?
- Where should the user look next?
- Which business dimension explains the result?
- Can the user drill from a high-level metric into relevant underlying data?
- When was the data last refreshed?
- Which data sources contributed to the result?
- Who can view or edit a report?
- Is the result based on a reusable governed metric or an ad-hoc calculation?

The BI module is NOT:
- a collection of decorative charts,
- a second transactional application,
- a dashboard page with random cards,
- a full data science platform,
- a spreadsheet replacement,
- a fake Power BI clone.

The UX must support:

```text
Monitor
  ↓
Explore
  ↓
Filter
  ↓
Compare
  ↓
Drill
  ↓
Understand
  ↓
Navigate to underlying business context
```

---

# 3. CORE POWER BI MENTAL MODEL

UBOP BI must explicitly distinguish:

```text
Semantic Model
      ↓
Report
      ↓
Dashboard / Curated Monitoring Surface
```

And:

```text
Reading Mode
≠
Editing Mode
```

These are separate user jobs.

---

# 4. DASHBOARD VS REPORT — NON-NEGOTIABLE

## Dashboard

A Dashboard is:
- one page,
- curated,
- glanceable,
- monitoring-oriented,
- composed of a limited set of important tiles/visuals.

Dashboard should NOT expose full authoring controls.

Example:

```text
Executive Commerce Dashboard

Revenue
Profit
Orders
Inventory Risk

Revenue Trend

Channel Performance

Top Operational Risks

Provider Health
```

Dashboard = monitor.

## Report

A Report is:
- one or more pages,
- exploratory,
- filterable,
- drillable,
- based on a governed semantic model.

Example:

```text
Sales Performance Report

Pages:
Executive
Channels
Products
Customers
Regions
```

Report = analyze.

Do not collapse these concepts.

---

# 5. BI INFORMATION ARCHITECTURE

Inside UBOP shell:

```text
BI
├── Home
├── Dashboards
├── Reports
├── Metrics
├── Semantic Models
└── Data Refresh
```

Optional later:
- Shared with Me
- Favorites
- Collections
- Alerts

Do not add features merely because Power BI has them.

---

# 6. BI HOME

Purpose: help users reach analytical content quickly.

```text
BI

Favorites
Executive Commerce Dashboard
Inventory Health

Recent
Sales Performance Report
Procurement Efficiency
Customer Pipeline Analysis

Shared with Me
...

Data Health
3 semantic models refreshed recently
1 model has refresh issue
```

Do not show 15 generic KPI cards.

The Home page is for discovery, not analytics itself.

---

# 7. CANONICAL BI DOMAIN MODEL

Use BI-specific metadata models.
Do NOT copy transactional models from CRM/OMS/ERP.

## SemanticModel

```text
id
organization_id
name
description
status
owner_id
source_type
refresh_mode
last_refresh_at?
last_successful_refresh_at?
refresh_status
created_at
updated_at
```

Status:
`DRAFT`, `ACTIVE`, `DEPRECATED`.

Refresh status:
`NEVER_RUN`, `QUEUED`, `RUNNING`, `SUCCEEDED`, `FAILED`, `STALE`.

## SemanticEntity

Examples:
`Orders`, `Customers`, `Products`, `Inventory`, `PurchaseOrders`, `Opportunities`, `Date`.

## SemanticField

Fields include:
- name,
- display name,
- data type,
- field type,
- aggregation behavior,
- format,
- hidden state.

Field types:
`DIMENSION`, `MEASURE`, `DATE`, `IDENTIFIER`.

## Measure / Metric Definition

Reusable governed calculations.

Examples:
- Revenue
- Net Revenue
- Order Count
- Average Order Value
- Open Pipeline Value
- Inventory Available Quantity
- Purchase Order Value

Do not redefine `Revenue` separately on every chart.

## Report

```text
id
organization_id
semantic_model_id
name
description
status
owner_id
created_at
updated_at
published_at?
```

Status:
`DRAFT`, `PUBLISHED`, `ARCHIVED`.

## ReportPage

```text
id
report_id
name
order_index
layout_json
default_filter_state_json?
```

## Visual

```text
id
report_page_id
visual_type
title
configuration_json
position_json
interaction_config_json
```

MVP visual types:
`KPI`, `LINE`, `BAR`, `COLUMN`, `AREA`, `TABLE`, `MATRIX`, `FUNNEL`, `DONUT`.

## Dashboard

One-page curated monitoring surface.

## DashboardTile

A tile may reference a metric, report visual, or analytical query projection.

## SavedView / Bookmark

Preserves personal or report-defined analytical state.

## RefreshRun

Tracks semantic-model refresh execution.

---

# 8. DATA OWNERSHIP RULES

Correct:

```text
CRM / OMS / ERP
      ↓
Analytical Projection / Read Model
      ↓
Semantic Model
      ↓
Report / Dashboard
```

Incorrect:

```text
BI edits order.total
BI updates opportunity.stage
BI changes inventory.quantity
```

BI may navigate users back to source records.

---

# 9. ANALYTICAL DATA ACCESS STRATEGY

For MVP prefer:
- PostgreSQL analytical views,
- materialized views,
- dedicated read models,
- safe aggregation queries,
- background refresh jobs.

Do NOT introduce ClickHouse, BigQuery, Snowflake, Spark, Kafka or lakehouse architecture unless current context requires them.

---

# 10. SEMANTIC MODEL UX

Index:

```text
Semantic Models                             [+ New Model]

Name                    Sources          Last Refresh      Status
Commerce Operations     OMS + ERP        10:30             Healthy
CRM Pipeline            CRM              10:12             Healthy
Procurement             ERP              Yesterday         Stale
```

Detail tabs:

```text
Overview
Entities
Measures
Relationships
Refresh
Usage
```

Do not build a full data-modeling graph canvas unless actually implemented.

---

# 11. METRICS / MEASURES UX

Index:

```text
Metrics

Metric                  Model                  Format         Used By
Revenue                 Commerce Operations    Currency       4 reports
Order Count             Commerce Operations    Integer        3 reports
Open Pipeline Value     CRM Pipeline            Currency       2 reports
Available Inventory     Inventory               Quantity       1 report
```

Metric detail must show:
- description,
- model,
- expression/definition,
- unit/format,
- lineage/source,
- usage.

---

# 12. REPORT READING MODE

Reading Mode is for consumers.
It must NOT show report-authoring controls.

```text
Sales Performance
Last refreshed 10:30

[Executive] [Channels] [Products] [Customers]

Revenue     Orders      AOV       Refund Rate

Revenue Trend

Channel Performance      Product Performance

                              Filters
                              Date
                              Channel
                              Provider
```

Toolbar:
`Reset`, `Bookmark`, `Export`, `Refresh status`, `More`.

Only show actions supported by permission.

---

# 13. REPORT PAGE TABS

Multi-page reports use page tabs.

Requirements:
- active page obvious,
- URL preserves report/page identity,
- report-level filters persist across pages,
- page-level filters remain local.

---

# 14. FILTER MODEL

Support explicit scopes:

```text
Visual Filter
Page Filter
Report Filter
Drillthrough Filter
```

Do not create one undifferentiated filter bucket.

---

# 15. FILTERS PANE

Reading mode users may change existing allowed filters but cannot author arbitrary new filter definitions.

```text
Filters

Report Filters
Date
2026

Page Filters
Channel
All

Visual Filters
Shown when a visual is focused
```

Each filter shows:
- field,
- current selection,
- clear/reset if allowed,
- locked state if configured.

---

# 16. SLICERS

Use on-canvas slicers for high-frequency analytical dimensions such as:
- Date Range
- Channel
- Warehouse
- Region
- Customer Segment
- Supplier

Do not use a slicer for every field.

---

# 17. FILTER STATE RULES

When filters change:
- every affected visual receives the new context,
- no stale visual remains silently,
- loading is localized,
- current filter state is inspectable,
- Reset restores report defaults,
- personal bookmarks may preserve selections.

---

# 18. CROSS-FILTERING

Example:

```text
Channel Revenue Chart
Select Shopify
      ↓
Revenue Trend → Shopify only
Product Table → Shopify only
Order Count → Shopify only
```

Selected state must be obvious and removable.

---

# 19. CROSS-HIGHLIGHTING

Use when retaining total context is valuable.

Example:

```text
Select Shopify
      ↓
Product Category chart keeps all categories
but highlights Shopify contribution
```

Do not use highlighting where it confuses interpretation.

---

# 20. VISUAL INTERACTION CONFIGURATION

In Edit Mode, report designer may configure:

```text
Visual A affects Visual B as:
FILTER
HIGHLIGHT
NONE
```

Do not make every chart automatically affect every other chart.

---

# 21. DRILL-DOWN

Use for hierarchy inside a visual.

Examples:

```text
Year → Quarter → Month → Day
```

```text
Category → Product
```

Drill state and drill-up action must be clear.

---

# 22. DRILL-THROUGH

Drill-through opens a focused destination page with context.

```text
Executive Report
Revenue by Customer
 ↓
Acme
 ↓
Drill Through
 ↓
Customer Performance — Acme
```

Destination must provide clear Back behavior.

---

# 23. OPERATIONAL RECORD NAVIGATION

BI analysis may navigate to source modules:

```text
Customer Performance → Open CRM Account
Order Detail Analysis → Open OMS Order
Inventory Risk → Open ERP Inventory Item
```

Do not implement transactional editing inside BI.

---

# 24. BOOKMARKS / SAVED ANALYTICAL VIEWS

Example:

```text
Save View
Name: Vietnam Shopify Q3
Includes:
[x] Filters
[x] Current page
[ ] Visual spotlight state
Scope: Personal
```

MVP default should prefer personal views.

---

# 25. RESET TO DEFAULT

Provide one clear reset action restoring:
- report filters,
- page filters,
- slicer selections,
- visual selections

to report-defined defaults.

---

# 26. REPORT EDITING MODE

Only users with edit permission enter Editing Mode.

```text
┌──────────────────┬─────────────────────────────┬─────────────────────┐
│ Data / Fields    │ Report Canvas               │ Configuration       │
│                  │                             │                     │
│ Orders           │ [visual] [visual]           │ Visual              │
│ Customers        │                             │ Fields              │
│ Products         │                             │ Format              │
│ Measures         │                             │ Interactions        │
└──────────────────┴─────────────────────────────┴─────────────────────┘
```

Do not show editor panels in Reading Mode.

---

# 27. REPORT EDITOR — FIELDS PANEL

Fields grouped by semantic entity.
Show display names, not raw DB identifiers.
Hide technical/internal fields.

---

# 28. REPORT EDITOR — ADD VISUAL

Flow:

```text
Add Visual
 ↓
Choose visual type
 ↓
Assign fields/measures
 ↓
Configure aggregation
 ↓
Configure title/format
 ↓
Configure interactions
```

Invalid field/visual combinations must produce immediate feedback.

---

# 29. VISUAL TYPES — MVP

Supported set:
- KPI / Metric Card
- Line Chart
- Bar Chart
- Column Chart
- Area Chart
- Donut Chart
- Funnel Chart
- Table
- Matrix if feasible

Do not add maps, gauges, AI visuals or arbitrary custom visuals unless explicitly requested.

---

# 30. KPI / METRIC CARD UX

Example:

```text
Revenue
₫2.84B
+12.4% vs previous period
```

Only show comparison if the comparison calculation exists.
Never fabricate baseline data.

---

# 31. TABLE VISUAL

Analytical table supports:
- sort,
- basic formatting,
- totals if meaningful,
- drill-through,
- operational navigation.

Do not turn it into an editable transactional grid.

---

# 32. REPORT DESIGN RULES

Every report page must answer a defined analytical question.

Before page creation write:

```text
Page question:
Primary audience:
Primary measures:
Primary dimensions:
Primary decision:
Drill path:
```

If there is no clear question, do not build the page.

---

# 33. DASHBOARD UX

One-page curated monitoring example:

```text
Executive Commerce Dashboard
Last refreshed 10:30

Revenue         Profit*        Orders         Inventory Risk
₫2.84B          ₫620M          4,201          12 SKUs

Revenue Trend
Channel Performance
Pipeline vs Orders
Operational Risks
```

`Profit` only if validated cost/revenue logic exists.

---

# 34. DASHBOARD TILE INTERACTION

Tiles may:
- open source report,
- open focused report page,
- navigate to operational list,
- show focus mode if implemented.

Do not turn dashboard into full report exploration.

---

# 35. SEMANTIC MODEL SOURCE MAPPING

Suggested models:

## Commerce Operations
Sources: OMS Orders, OMS Payments, OMS Returns, ERP Cost Transactions, Date.

## CRM Pipeline
Sources: CRM Opportunities, CRM Accounts, CRM Activities, Date.

## Inventory
Sources: ERP Inventory Positions, Goods Movements, Warehouses, product references.

## Procurement
Sources: Purchase Orders, Goods Receipts, Supplier Invoices.

Do not create one mega-model for all business data by default.

---

# 36. DATE DIMENSION

Use one governed Date dimension concept where time analysis is required.

Fields:
- Date
- Year
- Quarter
- Month
- Month Number
- Week
- Day

Do not sort month names alphabetically.

---

# 37. DATA REFRESH UX

`BI → Data Refresh`

```text
Semantic Model          Last Success     Current Status   Trigger
Commerce Operations     10:30            Healthy          Event/manual
CRM Pipeline            10:12            Healthy          Event/manual
Procurement             Yesterday        Stale            Manual
```

---

# 38. REFRESH DETAIL

Show:
- status,
- last successful refresh,
- duration,
- rows processed if available,
- recent runs,
- error details.

Actions:
- Refresh Now
- Retry failed run
- View Error

---

# 39. REFRESH FAILURE UX

Example:

```text
Refresh failed

Model: Procurement
Last successful data: 19 Sep 2026, 18:00
Current report data is stale.

Reason:
Supplier invoice projection timed out.

[Retry Refresh] [View Details]
```

Reports should remain readable using last successful data where safe.

---

# 40. DATA FRESHNESS

Every report/dashboard displays:

```text
Last refreshed 10:30
```

If stale:

```text
Data may be stale
Last successful refresh: Yesterday 18:00
```

---

# 41. REFRESH ARCHITECTURE

```text
Source Module Events / Scheduled Trigger
        ↓
Projection Job
        ↓
Analytical Read Model
        ↓
Semantic Model Refresh Metadata
        ↓
Report Queries
```

Do not execute expensive cross-module joins in every browser request if a projection is appropriate.

---

# 42. SECURITY — CONTENT PERMISSIONS

Conceptual roles:

## BI Viewer
- view published reports/dashboards,
- interact with existing filters,
- drill,
- save personal views if enabled.

## BI Analyst
- Viewer capabilities,
- create/edit reports,
- build visuals,
- create dashboards.

## BI Model Owner
- manage semantic metadata,
- govern metrics,
- configure refresh.

## BI Admin
- broader governance/configuration.

---

# 43. ROW-LEVEL SECURITY CONCEPT

BI must respect source-domain access policies.

Examples:
- sales rep sees permitted CRM scope,
- warehouse manager sees permitted warehouses,
- finance user sees permitted financial scope.

Do not fetch all organization data to frontend and hide rows client-side.

Policy must be enforced server-side/query-layer.

---

# 44. FIELD / METRIC VISIBILITY

Hide technical fields from authoring when they are:
- internal IDs,
- provider raw data,
- sensitive data,
- implementation-only fields.

---

# 45. EXPORT

If implemented:
- enforce same permissions and row policies,
- export current filtered scope when stated,
- make scope explicit,
- use async export for large datasets if needed.

Do not add PDF export unless scope includes it.

---

# 46. SEARCH

BI search covers:
- Dashboards
- Reports
- Metrics
- Semantic Models

---

# 47. EMPTY STATES

No Reports:

```text
No reports yet

Reports provide multi-page interactive analysis using governed semantic models.

[Create Report]
```

For Viewer:

```text
No reports are available to you yet.
```

---

# 48. LOADING STATES

Use:
- report canvas skeleton on first load,
- per-visual loading for filter changes,
- subtle refresh indicators,
- preserved layout during loading.

---

# 49. ERROR STATES

Visual error:

```text
Could not load this visual.
Other report data is still available.
[Retry]
```

Report-level issue:

```text
This report cannot be loaded.
The semantic model is unavailable.
Last known refresh: 10:30
[Retry] [View Data Status]
```

Distinguish:
- query failure,
- permission failure,
- stale data,
- invalid visual config,
- semantic-model failure.

---

# 50. PERFORMANCE

Requirements:
- pre-aggregate where appropriate,
- indexed analytical projections,
- avoid N+1,
- cache stable semantic metadata,
- cancel stale filter requests,
- lazy-load non-active report pages,
- paginate analytical tables,
- limit high-cardinality query explosions,
- refresh asynchronously.

---

# 51. QUERY SAFETY

Do not expose arbitrary raw SQL authoring.

Authors choose:
- semantic fields,
- measures,
- controlled filters,
- supported aggregations.

Server/query layer validates everything.

---

# 52. VISUAL QUERY CONTRACT

Conceptual request:

```text
Semantic Model
Measures
Dimensions
Filters
Sort
Limit
Drill Context
```

Frontend never generates SQL.

---

# 53. NUMBER FORMATTING

Metrics define formats such as:
- Currency
- Percentage
- Quantity
- Duration

Prefer locale-aware output.

---

# 54. VISUAL COLOR RULES

Use UBOP analytical palette.

Rules:
- consistent series colors,
- semantic colors reserved for states/exceptions,
- no rainbow palettes,
- selected/highlighted state obvious,
- accessible contrast.

---

# 55. REPORT AUTHORING WORKFLOW

```text
Create Report
 ↓
Select Semantic Model
 ↓
Name Report
 ↓
Create First Page
 ↓
Add Visual
 ↓
Assign Fields / Measures
 ↓
Configure Filters
 ↓
Configure Interactions
 ↓
Preview Reading Mode
 ↓
Save Draft
 ↓
Publish
```

Do not publish invalid reports.

---

# 56. CREATE REPORT — MODEL SELECTION

Show semantic model name, description and freshness.

```text
Commerce Operations
Orders, Returns, Revenue

CRM Pipeline
Opportunities, Accounts

Inventory
Stock, Warehouses
```

---

# 57. REPORT EDITOR

Editor:

```text
Left: Data / Fields
Center: Canvas
Right: Visual Configuration / Filters / Interactions
Bottom or top: Page Tabs
```

Toolbar:
- Save
- Preview
- Publish
- Undo/Redo if implemented
- Settings

---

# 58. PUBLISH WORKFLOW

```text
Draft Report
 ↓
Validate
 ↓
Review visibility
 ↓
Publish
```

Visibility examples:
- Private
- Workspace
- Specific roles/groups

---

# 59. REPORT READING WORKFLOW

```text
Open Report
 ↓
Load active page
 ↓
Apply default filter context
 ↓
User changes slicer/filter
 ↓
Affected visuals update
 ↓
User cross-filters/highlights
 ↓
User drills down/through
 ↓
User saves view or resets
```

---

# 60. DASHBOARD CREATION WORKFLOW

If included:

```text
Create Dashboard
 ↓
Name
 ↓
Add Tile
 ↓
Choose source: Metric / Report Visual
 ↓
Arrange
 ↓
Save
 ↓
Publish/share
```

Dashboard editor should remain simpler than Report editor.

---

# 61. LINEAGE / SOURCE TRANSPARENCY

Metric detail should answer:

```text
Where does this number come from?
```

Show:
- source module,
- semantic model,
- metric definition,
- last refresh.

---

# 62. PROVIDER / EXTERNAL BI UX

UBOP may support:
- Internal BI provider,
- Power BI provider,
- custom analytics provider.

Externally sourced report metadata may show:

```text
Provider
Power BI

Connection
Corporate Analytics

External Report ID
...

Last Sync
...

Status
Healthy
```

Do not import external provider UI wholesale.

---

# 63. PROVIDER CAPABILITY MODEL

Possible capabilities:

```text
read_dashboards
read_reports
read_semantic_models
refresh_model
embed_report
export_data
create_report
write_report
```

UI respects capability and permission.

---

# 64. ACCESSIBILITY

Mandatory:
- chart accessible names,
- table/text equivalent where feasible,
- keyboard-operable slicers,
- labeled filters,
- selection not color-only,
- accessible page tabs,
- labeled editor controls,
- readable error messages,
- visible focus.

---

# 65. RESPONSIVE BEHAVIOR

Desktop:
- full report editor,
- Filters pane,
- multi-column dashboard,
- analytical tables.

Tablet:
- reading mode fully usable,
- collapsible filters,
- responsive tile reflow.

Mobile:
- dashboard/report consumption,
- filters/slicers,
- drill-through,
- metric monitoring.

Do NOT implement full report authoring on small mobile in MVP.

---

# 66. FRONTEND COMPONENT INVENTORY

Potential components:

```text
BIHome
ContentCard
FavoriteSection
RecentSection

DashboardReader
DashboardTile
DashboardEditor

ReportReader
ReportEditor
ReportPageTabs
ReportCanvas

VisualRenderer
KPIVisual
LineVisual
BarVisual
ColumnVisual
DonutVisual
FunnelVisual
TableVisual

FiltersPane
FilterCard
Slicer
DateSlicer

VisualInteractionOverlay
DrillControls
DrillthroughAction

BookmarkMenu
ResetReportButton

SemanticModelIndex
SemanticModelDetail
SemanticEntityTree
MeasureIndex
MeasureDetail

RefreshStatus
RefreshRunList
StaleDataBanner
VisualErrorState
```

Build only what real usage proves necessary.

---

# 67. BACKEND ARCHITECTURE

```text
BI API
 ↓
BI Application Layer
 ↓
Semantic / Reporting Domain
 ↓
Analytics Query Service
 ↓
Analytical Read Models
```

Sources:

```text
CRM / OMS / ERP
 ↓ events / projections / read contracts
BI Projection Layer
```

Provider:

```text
BI Application
 ↓
BIProviderPort
 ↓
Internal / Power BI / Custom Adapter
```

---

# 68. LIKELY BACKEND SERVICES

```text
SemanticModelService
MetricService
ReportService
DashboardService
ReportQueryService
VisualQueryService
BookmarkService
RefreshService
BIProviderSyncService
```

Avoid one giant `AnalyticsService`.

---

# 69. EXPECTED API CAPABILITY SURFACE

```text
GET    /bi/home

GET    /bi/semantic-models
POST   /bi/semantic-models
GET    /bi/semantic-models/{id}
PATCH  /bi/semantic-models/{id}
POST   /bi/semantic-models/{id}/refresh

GET    /bi/semantic-models/{id}/entities
GET    /bi/semantic-models/{id}/measures
POST   /bi/semantic-models/{id}/measures

GET    /bi/metrics
GET    /bi/metrics/{id}

GET    /bi/reports
POST   /bi/reports
GET    /bi/reports/{id}
PATCH  /bi/reports/{id}
POST   /bi/reports/{id}/publish

GET    /bi/reports/{id}/pages
POST   /bi/reports/{id}/pages

POST   /bi/query

GET    /bi/dashboards
POST   /bi/dashboards
GET    /bi/dashboards/{id}

GET    /bi/reports/{id}/bookmarks
POST   /bi/reports/{id}/bookmarks

GET    /bi/refresh-runs
GET    /bi/refresh-runs/{id}
```

Preserve capabilities even if route conventions differ.

---

# 70. QUERY API

Conceptual request:

```json
{
  "semantic_model_id": "...",
  "measures": ["revenue"],
  "dimensions": ["channel"],
  "filters": [
    {
      "field": "order_date",
      "operator": "between",
      "value": ["2026-07-01", "2026-09-30"]
    }
  ],
  "sort": [
    {
      "field": "revenue",
      "direction": "desc"
    }
  ]
}
```

Server validates:
- model access,
- fields,
- metrics,
- filter operators,
- tenant scope,
- query complexity.

---

# 71. TESTING REQUIREMENTS

## Semantic Model
- creation,
- hidden field behavior,
- metric validation,
- formatting,
- tenant isolation,
- unauthorized access.

## Query
- aggregation correctness,
- filter scope correctness,
- date filtering,
- cross-filter context,
- drillthrough context,
- row-level policy,
- unknown/forbidden field rejection.

## Report
- draft creation,
- page order,
- invalid visual rejected,
- publish validation,
- viewer cannot edit,
- analyst can edit,
- reset defaults.

## Filters
- report filter all pages,
- page filter current page,
- visual filter target visual,
- slicer updates visuals,
- reset defaults.

## Interactions
- cross-filter,
- cross-highlight,
- NONE,
- drill-down/up,
- drill-through,
- back context.

## Refresh
- queued,
- success,
- failure preserves last successful state,
- stale state,
- duplicate refresh protection.

## Frontend
- ReportReader,
- FiltersPane,
- Slicer,
- page tabs,
- stale-data banner,
- visual error isolation,
- permission separation,
- editor visual configuration.

---

# 72. END-TO-END BI FLOWS

## E2E 1 — Build and publish report

```text
Create Semantic Model
 ↓
Define/select Measures
 ↓
Create Report
 ↓
Add Executive page
 ↓
Add Revenue KPI
 ↓
Add Channel chart
 ↓
Add Date slicer
 ↓
Preview
 ↓
Publish
 ↓
Viewer opens report
```

## E2E 2 — Explore report

```text
Open Sales Report
 ↓
Select Channel = Shopify
 ↓
Other visuals cross-filter/highlight
 ↓
Drill into Product Category
 ↓
Drill-through to detail report
 ↓
Return
 ↓
Reset report
```

## E2E 3 — Refresh failure

```text
Report has successful data
 ↓
New refresh fails
 ↓
Report remains readable
 ↓
Stale banner appears
 ↓
Authorized user retries
```

## E2E 4 — Operational navigation

```text
Inventory Risk Report
 ↓
Drill-through SKU
 ↓
View inventory context
 ↓
Open ERP Inventory Item
```

BI remains read-only.

---

# 73. PERFORMANCE ACCEPTANCE

- initial report loads active page only,
- non-active pages lazy-loaded,
- visual queries cancellable,
- filters avoid duplicate requests,
- analytical tables paginated,
- query complexity bounded,
- semantic metadata cached,
- no frontend bulk download of full transactional data,
- refresh async.

---

# 74. SECURITY ACCEPTANCE

- tenant isolation server-side,
- viewer/editor permissions server-side,
- semantic field visibility server-side,
- row-level policy server-side,
- export respects row-level rules,
- raw SQL not exposed,
- provider secrets not exposed,
- refresh actions permissioned.

---

# 75. VISUAL DESIGN RULES

Do:
- neutral analytical canvas,
- clear hierarchy,
- compact filters,
- predictable toolbar,
- restrained chart palette,
- consistent formatting,
- subtle alignment,
- visible selection/filter state.

Do NOT:
- use gradients for every chart,
- use 3D charts,
- use random pie charts everywhere,
- use excessive donut charts,
- put every metric in a card,
- heavily animate charts,
- show irrelevant legends,
- choose chart types without analytical reason.

---

# 76. REPORT DESIGN QUALITY CHECKLIST

Before implementing each report page, write:

```text
Page name:
Question answered:
Audience:
Primary measure:
Supporting measures:
Dimensions:
Recommended visuals:
Primary slicers:
Drill-down hierarchy:
Drill-through destination:
Operational navigation:
Default filter state:
Expected decision/action:
```

If no clear question exists, do not build the page.

---

# 77. IMPLEMENTATION ORDER — STRICT

## BI-01 — Analytical Foundation
Implement BI metadata domain, migrations, repositories, validation and query-contract foundation.

Commit:
`feat(bi): establish semantic analytics foundation`

STOP and verify.

## BI-02 — Analytical Read Models
Implement CRM/OMS/ERP projection contracts, initial views/materialized views/read models, Date dimension, lineage metadata.

Commit:
`feat(bi): add governed analytical read models`

STOP and verify.

## BI-03 — Semantic Models & Metrics
Implement semantic-model index/detail, entities/fields metadata, measure catalog, lineage and permissions.

Commit:
`feat(bi): implement semantic model and metric catalog`

STOP and verify.

## BI-04 — Query Engine
Implement validated analytical query contract, measures, dimensions, filters, sorting, tenant policy and aggregation.

Commit:
`feat(bi): add governed analytical query engine`

STOP and verify.

## BI-05 — Report Reader
Implement Reading Mode, page tabs, visual renderer, visual loading/error isolation and freshness display.

Commit:
`feat(bi): add interactive report reading experience`

STOP and verify.

## BI-06 — Filters & Slicers
Implement filter scopes, Filters pane, slicers, reset and persistence.

Commit:
`feat(bi): implement report filtering and slicers`

STOP and verify.

## BI-07 — Visual Interactions
Implement cross-filter, cross-highlight, NONE mode and interaction configuration.

Commit:
`feat(bi): add cross-visual analytical interactions`

STOP and verify.

## BI-08 — Drill Navigation
Implement drill-down/up, drill-through, back context and operational navigation.

Commit:
`feat(bi): implement drill and contextual navigation`

STOP and verify.

## BI-09 — Report Editor
Implement Editing Mode, fields panel, canvas, visual types, configuration, pages, draft save and preview.

Commit:
`feat(bi): add governed report authoring workspace`

STOP and verify.

## BI-10 — Publishing & Permissions
Implement draft/publish, viewer/analyst/model-owner separation and publish validation.

Commit:
`feat(bi): implement report publishing and access control`

STOP and verify.

## BI-11 — Bookmarks / Saved Views
Implement personal analytical views and restore/reset behavior.

Commit:
`feat(bi): add personal analytical bookmarks`

STOP and verify.

## BI-12 — Dashboards
Implement dashboard index/detail, one-page reader, tiles and simple editing if in scope.

Commit:
`feat(bi): add curated monitoring dashboards`

STOP and verify.

## BI-13 — Refresh & Data Health
Implement refresh runs, stale status, retry, refresh detail and asynchronous jobs.

Commit:
`feat(bi): add analytical refresh and data health workflow`

STOP and verify.

## BI-14 — BI Home
Implement favorites, recents, shared content, search and data health.

Commit:
`feat(bi): add analytics discovery home`

STOP and verify.

## BI-15 — Provider & External BI Integration
Implement only current provider scope: provenance, capabilities, external IDs, sync/embed/read boundaries.

Commit:
`feat(bi): surface analytics provider integration state`

STOP and verify.

## BI-16 — Hardening
Review row-level policy, tenant isolation, accessibility, responsive reader, query limits, error isolation, stale data UX, performance, E2E and docs.

Split commits by concern:

```text
fix(bi): enforce row-level analytical access
fix(bi): isolate visual query failures
test(bi): cover report exploration workflows
docs(context): record power-bi-inspired interaction model
```

Never create one giant hardening commit.

---

# 78. DEFINITION OF DONE — BI MODULE

## Product
- [ ] Semantic Models exist.
- [ ] Metrics/measures are governed and reusable.
- [ ] Reports are distinct from Dashboards.
- [ ] Reports support multiple pages.
- [ ] Reading and Editing mode are distinct.
- [ ] Filters pane works.
- [ ] Slicers work.
- [ ] Cross-filter works.
- [ ] Cross-highlight works where configured.
- [ ] Drill-down works.
- [ ] Drill-through works.
- [ ] Reset to default works.
- [ ] Personal bookmark works if in scope.
- [ ] Report authoring works for supported visuals.
- [ ] Reports publish with permissions.
- [ ] Dashboard provides one-page monitoring.
- [ ] Refresh status/freshness is visible.
- [ ] Failed refresh preserves last successful readable data where safe.
- [ ] BI navigates to operational source records without editing them.

## UX
- [ ] Every report page has a defined analytical question.
- [ ] Dashboards are not treated as multi-page reports.
- [ ] Reader does not see authoring clutter.
- [ ] Editor has fields/canvas/config separation.
- [ ] Filters have explicit scope.
- [ ] Current filter state is inspectable.
- [ ] Selected visual state is clear.
- [ ] Reset is obvious.
- [ ] Drill navigation preserves context.
- [ ] Freshness is visible.
- [ ] Empty/loading/error states exist.
- [ ] Mobile consumption works.
- [ ] Full mobile authoring is not forced.
- [ ] Accessibility verified.

## Engineering
- [ ] BI does not mutate CRM/OMS/ERP transactional state.
- [ ] No direct frontend query of other modules' persistence.
- [ ] Analytical read model is separate.
- [ ] Query layer validates fields/measures.
- [ ] Tenant policy enforced server-side.
- [ ] Row-level access enforced server-side.
- [ ] Query complexity bounded.
- [ ] Refresh asynchronous.
- [ ] Semantic metadata cached appropriately.
- [ ] Unit/integration/frontend/E2E tests pass.
- [ ] Build/lint/type checks pass.
- [ ] Migrations pass.
- [ ] Context/progress docs updated.

---

# 79. FINAL AGENT CHECKLIST BEFORE EACH BI SCREEN

Before coding every BI page or feature, explicitly determine:

```text
User role:
User job:
Power BI reference pattern:
Content type:
  Dashboard / Report / Semantic Model / Metric / Refresh
Mode:
  Reading / Editing
Analytical question:
Semantic model:
Measures:
Dimensions:
Filter scopes:
Slicers:
Visual interactions:
Drill behavior:
Operational navigation:
Data freshness behavior:
Permission behavior:
Empty state:
Loading behavior:
Error isolation:
Responsive behavior:
Accessibility behavior:
```

If unclear:
- inspect context,
- inspect current data model,
- do not invent metrics or business definitions.

---

# 80. STOP CONDITION

After BI-16 and BI Definition of Done, report:

1. BI slices implemented.
2. Tests run and results.
3. Semantic models implemented.
4. Metrics defined.
5. Supported visual types.
6. Filter / interaction / drill behaviors implemented.
7. Refresh architecture.
8. Security / row-level access decisions.
9. Remaining BI limitations.
10. Context files updated.
11. Suggested branch/commit history.

Then STOP.

Do not begin Workflow Automation.

Wait for explicit instruction for Module 05.
