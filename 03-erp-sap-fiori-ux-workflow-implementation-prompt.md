# UBOP — MODULE 03 ERP
## Implementation Prompt for AI Agent
### Reference UX/Workflow: SAP Fiori / SAP S/4HANA interaction patterns
### Scope Lock: ERP only — do not start BI or Workflow Automation

---

# 0. MANDATORY EXECUTION RULE

You are implementing **only the ERP module of UBOP**.

You MUST NOT begin implementation of:
- BI report authoring,
- workflow automation builder,
- unrelated CRM features,
- unrelated OMS redesign,
- unrelated provider marketplace features,
- microservice extraction,
- global shell redesign unless an ERP requirement cannot be satisfied otherwise.

You MAY consume existing OMS and CRM capabilities through approved contracts/ports.

You MUST NOT import or access another module's persistence/repository directly.

Examples:

```text
ERP may depend on:
ProductReferencePort
OrderDemandPort
OrganizationUserPort
NotificationPort
ProviderPort

ERP must NOT directly import:
OMS repositories
CRM repositories
BI implementation
Workflow engine implementation
```

When ERP satisfies all acceptance criteria and tests, STOP.

Do not continue to BI.

Execution order:

1. Read every project context file required by `CLAUDE.md`.
2. Inspect the existing Core, CRM, OMS, and Provider architecture.
3. Produce an ERP implementation plan before editing code.
4. Implement one ERP slice at a time.
5. Add tests immediately after each slice.
6. Run tests/build/lint/type checks after every meaningful slice.
7. Update progress/context documentation.
8. Report completed ERP scope and remaining ERP gaps.
9. STOP.

---

# 1. YOUR ROLE

Act as a **Senior Enterprise Product Designer + Senior ERP Product Engineer + Senior Frontend Engineer + Senior Backend Engineer**.

Primary UX/workflow reference:

**SAP Fiori / SAP S/4HANA**

Adopt these SAP Fiori principles:

- role-based workspaces,
- task-oriented pages,
- List Report for large business-object collections,
- Object Page for complex business objects,
- Analytical List Page for combined analytics + operations,
- Worklist for items requiring processing,
- clear semantic actions,
- progressive disclosure,
- dense but structured enterprise information,
- explicit document lifecycle,
- auditability,
- strong transaction boundaries,
- process states,
- draft/review/approval semantics where relevant,
- responsive enterprise layouts.

Do NOT copy:
- SAP branding,
- SAP logos,
- exact SAP colors,
- proprietary illustrations,
- pixel-for-pixel SAP screens.

Clone:
- information architecture,
- task-oriented navigation,
- page floorplan logic,
- record lifecycle,
- operational data density,
- action hierarchy,
- document workflow,
- state handling,
- error recovery,
- audit principles.

Keep UBOP's own:
- typography,
- spacing,
- colors,
- component primitives,
- icon system,
- shell/navigation.

---

# 2. ERP PRODUCT GOAL

The ERP module is the operational backbone for:

```text
Inventory
Warehouses / Locations
Suppliers
Procurement
Goods Movements
Operational Finance
```

The ERP module must answer:

- What stock do we currently have?
- Where is that stock?
- What stock is reserved, incoming, blocked, or available?
- Which materials/products are low or at risk?
- Which purchase requests need action?
- Which purchase orders are draft, approved, sent, partially received, or complete?
- What goods were received and when?
- What stock transfers are in progress?
- Which supplier invoices are pending or matched?
- What operational costs are associated with procurement?
- Which actions are waiting for a specific role?
- Who performed each inventory or financial action?
- What external ERP/provider is authoritative for this record?
- Is provider synchronization healthy?

ERP is NOT:
- a generic dashboard,
- a set of CRUD tables,
- a duplicate of OMS,
- a full accounting suite in MVP,
- a warehouse robotics/WMS system unless explicitly added later.

---

# 3. CRITICAL MODULE BOUNDARIES

## 3.1 ERP owns

ERP owns the canonical operational records for:

```text
Warehouse
Storage Location
Inventory Position
Stock Reservation
Goods Movement
Supplier
Purchase Requisition
Purchase Order
Goods Receipt
Supplier Invoice / Payable-facing document
Operational Cost Posting
Stock Transfer
```

## 3.2 OMS owns

OMS owns:

```text
Order
OrderLine
Payment
Fulfillment
Return
Refund
Commerce Product / Variant representation
```

ERP MUST NOT duplicate OMS order lifecycle.

ERP may consume:

```text
OrderDemandPort
ProductReferencePort
FulfillmentDemandPort
```

Example:

```text
OMS Order confirmed
      ↓
InventoryReservationPort
      ↓
ERP reserves stock
```

## 3.3 CRM owns

CRM owns:

```text
Lead
Account
Contact
Opportunity
Activity
```

ERP may reference business partners through approved identifiers/contracts.

Supplier is an ERP procurement entity and should not be implemented as a CRM Lead/Opportunity.

---

# 4. SAP FIORI PAGE-TYPE MAPPING FOR UBOP ERP

Every ERP page must be assigned one of these page patterns before implementation.

## 4.1 Overview Page

Use when the role needs a high-level landing page.

Example:
`ERP / Warehouse Manager`

Shows:
- urgent work,
- KPIs with action,
- exceptions,
- recently processed records.

Do NOT use Overview Page as an excuse for random cards.

## 4.2 List Report

Use when the primary job is:

```text
Find
Filter
Compare
Select
Act
Navigate to object
```

Use for:
- Purchase Orders
- Suppliers
- Goods Receipts
- Stock Transfers
- Supplier Invoices
- Material Documents

## 4.3 Object Page

Use for a single complex business object.

Use for:
- Purchase Order
- Supplier
- Warehouse
- Goods Receipt
- Stock Transfer
- Supplier Invoice
- Inventory Item / Product Stock Detail

Object pages must have:
- identity,
- lifecycle state,
- key facts,
- semantic actions,
- structured sections,
- related documents,
- audit/history.

## 4.4 Analytical List Page

Use when the user must:

```text
Analyze
Identify exception
Filter
Then act on transactional records
```

Use for:
- Inventory analysis
- Slow/non-moving stock
- Low-stock analysis
- Procurement spend analysis where MVP permits
- Goods movement anomaly review

## 4.5 Worklist

Use when the user primarily processes a queue.

Use for:
- Purchase approvals
- Pending goods receipts
- Invoice matching issues
- Inventory discrepancies
- Stock transfer receiving queue.

---

# 5. ERP INFORMATION ARCHITECTURE

Inside the UBOP shell:

```text
ERP
├── Overview
├── Inventory
├── Warehouses
├── Suppliers
├── Purchasing
│   ├── Requisitions
│   ├── Purchase Orders
│   └── Goods Receipts
├── Stock Movements
│   ├── Movements
│   └── Transfers
└── Finance
    ├── Supplier Invoices
    └── Cost Transactions
```

Do not expose database terminology in navigation.

Use `Goods Receipts`, not `inventory_inbound_transactions`.

---

# 6. ROLE-BASED ERP HOME

SAP Fiori favors role-oriented experiences.

ERP Overview should adapt by role.

Do NOT show the exact same dashboard to every ERP user.

## 6.1 Warehouse / Inventory Manager

```text
ERP / Inventory Operations

Needs Attention
Low stock items             12
Pending goods receipts       5
Inventory discrepancies      3
Transfers awaiting receipt   4

Inventory Health
[Availability / risk visualization]

My Work
- Receive PO-1023
- Review damaged receipt GR-203
- Confirm transfer ST-041

Recent Movements
[list]
```

## 6.2 Procurement Manager

```text
ERP / Procurement

Needs Attention
Purchase requisitions waiting     8
POs awaiting approval             4
POs overdue                       3
Receipts with variance            2

Spend in period
...

Supplier issues
...

My Work
...
```

## 6.3 Finance Operations User

```text
ERP / Finance Operations

Needs Attention
Invoices awaiting review       7
Invoice mismatch               3
Payment-ready invoices        12

Purchase liability summary
...

Recent cost postings
...
```

Do NOT implement a full general ledger unless explicitly required.

---

# 7. CANONICAL ERP DOMAIN MODEL

Use UBOP canonical models independent of SAP/external provider schemas.

## 7.1 Warehouse

```text
id
organization_id
code
name
status
address
timezone?
provider_reference?
sync_status
created_at
updated_at
```

Status: `ACTIVE`, `INACTIVE`.

## 7.2 StorageLocation

```text
id
warehouse_id
code
name
type
status
created_at
updated_at
```

Examples:
- Main Storage
- Returns
- Quality Inspection
- Blocked Stock

Do not implement bin-level WMS complexity unless explicitly required.

## 7.3 InventoryPosition

```text
id
organization_id
product_reference
warehouse_id
storage_location_id
on_hand_quantity
reserved_quantity
blocked_quantity
incoming_quantity
version
created_at
updated_at
```

Derived:

```text
available_quantity =
on_hand_quantity
- reserved_quantity
- blocked_quantity
```

Do not manually store `available_quantity` unless architecture requires a denormalized projection.

## 7.4 StockReservation

```text
id
organization_id
product_reference
warehouse_id
storage_location_id?
source_type
source_reference
quantity
status
expires_at?
created_at
updated_at
```

Status:
`ACTIVE`, `RELEASED`, `CONSUMED`, `CANCELLED`, `EXPIRED`.

ERP owns reservation truth.

## 7.5 GoodsMovement

Every stock-changing transaction produces a movement record.

```text
id
organization_id
movement_number
movement_type
product_reference
quantity
unit
from_warehouse_id?
from_location_id?
to_warehouse_id?
to_location_id?
reference_type?
reference_id?
reason_code?
note?
actor_id
posted_at
provider_reference?
sync_status
created_at
```

Movement types:

```text
GOODS_RECEIPT
GOODS_ISSUE
TRANSFER_OUT
TRANSFER_IN
ADJUSTMENT_IN
ADJUSTMENT_OUT
RETURN_TO_SUPPLIER
RESERVATION_CONSUMPTION
```

Do not edit posted quantities silently.

## 7.6 Supplier

```text
id
organization_id
supplier_code
name
status
tax_identifier?
email?
phone?
address
payment_terms?
currency?
provider_reference?
sync_status
created_at
updated_at
```

Status:
`ACTIVE`, `ON_HOLD`, `INACTIVE`.

## 7.7 PurchaseRequisition

```text
id
organization_id
requisition_number
requester_id
status
needed_by?
reason?
created_at
updated_at
```

Status:
`DRAFT`, `SUBMITTED`, `APPROVED`, `REJECTED`, `PARTIALLY_ORDERED`, `ORDERED`, `CANCELLED`.

## 7.8 PurchaseRequisitionLine

```text
id
requisition_id
product_reference
description_snapshot
quantity
unit
estimated_unit_cost?
currency?
preferred_supplier_id?
warehouse_id?
storage_location_id?
created_at
updated_at
```

## 7.9 PurchaseOrder

```text
id
organization_id
po_number
supplier_id
buyer_id
status
currency
subtotal
tax_total
shipping_total?
grand_total
order_date
expected_delivery_date?
warehouse_id
provider_reference?
sync_status
created_at
updated_at
```

Status:
`DRAFT`, `PENDING_APPROVAL`, `APPROVED`, `SENT`, `PARTIALLY_RECEIVED`, `RECEIVED`, `CANCELLED`, `CLOSED`.

## 7.10 PurchaseOrderLine

```text
id
purchase_order_id
product_reference
description_snapshot
ordered_quantity
received_quantity
unit
unit_cost
line_total
expected_delivery_date?
created_at
updated_at
```

## 7.11 GoodsReceipt

```text
id
organization_id
receipt_number
purchase_order_id?
warehouse_id
status
received_at
received_by
supplier_delivery_reference?
note?
provider_reference?
sync_status
created_at
updated_at
```

Status:
`DRAFT`, `POSTED`, `REVERSED`.

## 7.12 GoodsReceiptLine

```text
id
goods_receipt_id
purchase_order_line_id?
product_reference
expected_quantity?
received_quantity
accepted_quantity
blocked_quantity
damaged_quantity
storage_location_id?
note?
```

## 7.13 StockTransfer

```text
id
organization_id
transfer_number
from_warehouse_id
to_warehouse_id
status
requested_at
shipped_at?
received_at?
created_by
created_at
updated_at
```

Status:
`DRAFT`, `READY`, `IN_TRANSIT`, `PARTIALLY_RECEIVED`, `RECEIVED`, `CANCELLED`.

## 7.14 StockTransferLine

```text
id
stock_transfer_id
product_reference
requested_quantity
shipped_quantity
received_quantity
unit
```

## 7.15 SupplierInvoice

```text
id
organization_id
invoice_number
supplier_id
purchase_order_id?
status
invoice_date
due_date?
currency
subtotal
tax_total
grand_total
matched_amount
variance_amount
provider_reference?
sync_status
created_at
updated_at
```

Status:
`DRAFT`, `PENDING_REVIEW`, `MATCHED`, `MISMATCH`, `APPROVED`, `PAYMENT_READY`, `PAID`, `CANCELLED`.

Do not build banking/payment rails in this module unless explicitly required.

## 7.16 CostTransaction

```text
id
organization_id
type
reference_type
reference_id
amount
currency
category
posted_at
note?
created_at
```

Keep this narrower than a general ledger.

---

# 8. INVENTORY — ANALYTICAL LIST PAGE

Purpose:

```text
Analyze inventory
 ↓
Identify risk / anomaly
 ↓
Filter
 ↓
Open item
 ↓
Take operational action
```

## 8.1 Page anatomy

```text
ERP / Inventory

Filter Bar
Warehouse [All]   Location [All]   Product [Search]
Stock Status [All]   Provider [All]              [Go]

KPI Tags
Total Stock Value* | Low Stock | Blocked Stock | Incoming

Visual Filter / Chart
Stock coverage by category or warehouse

Inventory Table
Product      Warehouse      On Hand   Reserved   Available   Incoming   Status
P-101        Main           120       30         90          50         Healthy
P-102        Main            10        8          2           0         Low
```

`Total Stock Value` is allowed only if valuation data exists.

## 8.2 Filter behavior

Filters must affect:
- KPIs,
- chart,
- table.

Support:
- warehouse,
- location,
- product,
- stock status,
- provider/source.

## 8.3 Inventory status

Derived examples:
`HEALTHY`, `LOW`, `OUT_OF_STOCK`, `BLOCKED`, `OVERSTOCK`.

Thresholds live in domain/config, not UI.

---

# 9. INVENTORY OBJECT PAGE

```text
Industrial Container A
SKU P-101

Main Warehouse

Available 90 · On Hand 120 · Reserved 30

[Adjust Stock] [Transfer Stock] [More ▾]
```

Sections:
- Overview
- Stock by Location
- Reservations
- Incoming
- Movement History
- Provider / System

Movement history is chronological and non-destructive.

---

# 10. STOCK ADJUSTMENT WORKFLOW

Entry:
`Adjust Stock`

Fields:

```text
Product
Warehouse
Location
Adjustment Type: Increase / Decrease
Quantity
Reason *
Note
```

Review:

```text
Current on hand
120

Adjustment
-5

New on hand
115

[Cancel] [Post Adjustment]
```

On success:
- create GoodsMovement,
- update inventory atomically,
- record actor/time/reason,
- write audit event.

Never directly overwrite quantity without movement history.

---

# 11. WAREHOUSE LIST AND OBJECT PAGE

List Report:

```text
Warehouses                                      [+ New Warehouse]

Code       Warehouse        Locations      Stock Items     Status
WH-MAIN    Main Warehouse   4              312             Active
WH-02      Secondary        2              128             Active
```

Object Page sections:
- General
- Storage Locations
- Inventory Summary
- Open Receipts
- Open Transfers
- Provider
- Audit

Do not turn Warehouse page into a full WMS.

---

# 12. SUPPLIER LIST AND OBJECT PAGE

List:

```text
Suppliers                                       [+ New Supplier]

Supplier        Status     Open POs    Open Value    Last Order
ABC Resin       Active     4           230M          18 Sep
Delta Pack      Active     1            44M          14 Sep
```

Object page:

```text
ABC Resin
Active

[Create Purchase Order] [Edit] [More]
```

Sections:
- Overview
- Purchase Orders
- Receipts
- Invoices
- Contact / Communication Data
- Documents
- Provider
- Audit

---

# 13. PURCHASE REQUISITION WORKFLOW

Lifecycle:

```text
DRAFT
 ↓
SUBMITTED
 ↓
APPROVED
 ↓
PARTIALLY_ORDERED / ORDERED
```

Alternative:
`SUBMITTED → REJECTED`

List / Worklist:

```text
Purchase Requisitions

[ My Requests ] [ Awaiting Approval ] [ Approved ] [ Unordered ]

PR        Requester    Needed By    Estimated Value    Status
PR-1021   Huy          28 Sep       40M                Submitted
```

Object page:

```text
PR-1021
Submitted

[Approve] [Reject] [More]
```

Sections:
- Items
- Purpose / Reason
- Suggested Suppliers
- Related Purchase Orders
- Approval History
- Audit

If global Workflow Automation is not yet implemented, use a bounded ERP state machine only.

---

# 14. CREATE PURCHASE ORDER FROM REQUISITION

Flow:

```text
Approved Requisition
 ↓
Select requisition lines
 ↓
Choose supplier
 ↓
Confirm quantities / costs
 ↓
Delivery destination
 ↓
Terms
 ↓
Review
 ↓
Create PO
```

Partial ordering is valid.

100 requested, 60 ordered → `PARTIALLY_ORDERED`.

---

# 15. PURCHASE ORDER LIST REPORT

```text
Purchase Orders                                [+ Create PO]

Filter Bar
Supplier [All]
Status [Open]
Warehouse [All]
Expected Date [Next 30 days]
Provider [All]                                  [Go]

KPI Strip
Open Value | Awaiting Approval | Overdue | Awaiting Receipt

PO        Supplier      Value     Status        Expected
PO-1023   ABC Resin     120M      Approved      25 Sep
PO-1024   Delta Pack     44M      Draft         28 Sep
```

KPI and table share filter context.

---

# 16. PURCHASE ORDER OBJECT PAGE

```text
PO-1023
Approved · ABC Resin

[Send to Supplier] [Receive Goods] [More ▾]

Header Facts
Value         ₫120M
Warehouse     Main
Ordered       19 Sep
Expected      25 Sep
Buyer         Lan Nguyen
```

Sections:
- General
- Items
- Receiving
- Invoices
- Documents
- Provider
- Audit

PO item table:

```text
Product           Ordered    Received    Remaining    Unit Cost    Total
Resin A           1000 kg    600 kg      400 kg       100k         100M
Additive B         100 kg     100 kg        0 kg       200k          20M
```

---

# 17. PURCHASE ORDER LIFECYCLE

```text
DRAFT
 ↓
PENDING_APPROVAL
 ↓
APPROVED
 ↓
SENT
 ↓
PARTIALLY_RECEIVED
 ↓
RECEIVED
 ↓
CLOSED
```

Use semantic actions:

```text
Draft → Submit for Approval
Pending Approval → Approve / Reject
Approved → Send to Supplier
Sent → Receive Goods
Partially Received → Receive Remaining
Received → Close
```

No generic status dropdown.

---

# 18. CREATE PURCHASE ORDER

Full-page flow:

```text
Supplier
 ↓
Items
 ↓
Delivery
 ↓
Commercial Terms
 ↓
Review
 ↓
Create Draft
```

Do not create directly into Approved unless role/process explicitly allows it.

Supplier on hold must show blocking warning.

---

# 19. GOODS RECEIPT WORKFLOW

A Goods Receipt is a stock-affecting posting.

Flow:

```text
Purchase Order
 ↓
Select open PO lines
 ↓
Enter received quantities
 ↓
Classify accepted/blocked/damaged
 ↓
Choose destination location
 ↓
Review variance
 ↓
Post Goods Receipt
 ↓
Create Goods Movement(s)
 ↓
Update Inventory
 ↓
Update PO received quantities/status
 ↓
Record audit/history
```

Example:

```text
PO-1023

Resin A
Ordered          1000 kg
Previously recv   600 kg
Remaining         400 kg

Receive now      [380] kg

Accepted         [370]
Blocked          [10]
Damaged          [0]
```

Quantities must reconcile.

If tolerance logic is not defined:
- block over-receipt,
- allow under-receipt,
- keep PO partially received.

On success:
- GoodsReceipt POSTED,
- lines saved,
- GoodsMovement created,
- inventory updated,
- PO recalculated,
- audit/history written,
- provider sync queued if needed.

---

# 20. GOODS RECEIPT LIST / OBJECT / REVERSAL

List:

```text
Goods Receipts

Receipt      PO        Supplier      Warehouse    Received At    Status
GR-2001      PO-1023   ABC Resin     Main         20 Sep         Posted
```

Object Page sections:
- General
- Items
- Stock Movements
- Related Purchase Order
- Provider
- Audit

Reversal:

```text
Posted Receipt
 ↓
Reverse Receipt
 ↓
Reason
 ↓
Review affected stock
 ↓
Post Reversal
 ↓
Create reverse GoodsMovement
 ↓
Update inventory
 ↓
Recalculate PO
```

Never edit a posted receipt to undo it.

---

# 21. STOCK MOVEMENTS LIST

This is the stock audit ledger.

```text
Stock Movements

Movement    Type            Product     Qty      From      To      Reference
MV-1001     Goods Receipt   Resin A     +370     -         Main    GR-2001
MV-1002     Transfer Out    Resin A      -50     Main      Transit ST-041
```

No generic Edit action.

---

# 22. STOCK TRANSFER WORKFLOW

```text
Create Transfer
 ↓
Select source warehouse
 ↓
Select destination warehouse
 ↓
Select products / quantities
 ↓
Review availability
 ↓
Confirm transfer
 ↓
READY
 ↓
Ship / Post Transfer Out
 ↓
IN_TRANSIT
 ↓
Receive at destination
 ↓
Post Transfer In
 ↓
RECEIVED
```

Cannot transfer more than transferable availability.

Two-step transfer must represent in-transit state; do not instantly add to destination.

Receiving must handle partial quantity and discrepancies explicitly.

---

# 23. INVENTORY RESERVATION FOR OMS

ERP provides:

```text
InventoryReservationPort

checkAvailability(...)
reserve(...)
release(...)
consume(...)
```

Flow:

```text
OMS confirms order
 ↓
ERP reserve
 ↓
StockReservation ACTIVE
 ↓
Fulfillment
 ↓
Reservation CONSUMED
```

Cancellation releases reservation.

No direct ORM access across modules.

---

# 24. SUPPLIER INVOICE WORKFLOW

MVP scope is operational supplier invoice + matching.

Lifecycle:

```text
DRAFT
 ↓
PENDING_REVIEW
 ↓
MATCHED
 ↓
APPROVED
 ↓
PAYMENT_READY
```

Mismatch path:

```text
PENDING_REVIEW
 ↓
MISMATCH
 ↓
Resolve
 ↓
MATCHED
```

List:

```text
Supplier Invoices

Invoice       Supplier      PO        Amount     Variance     Status
INV-881       ABC Resin     PO-1023   120M       0            Matched
INV-882       Delta Pack    PO-1024    46M       2M           Mismatch
```

Object Page sections:
- General
- Invoice Lines
- Purchase Order Match
- Goods Receipt Match
- Variance
- Cost Posting
- Documents
- Provider
- Audit

---

# 25. THREE-WAY MATCHING

When data exists, compare:

```text
Purchase Order
      ↕
Goods Receipt
      ↕
Supplier Invoice
```

At minimum:
- quantity,
- unit cost/amount,
- supplier,
- relevant line identity.

Match states:

```text
MATCHED
QUANTITY_MISMATCH
PRICE_MISMATCH
MISSING_RECEIPT
MISSING_PO
OTHER_MISMATCH
```

Do not claim accounting-grade matching beyond implemented rules.

---

# 26. MISMATCH RESOLUTION

Example:

```text
INV-882

PO Amount
44M

Invoice Amount
46M

Variance
+2M

Resolution
○ Accept variance
○ Correct invoice data
○ Return to supplier
```

Only show supported actions.

Permission required.

Audit the decision.

---

# 27. COST TRANSACTIONS

Operational cost visibility only.

Examples:

```text
PURCHASE_COST
SHIPPING_COST
HANDLING_COST
ADJUSTMENT_COST
```

Do not build a full double-entry general ledger.

---

# 28. PROVIDER / EXTERNAL ERP UX

Externally sourced records show:

```text
Provider
SAP S/4HANA

Connection
Vietnam ERP

External ID
4500010231

Last Sync
4 min ago

Sync
Healthy
```

Business state and sync state remain separate.

Example:

```text
Purchase Order
Approved

Provider Sync
Failed
```

---

# 29. PROVIDER CAPABILITY-AWARE ACTIONS

Possible capabilities:

```text
read_inventory
write_inventory_adjustment
read_suppliers
write_suppliers
read_purchase_orders
create_purchase_order
approve_purchase_order
post_goods_receipt
read_supplier_invoices
write_supplier_invoice
```

Action availability considers:
- UBOP permission,
- document state,
- provider capability,
- source-of-truth policy.

---

# 30. PERMISSION MODEL

Conceptual roles:

## Warehouse Clerk
- view inventory,
- post authorized goods receipts,
- process transfers,
- view movements.

## Inventory Manager
- adjustments,
- transfer oversight,
- exception review,
- warehouse administration.

## Buyer / Procurement User
- create requisitions,
- create/edit draft POs,
- use suppliers.

## Procurement Manager
- approve requisitions/POs,
- supplier hold decisions if supported.

## Finance Operations
- invoice review,
- mismatch resolution,
- cost transactions.

## ERP Admin
- provider/config/master-data controls.

Financial and inventory permissions are separate.

---

# 31. ACTION VISIBILITY RULE

Bad:

```text
[Edit Status]
```

Good:

```text
[Submit for Approval]
[Approve]
[Receive Goods]
[Reverse Receipt]
[Ship Transfer]
[Receive Transfer]
[Resolve Mismatch]
```

Use business language.

---

# 32. DRAFT VS POSTED RECORDS

Draftable:
- Requisition
- Purchase Order
- Supplier Invoice
- Goods Receipt before posting

Once a transaction is posted/approved and changes stock/business state:
- do not permit arbitrary edits,
- use reversal/correction workflow.

---

# 33. CONCURRENCY

Protect:
- two receipts against the same PO,
- concurrent stock adjustments,
- reservation vs transfer race,
- provider event vs user action.

Use:
- DB transaction,
- revalidation,
- optimistic versioning or locks as appropriate.

Frontend conflict:

```text
This purchase order changed while you were receiving it.

Remaining quantity is now 120 kg instead of 400 kg.

[Reload Purchase Order]
```

---

# 34. INVENTORY INVARIANTS

Default MVP:

```text
on_hand >= 0
reserved >= 0
blocked >= 0
reserved + blocked <= on_hand
```

Do not allow negative stock unless product requirements explicitly change this.

---

# 35. PRECISION AND UNITS

Use:
- decimal-safe money types,
- explicit currency,
- decimal-safe quantities,
- explicit unit.

Examples:

```text
100 pcs
250.500 kg
1,000.00 liters
```

Do not silently convert units.

---

# 36. AUDITABILITY

Audit:
- stock adjustment,
- PO approval/rejection,
- goods receipt,
- receipt reversal,
- transfer ship/receive,
- invoice approval,
- mismatch resolution,
- provider manual retry,
- supplier hold/unhold.

Store:
- actor,
- timestamp,
- entity,
- action,
- reason,
- before/after where appropriate,
- provider context.

---

# 37. EMPTY / LOADING / ERROR STATES

Empty states explain:
1. what the page is,
2. why empty,
3. next allowed action.

Loading:
- skeleton on first load,
- local action progress,
- provider sync progress,
- never blank whole Object Page for one section refresh.

ERP errors must state:
1. action that failed,
2. whether document changed,
3. whether stock/financial state changed,
4. reason,
5. recovery.

Example:

```text
Goods receipt was not posted.

Inventory was not changed.
PO-1023 remains Partially Received.

Received quantity exceeds the remaining PO quantity.

[Review Quantities]
```

---

# 38. RESPONSIVE & ACCESSIBILITY

Desktop-first.

Desktop:
- filter bars,
- analytical list,
- dense tables,
- Object Pages,
- worklists.

Tablet:
- collapsed sidebar,
- fewer columns,
- stacked sections.

Mobile:
- approvals,
- lookup,
- basic receiving when safe,
- inventory lookup,
- transfer receiving.

Accessibility:
- semantic tables,
- visible focus,
- keyboard actions,
- status not color-only,
- form labels,
- field-linked errors,
- charts with table/text equivalent.

---

# 39. FRONTEND COMPONENT INVENTORY

Candidates:

```text
ERPOverview
RoleWorkQueue

ERPFilterBar
ERPListReport
ERPObjectHeader
ERPObjectSections
SemanticActionBar

InventoryAnalyticalList
InventoryKPIHeader
InventoryChart
InventoryTable
InventoryPositionSummary
MovementHistory
StockAdjustmentDialog

SupplierList
SupplierObjectPage

RequisitionList
RequisitionObjectPage
ApprovalPanel

PurchaseOrderList
PurchaseOrderObjectPage
PurchaseOrderLineTable
ReceivingProgress

GoodsReceiptWizard
GoodsReceiptObjectPage
ReceiptVarianceSummary

StockTransferWizard
StockTransferObjectPage

SupplierInvoiceList
SupplierInvoiceObjectPage
MatchSummary
MismatchResolutionPanel

ProviderProvenance
SyncStatus
SyncErrorBanner
AuditTimeline
```

Build only what current scope uses.

---

# 40. BACKEND ARCHITECTURE

```text
ERP API
  ↓
ERP Application Layer
  ↓
ERP Domain
  ↓
Repository Ports
  ↓
Infrastructure
```

Cross-module:

```text
ERP → ProductReferencePort → OMS adapter/interface
OMS → InventoryReservationPort → ERP application adapter
```

Provider:

```text
ERP Application
  ↓
ERPProviderPort
  ↓
SAP / Internal / Custom Provider Adapter
```

No direct external provider call from route handlers.

Likely domain services:

```text
InventoryService
InventoryReservationService
GoodsMovementService
StockAdjustmentService
StockTransferService
SupplierService
PurchaseRequisitionService
PurchaseOrderService
GoodsReceiptService
SupplierInvoiceService
InvoiceMatchingService
CostTransactionService
ERPProviderSyncService
```

Do not create one giant ERP service.

---

# 41. EXPECTED API CAPABILITY SURFACE

Follow project route conventions, but preserve these capabilities:

```text
GET    /erp/inventory
GET    /erp/inventory/{productRef}/positions
POST   /erp/inventory/adjustments

GET    /erp/warehouses
POST   /erp/warehouses
GET    /erp/warehouses/{id}

GET    /erp/suppliers
POST   /erp/suppliers
GET    /erp/suppliers/{id}
PATCH  /erp/suppliers/{id}

GET    /erp/requisitions
POST   /erp/requisitions
GET    /erp/requisitions/{id}
POST   /erp/requisitions/{id}/submit
POST   /erp/requisitions/{id}/approve
POST   /erp/requisitions/{id}/reject

GET    /erp/purchase-orders
POST   /erp/purchase-orders
GET    /erp/purchase-orders/{id}
POST   /erp/purchase-orders/{id}/submit
POST   /erp/purchase-orders/{id}/approve
POST   /erp/purchase-orders/{id}/send
POST   /erp/purchase-orders/{id}/cancel

GET    /erp/goods-receipts
POST   /erp/purchase-orders/{id}/receipts
GET    /erp/goods-receipts/{id}
POST   /erp/goods-receipts/{id}/reverse

GET    /erp/stock-movements

GET    /erp/stock-transfers
POST   /erp/stock-transfers
GET    /erp/stock-transfers/{id}
POST   /erp/stock-transfers/{id}/ship
POST   /erp/stock-transfers/{id}/receive

GET    /erp/supplier-invoices
POST   /erp/supplier-invoices
GET    /erp/supplier-invoices/{id}
POST   /erp/supplier-invoices/{id}/match
POST   /erp/supplier-invoices/{id}/resolve
POST   /erp/supplier-invoices/{id}/approve

GET    /erp/cost-transactions
```

---

# 42. IDEMPOTENCY / PROVIDER INGESTION

Protect high-impact imports/actions.

Provider ingestion:

```text
Provider Event/API Sync
       ↓
Authenticate / verify
       ↓
Deduplicate
       ↓
Normalize
       ↓
Validate
       ↓
ERP Application Command
       ↓
Canonical ERP Model
       ↓
Provider reference / sync metadata
```

Never double-post stock.

Raw SAP/provider payload must not become the ERP domain model.

---

# 43. TESTING REQUIREMENTS

## Inventory
- goods receipt increases stock,
- adjustment increases/decreases correctly,
- cannot fall below allowed quantity,
- reservation reduces availability,
- release restores availability,
- consume works,
- blocked stock unavailable,
- movement created,
- reversal restores state.

## Requisition
- draft,
- submit,
- approve,
- reject with reason,
- partial order,
- full order,
- invalid transition rejected.

## Purchase Order
- draft,
- decimal-safe totals,
- approval,
- sent,
- partial receipt,
- full receipt,
- cancel eligibility.

## Goods Receipt
- valid receipt,
- partial receipt,
- accepted/blocked/damaged reconciliation,
- atomic inventory update,
- PO recalculation,
- reversal,
- concurrency protection.

## Stock Transfer
- create,
- availability validation,
- ship,
- in transit,
- partial receive,
- full receive,
- discrepancy.

## Supplier Invoice
- exact match,
- quantity mismatch,
- price mismatch,
- resolution permission,
- approval lifecycle.

## API Integration
- filters,
- detail,
- semantic actions,
- auth,
- tenant isolation,
- conflicts,
- invalid transitions,
- provider capability denial,
- provider sync failure.

## Frontend
- Inventory analytical filter consistency,
- Inventory Object Page,
- stock adjustment,
- PO semantic action visibility,
- Goods Receipt Wizard,
- Stock Transfer flow,
- Invoice match UI,
- permission states,
- sync error banner.

---

# 44. END-TO-END ERP FLOWS

## E2E 1 — Procure to Receive

```text
Create Purchase Requisition
 ↓
Submit
 ↓
Approve
 ↓
Create Purchase Order
 ↓
Approve
 ↓
Send
 ↓
Receive partial quantity
 ↓
PO = Partially Received
 ↓
Receive remaining
 ↓
PO = Received
 ↓
Inventory increased
 ↓
Movement history correct
```

## E2E 2 — OMS Reservation

```text
Inventory available 100
 ↓
reserve 30
 ↓
available 70
 ↓
release 10
 ↓
available 80
 ↓
consume 20
 ↓
reservation consumed
```

## E2E 3 — Stock Transfer

```text
Main Warehouse has 100
 ↓
Create transfer 40
 ↓
Ship
 ↓
40 in transit
 ↓
Receive 38
2 discrepancy
 ↓
destination receives 38
 ↓
movement/audit correct
```

## E2E 4 — Supplier Invoice Match

```text
PO
 ↓
Goods Receipt
 ↓
Supplier Invoice
 ↓
Match
 ↓
Detect match/variance
 ↓
Resolve if needed
 ↓
Approve
```

---

# 45. PERFORMANCE / SECURITY

Performance:
- server pagination,
- indexed filters,
- avoid N+1,
- efficient inventory aggregation,
- lazy-load heavy Object Page sections,
- cache stable config,
- background provider sync.

Security:
- auth,
- tenant isolation,
- role/action authorization,
- server-side transaction validation,
- secrets never exposed,
- provider authenticity verification,
- no client-trusted financial totals,
- audit sensitive actions.

---

# 46. VISUAL RULES

Do:
- dense List Reports,
- clear filter bars,
- strong Object Page hierarchy,
- semantic statuses,
- explicit quantities and units,
- aligned financial values,
- role/task-first overview,
- restrained cards.

Do NOT:
- make ERP a card dashboard,
- use decorative gradients,
- center operational tables,
- hide status behind icon only,
- use generic status editing,
- put critical transaction workflows in tiny modals.

---

# 47. IMPLEMENTATION ORDER — STRICT

## ERP-01 — Domain & Persistence Foundation
Implement domain entities, migrations, repositories, state calculators and tests.

Commit:
`feat(erp): establish resource and procurement domain`

STOP and verify.

## ERP-02 — Warehouses & Inventory Read Model
Warehouse list/detail, inventory positions, availability, movement history.

Commit:
`feat(erp): add warehouse and inventory workspace`

STOP and verify.

## ERP-03 — Inventory Analytical List & Adjustments
Analytical list, filters/KPI/chart/table consistency, adjustment workflow.

Commit:
`feat(erp): add inventory analysis and stock adjustments`

STOP and verify.

## ERP-04 — Suppliers
Supplier list/object, hold behavior, related procurement documents.

Commit:
`feat(erp): add supplier procurement workspace`

STOP and verify.

## ERP-05 — Purchase Requisitions
Create, submit, approve/reject, worklist/object page.

Commit:
`feat(erp): implement purchase requisition lifecycle`

STOP and verify.

## ERP-06 — Purchase Orders
List Report, creation, Object Page, approval lifecycle, receiving progress.

Commit:
`feat(erp): implement purchase order lifecycle`

STOP and verify.

## ERP-07 — Goods Receipt
Partial/full receiving, inventory movements, PO recalculation, reversal.

Commit:
`feat(erp): implement controlled goods receipt posting`

STOP and verify.

## ERP-08 — Stock Reservations Contract
Availability, reserve, release, consume, OMS port, concurrency.

Commit:
`feat(erp): expose inventory reservation capability`

STOP and verify.

## ERP-09 — Stock Transfers
Create, ship, in-transit, partial/full receive, discrepancy.

Commit:
`feat(erp): implement inter-warehouse stock transfers`

STOP and verify.

## ERP-10 — Supplier Invoices & Matching
Invoice list/detail, matching, mismatch resolution, approval, cost integration.

Commit:
`feat(erp): add supplier invoice matching workflow`

STOP and verify.

## ERP-11 — Provider & Sync UX
Provenance, capabilities, sync state, retry, normalization.

Commit:
`feat(erp): surface external erp synchronization state`

STOP and verify.

## ERP-12 — Role-Based ERP Overview
Warehouse, procurement and finance role-based work surfaces.

Commit:
`feat(erp): add role-based operations overview`

STOP and verify.

## ERP-13 — Hardening
Permissions, tenant isolation, precision, concurrency, idempotency, audit, states, accessibility, performance, E2E, docs.

Split commits:

```text
fix(erp): guard concurrent inventory mutations
fix(erp): enforce procurement approval permissions
test(erp): cover procure-to-receive lifecycle
docs(context): record erp process and fiori patterns
```

Never combine all hardening into one giant commit.

---

# 48. DEFINITION OF DONE — ERP

## Product
- [ ] Warehouses and locations work.
- [ ] Inventory positions work.
- [ ] On-hand/reserved/blocked/available are distinct.
- [ ] Stock adjustments create movement history.
- [ ] Suppliers work.
- [ ] Requisitions have lifecycle.
- [ ] POs have semantic lifecycle.
- [ ] Partial/full receipt work.
- [ ] Receipt reversal works.
- [ ] OMS reservation contract exists.
- [ ] Stock transfer supports in-transit.
- [ ] Supplier invoice matching works at defined MVP level.
- [ ] Cost transactions exist.
- [ ] Provider provenance/sync exists.
- [ ] Role homes surface actionable work.

## UX
- [ ] Correct Fiori-inspired floorplan chosen for every page.
- [ ] Lists behave like List Reports.
- [ ] Complex records behave like Object Pages.
- [ ] Inventory combines analytics + action.
- [ ] Work queues behave like Worklists.
- [ ] Actions are semantic.
- [ ] Posted records use reversal/correction where needed.
- [ ] Empty/loading/error states exist.
- [ ] Permissions are visible correctly.
- [ ] Sync state separate from business state.
- [ ] Responsive fallback exists.
- [ ] Accessibility verified.

## Engineering
- [ ] ERP owns inventory truth.
- [ ] No duplication of OMS lifecycle.
- [ ] No direct cross-module persistence access.
- [ ] Cross-module uses ports/contracts/events.
- [ ] Inventory mutation transactional.
- [ ] Concurrency protected.
- [ ] Money decimal-safe.
- [ ] Units explicit.
- [ ] Movement history append-only to normal users.
- [ ] Sensitive actions audited.
- [ ] Idempotency where required.
- [ ] Tenant isolation verified.
- [ ] All required tests pass.
- [ ] Build/lint/type checks pass.
- [ ] Migrations pass.
- [ ] Context/progress docs updated.

---

# 49. FINAL AGENT CHECKLIST BEFORE EACH ERP SCREEN

Before coding, explicitly determine:

```text
User role:
User job:
Primary business object:
SAP Fiori floorplan:
Lifecycle state:
Primary semantic action:
Secondary actions:
Permission requirement:
Provider capability:
Inventory impact:
Financial impact:
Audit requirement:
Concurrency risk:
Loading state:
Empty state:
Validation state:
Error/recovery behavior:
Next navigation:
```

If unclear:
- inspect context,
- inspect architecture,
- do not invent behavior.

---

# 50. STOP CONDITION

After ERP-13 and Definition of Done:

Report:

1. ERP slices implemented.
2. Tests run and results.
3. Architecture decisions.
4. Inventory invariants.
5. Procurement lifecycle implemented.
6. Provider capabilities supported.
7. Remaining ERP limitations.
8. Context files updated.
9. Suggested branch/commit history.

Then STOP.

Do not begin BI.

Wait for explicit instruction for Module 04.
