# UBOP — MODULE 02 OMS
## Implementation Prompt for AI Agent
### Reference UX/Workflow: Shopify Admin
### Scope Lock: OMS only — do not start ERP, BI, or Workflow Automation

---

# 0. MANDATORY EXECUTION RULE

You are implementing **only the OMS (Order Management System) module of UBOP**.

You MUST NOT begin implementation of:
- ERP inventory ledger,
- warehouse accounting,
- procurement,
- BI authoring,
- workflow automation builder,
- unrelated CRM features,
- unrelated provider marketplace work,
- unrelated global shell redesign.

You MAY use existing CRM data such as Customer/Account references through approved contracts if the project architecture already supports them.

You MAY define ports/contracts for capabilities that will belong to later modules, but you MUST NOT implement those later modules now.

Examples:

```text
OMS may depend on:
InventoryAvailabilityPort
CustomerLookupPort
NotificationPort
ProviderPort

OMS must NOT import:
ERP repositories
CRM repositories
BI services
Workflow implementation
```

When OMS satisfies all acceptance criteria and tests, STOP.

Do not continue to ERP.

Execution order:

1. Read every project context file required by `CLAUDE.md`.
2. Inspect existing CRM/core/provider implementation.
3. Produce an OMS implementation plan before editing code.
4. Implement one OMS slice at a time.
5. Add tests immediately after each slice.
6. Run tests/build/lint/type checks after every meaningful slice.
7. Update progress/context documentation.
8. Report completed OMS scope and remaining OMS gaps.
9. STOP.

---

# 1. YOUR ROLE

Act as a **Senior Enterprise Product Designer + Senior Frontend Engineer + Senior Backend Engineer**.

The primary product reference for OMS is **Shopify Admin**.

Study and reproduce the useful Shopify Admin operational patterns:

- resource index pages,
- saved views,
- search/filter/sort,
- dense operational tables,
- bulk actions,
- order detail hierarchy,
- separate payment / fulfillment / return states,
- contextual primary actions,
- fulfillment workflows,
- return and exchange workflows,
- refund workflows,
- customer and source context,
- timeline/history,
- status badges,
- transactional action modals/drawers,
- provider/channel provenance,
- failure recovery without losing the business record.

Shopify's order model treats an order as the hub connecting customer, products, payment, fulfillment, returns and refunds. UBOP should preserve this mental model.

Do NOT copy:
- Shopify logo,
- Polaris visual identity,
- brand colors,
- exact layouts pixel-for-pixel,
- proprietary illustration or marketing assets.

Clone:
- information hierarchy,
- workflow structure,
- task prioritization,
- data density,
- status separation,
- action hierarchy,
- saved-view behavior,
- business-state handling,
- error recovery principles.

Keep UBOP's own design system.

---

# 2. PRODUCT GOAL

The OMS module manages the full operational lifecycle of an order across internal and external commerce providers.

Core lifecycle:

```text
Order Created / Imported
        ↓
Payment Handling
        ↓
Fulfillment Planning
        ↓
Fulfillment / Shipment
        ↓
Delivery
        ↓
Return / Exchange / Refund when required
        ↓
Archive / Closed operational work
```

The OMS must answer these questions immediately:

- Which orders need action now?
- Which orders are unpaid?
- Which paid orders are unfulfilled?
- Which fulfillments are blocked?
- Which orders have return requests?
- Which orders have provider sync failures?
- What happened to an order and when?
- Where did the order originate?
- Which customer placed it?
- Which line items are involved?
- What money has been paid/refunded?
- What has been fulfilled?
- What remains to fulfill?
- What is waiting for operator intervention?

The OMS is an **operations workspace**, not merely an orders table.

---

# 3. CORE UX PRINCIPLE — ONE ORDER, MULTIPLE STATE DIMENSIONS

DO NOT model an order with one generic status field.

Shopify separates several operational statuses because different work may remain at the same time.

UBOP must use independent state dimensions.

At minimum:

```text
Order State
Payment State
Fulfillment State
Return State
Provider Sync State
```

Example:

```text
Order State
OPEN

Payment
PAID

Fulfillment
PARTIALLY_FULFILLED

Return
NONE

Provider Sync
HEALTHY
```

Another example:

```text
Order State
CANCELLED

Payment
PARTIALLY_REFUNDED

Fulfillment
UNFULFILLED

Return
NONE

Provider Sync
FAILED
```

Do not collapse these into:

```text
status = "FAILED"
```

A provider sync failure is not the same thing as a failed business order.

---

# 4. CANONICAL OMS DOMAIN MODEL

Use UBOP canonical entities independent of Shopify/Amazon/custom provider schemas.

---

# 4.1 Order

Required baseline fields:

```text
id
organization_id

order_number
source_type
source_provider_id?
source_connection_id?
external_order_id?

customer_id?
customer_snapshot

currency
subtotal
discount_total
shipping_total
tax_total
grand_total

order_state
payment_state
fulfillment_state
return_state

placed_at
cancelled_at?
archived_at?

notes
tags

sync_status
last_synced_at?

created_at
updated_at
```

Suggested `order_state`:

```text
OPEN
CANCELLED
ARCHIVED
```

Do not use order_state for payment or fulfillment.

---

# 4.2 OrderLine

```text
id
order_id

product_id?
variant_id?

external_product_id?
external_variant_id?

sku
name
variant_name?

quantity
unit_price
discount_total
tax_total
line_total

fulfilled_quantity
returned_quantity
refunded_quantity

metadata

created_at
updated_at
```

Important:
- keep a commercial snapshot of item name/SKU/price,
- historical orders must remain understandable even if the live product later changes,
- do not render historical order details solely from current product catalog data.

---

# 4.3 Product

OMS owns the commercial catalog representation required for order operations.

Do NOT implement ERP inventory ledger here.

Baseline:

```text
id
organization_id

name
status
description?

provider_reference?
sync_status

created_at
updated_at
```

Suggested status:

```text
ACTIVE
DRAFT
ARCHIVED
```

---

# 4.4 ProductVariant

```text
id
product_id

name
sku
barcode?

price
compare_at_price?

external_reference?
sync_status

created_at
updated_at
```

Do NOT store authoritative warehouse stock quantities here if ERP is intended to own inventory.

OMS may read availability through:

```text
InventoryAvailabilityPort
```

---

# 4.5 Payment / OrderTransaction

Separate financial events from order status.

Fields:

```text
id
order_id

type
status
amount
currency

payment_method
provider_transaction_id?

processed_at
metadata
```

Suggested transaction types:

```text
AUTHORIZATION
CAPTURE
SALE
REFUND
VOID
MANUAL_PAYMENT
```

Suggested transaction status:

```text
PENDING
SUCCESS
FAILED
CANCELLED
```

Derived `payment_state` can include:

```text
UNPAID
PENDING
AUTHORIZED
PARTIALLY_PAID
PAID
PARTIALLY_REFUNDED
REFUNDED
VOIDED
```

Do not let the UI invent payment state independently from backend domain logic.

---

# 4.6 FulfillmentGroup

Shopify models work to be fulfilled separately from the order itself. UBOP should preserve the concept that an order can have multiple fulfillment groups, potentially from different locations/providers.

Canonical entity:

```text
id
order_id

location_reference?
provider_reference?

status

created_at
updated_at
```

Suggested status:

```text
OPEN
IN_PROGRESS
COMPLETED
CANCELLED
ON_HOLD
```

---

# 4.7 FulfillmentLine

```text
id
fulfillment_group_id
order_line_id

quantity
fulfilled_quantity
```

---

# 4.8 Shipment / Fulfillment

A fulfillment represents actual work completed or in progress.

```text
id
order_id
fulfillment_group_id?

status
location_reference?

tracking_company?
tracking_number?
tracking_url?

shipped_at?
delivered_at?

provider_reference?
sync_status

created_at
updated_at
```

Suggested status:

```text
PENDING
IN_PROGRESS
SHIPPED
DELIVERED
FAILED
CANCELLED
```

---

# 4.9 Return

Return is separate from refund.

A customer can return goods without the financial refund being completed yet.

Fields:

```text
id
order_id

status
reason_summary?
requested_at
approved_at?
received_at?
closed_at?

provider_reference?
sync_status

created_at
updated_at
```

Suggested status:

```text
REQUESTED
APPROVED
DECLINED
IN_PROGRESS
INSPECTION_COMPLETE
COMPLETED
CANCELLED
```

---

# 4.10 ReturnLine

```text
id
return_id
order_line_id

quantity
reason
condition?

restock_disposition?
```

Suggested `restock_disposition`:

```text
RESTOCK
DO_NOT_RESTOCK
DAMAGED
INSPECTION_REQUIRED
```

---

# 4.11 ExchangeLine

If exchanges are supported in the MVP:

```text
id
return_id
replacement_product_id?
replacement_variant_id?
sku
quantity
price_difference
```

If exchange support is explicitly deferred, preserve architecture compatibility but do not build fake UI.

---

# 4.12 Refund

Refund is a financial entity, not the same as Return.

Fields:

```text
id
order_id
return_id?

amount
currency

status
reason?

provider_reference?
processed_at?

created_at
updated_at
```

Suggested status:

```text
PENDING
SUCCEEDED
FAILED
CANCELLED
```

---

# 4.13 OrderEvent / Timeline Event

One timeline source should represent business and system history.

Types may include:

```text
ORDER_CREATED
PAYMENT_RECORDED
PAYMENT_FAILED
FULFILLMENT_CREATED
SHIPMENT_UPDATED
RETURN_REQUESTED
RETURN_APPROVED
RETURN_RECEIVED
REFUND_CREATED
ORDER_CANCELLED
PROVIDER_SYNC_SUCCEEDED
PROVIDER_SYNC_FAILED
NOTE_ADDED
SYSTEM_EVENT
```

Fields:

```text
id
order_id

event_type
actor_id?
summary
metadata

created_at
```

Events representing audit-critical actions should not be silently editable.

---

# 5. OMS INFORMATION ARCHITECTURE

Inside the persistent UBOP shell:

```text
OMS
├── Overview
├── Orders
├── Products
├── Fulfillment
└── Returns
```

Do not add inventory/warehouse management screens here.

ERP will own those later.

`Fulfillment` can be a work queue over fulfillment groups/shipments.

`Returns` can be a work queue over return cases.

---

# 6. OMS OVERVIEW — OPERATIONS COMMAND SURFACE

The OMS home should help operators identify work.

Do NOT create a marketing-like analytics dashboard.

---

## 6.1 Desktop layout

```text
OMS / Overview                              Date range ▾

┌──────────────────────────────────────────────────────────────┐
│ Orders today | Revenue | Unfulfilled | Returns needing work │
└──────────────────────────────────────────────────────────────┘

┌───────────────────────────────────┬──────────────────────────┐
│ Needs attention                   │ Fulfillment workload     │
│ 12 unpaid                         │ Ready to fulfill   28    │
│ 8 sync failures                   │ On hold             4    │
│ 5 return requests                 │ In progress         9    │
└───────────────────────────────────┴──────────────────────────┘

┌───────────────────────────────────┬──────────────────────────┐
│ Recent orders                     │ Provider health          │
│ operational list                  │ Shopify: Healthy         │
│                                   │ Internal: Healthy        │
│                                   │ Marketplace: Degraded    │
└───────────────────────────────────┴──────────────────────────┘
```

---

## 6.2 Allowed summary metrics

- Orders today
- Gross order value / revenue proxy if appropriate
- Unfulfilled order count
- Orders with payment work
- Active returns
- Provider sync failures

Every metric should link to a filtered operational list.

Do not create metrics that have no next action.

---

# 7. ORDERS INDEX — SHOPIFY-STYLE RESOURCE INDEX

This is one of the highest-use OMS screens.

The default mental model:

```text
Saved View
   ↓
Search / Filter
   ↓
Dense Table
   ↓
Bulk or Row Action
   ↓
Order Detail
```

---

## 7.1 Required anatomy

```text
Orders                                              [+ Create Order]

[ All ] [ Unfulfilled ] [ Unpaid ] [ Open ] [ Returns ] [+ View]

Search orders...

[Filter] [Sort] [Columns] [Refresh] [More]

☐ Order    Date     Customer      Total    Payment   Fulfillment    Source
☐ #20391   10:23    Acme Corp     22.5M    Paid      Unfulfilled    Shopify
☐ #20390   10:02    Delta Ltd     8.4M     Pending   Fulfilled      Internal

2 selected             [Archive] [Add tag] [More]
```

---

## 7.2 Baseline saved/system views

At minimum:

```text
All
Open
Unfulfilled
Partially Fulfilled
Unpaid
Payment Pending
Returns
Cancelled
Archived
Sync Issues
```

Views should combine multiple state dimensions.

Example `Unfulfilled` means:
- order requires fulfillment work,
- not merely `order_state = OPEN`.

---

## 7.3 Search

Support search by:

```text
Order number
Customer name
Customer email if available
External order ID
Tracking number when available
SKU where practical
```

Debounce user input.

Show search as a list operation, not a separate dedicated page unless global search is being used.

---

## 7.4 Filters

Filter drawer includes:

### Order
- Order state
- Date
- Source/provider
- Tags

### Payment
- Payment state

### Fulfillment
- Fulfillment state

### Return
- Return state

### Customer
- Customer/account

### Sync
- Provider sync state

Example:

```text
Filters

Payment
[Paid]

Fulfillment
[Unfulfilled]

Source
[Shopify] [Internal]

Created
[Last 7 days]

[Reset]                         [Apply]
```

Visible applied filters should appear as chips.

---

## 7.5 Sorting

At minimum:
- newest/oldest,
- order total,
- customer,
- expected operational priority if explicitly modeled.

Do not implement opaque "smart sorting" without defined logic.

---

## 7.6 Table columns

Default:

```text
Order
Date
Customer
Total
Payment
Fulfillment
Return
Source
```

Optional:

```text
Tags
Sync Status
External ID
Last Updated
```

Identity column should remain easy to find.

Do not overload default view with every provider/internal field.

---

## 7.7 Bulk actions

Bulk actions appear only after selection.

Potential safe operations:
- archive,
- add/remove tag,
- export if supported.

High-risk operations such as bulk cancel/refund should not be added casually.

If supported later, require explicit review.

---

# 8. ORDER DETAIL — PRIMARY OPERATIONS WORKSPACE

Reference mental model:
Shopify order details organize payment, fulfillment, customer, returns, timeline, and contextual actions around one order.

---

## 8.1 Header

```text
← Orders

#20391
Open

Paid · Partially fulfilled · No return

[Fulfill remaining] [More ▾]
```

Header secondary metadata:

```text
Created 20 Sep 2026, 10:23
Source: Shopify
External order: #S-99102
```

---

## 8.2 Primary action logic

Do NOT show all actions at equal visual strength.

Primary action depends on business state and user permission.

Examples:

```text
UNPAID
→ Record payment
```

```text
PAID + UNFULFILLED
→ Fulfill items
```

```text
PARTIALLY_FULFILLED
→ Fulfill remaining
```

```text
RETURN_REQUESTED
→ Review return
```

```text
PROVIDER_AUTH_EXPIRED
→ business action remains primary if safe;
  provider issue appears as alert/banner
```

Secondary actions go under `More`.

---

## 8.3 Desktop page anatomy

```text
┌──────────────────────────────────────────────────────────────────┐
│ Order items                                                      │
│ Item A              × 100                      ₫20,000,000        │
│ Item B              × 100                       ₫2,500,000        │
└──────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────┬────────────────────────────┐
│ Payment                             │ Customer                   │
│ Paid                                │ Acme Corp                  │
│ Bank Transfer                       │ contact...                 │
│                                     │                            │
│ Fulfillment                         │ Order context              │
│ Partial                             │ Source: Shopify            │
│ Shipment #F01                       │ Sync: Healthy              │
│ Remaining items                     │ Tags                       │
│                                     │ External ID                │
│ Returns                             │                            │
│ None                                │                            │
└─────────────────────────────────────┴────────────────────────────┘

Timeline
...
```

Use clear sections, not one massive form.

---

# 9. ORDER ITEMS UX

Each line item should show:

```text
thumbnail if available
product/variant name
SKU
unit price
quantity
line total
fulfilled quantity
returned quantity when relevant
```

Example:

```text
Industrial Container / Blue / 20L
SKU IC-BLU-20

₫200,000 × 100                       ₫20,000,000
Fulfilled 60 / 100
```

Do not hide quantity-level operational state.

---

# 10. PAYMENT UX

Payment status is separate and should have a dedicated section.

Example:

```text
Payment
Paid

Transactions
20 Sep · Bank Transfer     +₫22,500,000    Success
```

If unpaid:

```text
Payment
Unpaid

Amount due
₫22,500,000

[Record payment]
```

If partially refunded:

```text
Paid            ₫22,500,000
Refunded        ₫ 5,000,000
Net paid        ₫17,500,000
```

Never derive financial truth solely from badges.

Display transaction history.

---

# 11. RECORD PAYMENT WORKFLOW

Applicable primarily to providers/capabilities that permit internal/manual payment recording.

Entry:
`Record payment`

Use a focused modal or drawer because this is a short transactional action.

Fields:

```text
Amount
Payment method
Processed at
Reference
Note
```

Review before save if the action has financial consequences.

Validation:
- amount > 0,
- cannot exceed permitted outstanding balance unless business rules explicitly allow it,
- permissions checked server-side,
- idempotency required for external transactional API actions where relevant.

Success:
- transaction created,
- payment state recalculated,
- timeline event added,
- provider sync queued when provider supports writeback.

---

# 12. FULFILLMENT MODEL — DO NOT EQUATE ORDER WITH ONE SHIPMENT

A single order can have multiple fulfillment groups and shipments.

Possible reasons:
- different locations,
- partial availability,
- split shipment,
- provider routing.

UI should support:

```text
Order #20391

Fulfillment A
Location: Main Warehouse
60 / 100 items
Shipped

Fulfillment B
Location: Secondary Warehouse
40 / 100 items
Open
```

Do not assume one `tracking_number` on the Order model.

---

# 13. FULFILLMENT WORK QUEUE

Navigation:

`OMS → Fulfillment`

Purpose:
operators see work to process.

Example:

```text
Fulfillment

[ Ready ] [ In Progress ] [ On Hold ] [ Completed ]

Search...

Order     Customer     Items     Location         Status       Created
#20391    Acme         40        Main Warehouse   Ready        10:23
#20388    Delta        12        Warehouse B      On Hold      09:41
```

Filters:
- location reference,
- provider,
- status,
- order date,
- shipping method if available.

Do not implement warehouse management itself.

Location options come from an approved port/config.

---

# 14. FULFILLMENT WORKFLOW — EXACT FLOW

Primary order action:
`Fulfill items`

Use a dedicated workflow drawer or page if enough complexity exists.

Recommended flow:

```text
1 Select fulfillment group/location
          ↓
2 Select line items + quantity
          ↓
3 Shipment / tracking information
          ↓
4 Review
          ↓
5 Confirm fulfillment
          ↓
6 Persist UBOP fulfillment
          ↓
7 Adjust availability/reservation through approved port
          ↓
8 Sync provider if configured
          ↓
9 Record timeline
```

---

## 14.1 Step 1 — Location / fulfillment group

```text
Fulfill from

Main Warehouse
Available through inventory capability

Items ready:
3
```

If OMS does not yet have ERP availability:
- use existing core/location contract or test fixture,
- do not invent ERP implementation.

---

## 14.2 Step 2 — Select items

Example:

```text
Items to fulfill

[x] Container A
    Ordered 100
    Already fulfilled 60
    Fulfill now [40]

[x] Lid B
    Ordered 100
    Already fulfilled 100
    Remaining 0
```

Disable items with zero remaining.

Reject quantity greater than remaining.

---

## 14.3 Step 3 — Tracking

Fields:

```text
Carrier
Tracking Number
Tracking URL
Notify customer (only if notification capability exists)
```

Tracking may be optional depending on fulfillment type.

---

## 14.4 Step 4 — Review

```text
Review fulfillment

Order
#20391

Location
Main Warehouse

Items
Container A × 40

Tracking
VNPOST · ABC123

[Back]                         [Confirm Fulfillment]
```

---

## 14.5 Successful result

- create fulfillment/shipment,
- update derived fulfillment state,
- create timeline event,
- call inventory/availability contract if defined,
- enqueue provider sync rather than blocking UX unnecessarily,
- show success.

---

# 15. PROVIDER FAILURE DURING FULFILLMENT

Critical rule:

**Local business persistence and provider synchronization must be distinguishable.**

If UBOP safely created a fulfillment but provider writeback failed:

```text
Fulfillment created

Shopify has not been updated.

Reason
Rate limit exceeded.

Next retry
10:45

[Retry now] [View sync details]
```

Order's fulfillment state reflects UBOP's authoritative decision according to configured source-of-truth rules.

`sync_status = FAILED` is displayed separately.

If product architecture defines provider as authoritative for a particular capability, follow that contract instead of inventing local authority.

---

# 16. CANCELLATION WORKFLOW

Cancellation applies to order/items according to business eligibility.

Do not expose Cancel when impossible.

Entry:
`More → Cancel order`

Use confirmation workflow.

Fields:

```text
Cancel reason *
Restock behavior if applicable through inventory contract
Refund payment? (if eligible and supported)
Notify customer? (if capability exists)
```

Review:

```text
Cancel #20391?

Items affected
...

Payment impact
Refund ₫22,500,000

Fulfillment impact
2 unfulfilled lines

[Keep Order]                 [Cancel Order]
```

On success:
- order state becomes CANCELLED,
- related payment/refund actions execute according to chosen flow,
- unfulfilled work cancelled,
- provider sync handled,
- audit/timeline event created.

Do not silently cancel already-shipped physical operations.

If partial cancellation is supported, model it explicitly; do not fake whole-order cancellation.

---

# 17. RETURNS WORK QUEUE

Navigation:

`OMS → Returns`

Saved views:

```text
Requested
In Progress
Inspection Complete
Needs Refund
Completed
Declined
```

Table:

```text
Return       Order      Customer     Items    Status              Requested
RET-102      #20391     Acme         2        Requested           Today
RET-101      #20322     Delta        1        Inspection Complete Yesterday
```

Filters:
- status,
- date,
- provider,
- customer,
- refund pending,
- location if relevant.

---

# 18. CREATE / REQUEST RETURN WORKFLOW

Shopify separates return logistics from financial refund processing. UBOP must do the same.

A return can be created for eligible fulfilled items.

Entry from Order:
`More → Create Return`

Flow:

```text
1 Select eligible items
       ↓
2 Quantity + return reason
       ↓
3 Return logistics
       ↓
4 Exchange items if supported
       ↓
5 Estimated financial impact
       ↓
6 Review
       ↓
7 Create return
```

---

## 18.1 Eligible items

Only items eligible under domain rules can be selected.

Example:

```text
Select items

[x] Container A
    Fulfilled: 60
    Already returned: 0
    Return quantity [2]

[ ] Lid B
    Not eligible: already refunded
```

Explain why an item is disabled.

---

## 18.2 Return reason

Reasons:

```text
DAMAGED
WRONG_ITEM
NOT_AS_EXPECTED
SIZE_OR_VARIANT
CUSTOMER_CHANGED_MIND
OTHER
```

Allow human-readable details.

---

## 18.3 Return logistics

If supported:
- return destination/reference,
- instructions,
- tracking/reference,
- external return label information.

Do not implement logistics provider integration unless already in scope.

---

# 19. RETURN REVIEW WORKFLOW

For a requested return:

Primary action:
`Review Return`

Screen:

```text
Return RET-102
Requested

Order #20391
Customer Acme

Items
Container A × 2

Reason
Damaged

[Decline] [Approve]
```

### Approve

May require:
- receiving location,
- instructions,
- estimated refund/exchange outcome.

### Decline

Require reason.

Create timeline/audit event.

---

# 20. PROCESS RETURN / INSPECTION

When items arrive:

```text
Return RET-102
In Progress

Receive items

Container A × 2

Condition
[Good] [Damaged] [Other]

Disposition
[Restock]
[Do not restock]
[Inspection required]
```

After inspection:
- update return state,
- call ERP/inventory port later for stock disposition,
- do not implement inventory ledger in OMS,
- enable refund action when appropriate.

---

# 21. REFUND WORKFLOW

Refund is financial and may be related to:
- return,
- cancellation,
- customer-service adjustment.

Entry:
`Refund`

Use a dedicated transaction flow.

---

## 21.1 Refund form

```text
Refund

Eligible items
[x] Container A × 2       ₫400,000

Shipping refund
[ ] Shipping              ₫...

Adjustment
...

Refund amount
₫400,000

Refund method
Original payment / supported provider method

Reason
...

[Cancel]                  [Review Refund]
```

---

## 21.2 Review

Show:

```text
Refund summary

Order
#20391

Items
Container A × 2

Amount
₫400,000

Method
Original payment

[Back]                    [Issue Refund]
```

This is a financially consequential operation.

Require permission and server-side validation.

---

## 21.3 Success

- Refund entity created,
- payment state recalculated,
- return financial state updated if applicable,
- timeline event recorded,
- provider financial action executed or queued depending on architecture,
- idempotency guarantees used for external write actions.

---

## 21.4 Failure

Do not falsely show refund success if external provider is authoritative and the financial refund failed.

Error example:

```text
Refund not completed

No money was returned.
The payment provider rejected the request.

Reason
Transaction is no longer refundable.

[Review Payment] [Try Again]
```

If local system uses asynchronous provider handling, clearly distinguish:

```text
Refund submitted
Provider processing pending
```

Never confuse `submitted` with `succeeded`.

---

# 22. EXCHANGE WORKFLOW

Only implement if explicitly included in current scope.

If included:

```text
Return item
  ↓
Select replacement item/variant
  ↓
Calculate price difference
  ↓
Determine amount to refund/collect
  ↓
Review
  ↓
Create exchange
  ↓
Replacement fulfillment
```

Important:
- exchange fulfillment is not the same as original fulfillment,
- financial difference is explicit,
- replacement item availability comes through availability contract,
- status visible separately.

If exchanges are deferred, show no fake UI.

---

# 23. PRODUCTS INDEX — SHOPIFY-LIKE CATALOG OPERATIONS

OMS product catalog should support order-facing product data.

Navigation:
`OMS → Products`

Index:

```text
Products                                        [+ Add Product]

[ All ] [ Active ] [ Draft ] [ Archived ]

Search products...

Product             Status       Variants     Price from    Provider
Industrial Box      Active       4            ₫120,000      Internal
Plastic Lid         Active       2            ₫20,000       Shopify
```

Filters:
- status,
- provider/source,
- product type/category if modeled,
- sync state.

Do NOT show authoritative warehouse quantity unless fetched through inventory availability interface.

---

# 24. PRODUCT DETAIL

```text
Industrial Box
Active

[Edit] [More]

Overview
Description
Commercial information

Variants
Name            SKU             Price
Blue / 20L      BOX-B-20        ₫120,000
Red / 20L       BOX-R-20        ₫120,000

Channels / Provider
Internal
Shopify connection...

Availability
Read-only capability summary if available
```

Keep catalog management distinct from inventory movement.

---

# 25. ORDER TIMELINE

All important order events appear chronologically.

Example:

```text
Today

11:30  Fulfillment created
       Container A × 40
       Tracking: ABC123
       by Huy Nguyen

10:45  Payment captured
       ₫22,500,000

10:23  Order imported from Shopify
       External ID S-99102
```

Provider sync events can be collapsible/noisier system events.

Example:

```text
10:46  Provider sync failed
       Shopify rate limit exceeded
       Retry scheduled
```

Do not bury human operational events under excessive sync noise.

---

# 26. PROVIDER / CHANNEL PROVENANCE

Every externally sourced order displays provenance.

Context rail:

```text
Source
Shopify

Connection
Thuận Đạt Store

External Order
S-99102

Last Sync
2 minutes ago

Sync
Healthy
```

For internal:

```text
Source
UBOP Internal OMS
```

---

# 27. PROVIDER CAPABILITY-AWARE ACTIONS

A connected provider may support different capabilities.

Example capability contract:

```text
read_orders
create_order
update_order
cancel_order
record_payment
create_fulfillment
create_return
refund_order
read_products
write_products
```

UI actions must respect:
- UBOP permission,
- provider capability,
- current business state.

Example:

```text
Provider does not support writeback fulfillment
```

Then:
- local action may still exist if architecture permits local authority,
- otherwise action becomes unavailable with clear explanation.

Do not show an action that predictably fails.

---

# 28. SYNC STATE

Recommended:

```text
HEALTHY
PENDING
SYNCING
DEGRADED
FAILED
DISCONNECTED
```

Record banner on failure:

```text
Shopify sync failed

Your order is safely stored in UBOP.
The external provider has not received the latest fulfillment update.

Reason
API rate limit exceeded.

Next retry
10:45

[Retry now] [View sync log]
```

---

# 29. MANUAL / INTERNAL ORDER CREATION

OMS should support internal/manual orders if defined by product scope.

Primary action:
`+ Create Order`

Because this is complex, use a full page.

Flow:

```text
1 Customer
  ↓
2 Products / quantities
  ↓
3 Pricing / discounts
  ↓
4 Shipping / fulfillment context
  ↓
5 Payment terms/state
  ↓
6 Review
  ↓
7 Create order
```

Do not put a full order builder into a small modal.

---

# 30. CREATE ORDER — CUSTOMER STEP

Allow:
- choose existing CRM/Customer reference through a port,
- create/use lightweight customer snapshot if architecture supports guest/manual orders.

If CRM already exists:
- use CustomerLookupPort / API contract,
- do not import CRM persistence models directly.

Store order-level customer snapshot for historical accuracy where appropriate.

---

# 31. CREATE ORDER — PRODUCT STEP

Search catalog by:
- name,
- SKU,
- variant.

Line editor:

```text
Product             Price       Quantity      Total
Container A         200k        [100]         20M
```

Allow defined discount behavior only if product context defines it.

Do not invent coupon/promotion engines.

---

# 32. CREATE ORDER — REVIEW

```text
Review order

Customer
Acme Corporation

Items
Container A × 100

Subtotal    ₫20M
Shipping    ₫1M
Tax         ₫...
Total       ₫...

Payment
Unpaid / Terms...

Source
Internal

[Back]                     [Create Order]
```

Success routes to order detail.

---

# 33. ARCHIVE BEHAVIOR

Archive is not delete.

Archived orders remain:
- searchable,
- readable,
- auditable,
- included in historical reporting where appropriate.

Do not physically delete completed financial/business records in normal user workflow.

---

# 34. DELETION POLICY

Orders, payments, refunds, fulfillment and returns are business records.

Default:
- no hard-delete UI,
- cancellation/archive replaces deletion,
- only test/admin maintenance can hard-delete if architecture explicitly permits.

---

# 35. PERMISSIONS

Minimum conceptual roles:

## Operations Agent
- view orders,
- fulfill eligible orders,
- process returns within permission,
- update operational notes.

## Operations Manager
- all agent actions,
- cancel orders,
- oversee provider failures,
- broader data access.

## Finance-capable role
- record payment if applicable,
- issue refunds,
- view financial transaction details.

## Admin
- provider and configuration controls.

Do not make refund available just because the user can edit orders.

Financial permissions are independent.

---

# 36. EMPTY STATES

## Orders

```text
No orders yet

Orders will appear here when they are created in UBOP or synchronized from a commerce provider.

[Create Order] [Connect Provider]
```

If provider integration is managed outside OMS, route to existing Integrations section.

---

## Fulfillment

```text
Nothing ready to fulfill

Paid or otherwise eligible orders that require fulfillment will appear here.
```

---

## Returns

```text
No active returns

Return requests and returns in progress will appear here.
```

---

# 37. LOADING STATES

Use:
- page skeleton for first load,
- row skeleton for large lists,
- local spinner for transaction action,
- progress status for import/sync,
- no full-page blocking when only one panel is updating.

Examples:

```text
Syncing Shopify orders
342 / 1,204
```

---

# 38. ERROR MODEL

For operational errors always communicate:

1. What happened?
2. What business data was preserved?
3. What remains incomplete?
4. Why, if known?
5. What action can user take?

Example:

```text
Fulfillment saved, but provider sync failed.

The shipment exists in UBOP.
Shopify has not been updated.

[Retry Sync]
```

Example financial failure:

```text
Refund failed.

No money was returned.
Your return case remains unchanged.

[Review Payment]
```

---

# 39. RESPONSIVE BEHAVIOR

OMS is desktop-first.

## Desktop
- full operational tables,
- two-column order details,
- contextual side rail,
- complex fulfillment/return workflows.

## Tablet
- collapsible nav,
- fewer table columns,
- side rail stacks below main content,
- transactional drawers may become full-screen sheets.

## Mobile
Prioritize:
- order lookup,
- order detail,
- mark/record simple operational actions,
- fulfillment confirmation when safe,
- return inspection,
- provider alerts.

Do not attempt to preserve a 10-column desktop table on mobile.

Use cards/list rows only as responsive fallback, not as the primary desktop pattern.

---

# 40. ACCESSIBILITY

Mandatory:

- semantic table markup,
- row actions keyboard accessible,
- focus management in transactional modals/drawers,
- form labels,
- error associations,
- visible focus,
- status not communicated by color alone,
- selected rows announced appropriately,
- quantity controls keyboard operable,
- dialogs have correct titles/descriptions.

---

# 41. FRONTEND COMPONENT INVENTORY

Build shared OMS components where repetition is proven.

Required candidates:

```text
OMSOverview

OrderResourceIndex
SavedViewTabs
OMSFilterDrawer
BulkActionBar

OrderHeader
OrderStatusCluster
OrderLineTable
OrderTotals
PaymentSection
FulfillmentSection
ReturnSection
OrderContextRail
OrderTimeline

RecordPaymentDialog
FulfillmentWizard
CancellationDialog

ReturnIndex
ReturnReview
ReturnProcessingForm
RefundWizard

ProductIndex
ProductDetail
VariantTable

ProviderProvenance
SyncStatusBadge
SyncErrorBanner
```

Do not prematurely build a generic component for every possible future domain.

---

# 42. BACKEND BOUNDARIES

Conceptual flow:

```text
OMS API
  ↓
OMS Application Service
  ↓
OMS Domain
  ↓
Repository Ports
  ↓
Infrastructure Repositories
```

Provider:

```text
OMS Application
  ↓
OrderProviderPort
  ↓
Provider Adapter
```

External capability ports:

```text
OMS
 ↓
CustomerLookupPort

OMS
 ↓
InventoryAvailabilityPort
```

Do not access CRM/ERP database tables directly across domain boundaries.

---

# 43. DOMAIN SERVICES

Likely services:

```text
OrderService
PaymentService
FulfillmentService
ReturnService
RefundService
CatalogService
OMSProviderSyncService
```

Do not create one 3,000-line `OrderService` handling every concern.

---

# 44. DERIVED STATUS LOGIC

Derived state must be centralized.

Example conceptual logic:

```text
PaymentStateCalculator
FulfillmentStateCalculator
ReturnStateCalculator
```

Do not calculate statuses independently in:
- API,
- frontend,
- background worker.

There must be one domain definition.

---

# 45. EXPECTED API CAPABILITY SURFACE

Exact route style follows current project conventions.

Capability coverage should include:

```text
GET    /oms/orders
POST   /oms/orders
GET    /oms/orders/{id}

POST   /oms/orders/{id}/payments
POST   /oms/orders/{id}/cancel
POST   /oms/orders/{id}/archive

GET    /oms/orders/{id}/fulfillments
POST   /oms/orders/{id}/fulfillments

GET    /oms/fulfillments
GET    /oms/fulfillments/{id}

GET    /oms/returns
POST   /oms/orders/{id}/returns
GET    /oms/returns/{id}
POST   /oms/returns/{id}/approve
POST   /oms/returns/{id}/decline
POST   /oms/returns/{id}/receive-or-process

POST   /oms/orders/{id}/refunds
GET    /oms/orders/{id}/refunds

GET    /oms/products
POST   /oms/products
GET    /oms/products/{id}
PATCH  /oms/products/{id}
```

If project conventions use commands/actions differently, preserve semantics rather than blindly copying URLs.

---

# 46. IDEMPOTENCY AND EXTERNAL ACTIONS

Critical transactional actions must be designed for duplicate request protection.

Relevant actions:
- create/import external order,
- record/capture payment,
- create fulfillment,
- cancel provider order,
- refund.

When calling external provider APIs:
- use provider-supported idempotency when available,
- persist operation identity,
- prevent accidental duplicate monetary or fulfillment actions,
- retry only when safe.

---

# 47. WEBHOOK / PROVIDER EVENT INGESTION

If provider ingestion exists:

```text
Provider Webhook
      ↓
Verify authenticity
      ↓
Deduplicate event
      ↓
Normalize provider payload
      ↓
OMS application command/event
      ↓
Persist canonical model
      ↓
Record provider cursor/reference
```

Do not let raw provider payload shape become the OMS domain model.

Raw provider payload may be stored separately for debugging/audit if architecture allows.

---

# 48. CONCURRENCY

Operational actions can race.

Examples:
- two users fulfill same remaining quantity,
- provider webhook arrives while operator edits order,
- refund submitted twice.

Backend must:
- validate current state inside transaction,
- use appropriate locking/versioning,
- reject stale invalid actions,
- return actionable conflict error.

Frontend example:

```text
This order changed while you were editing it.

The remaining fulfillable quantity is now 20 instead of 40.

[Reload Order]
```

Do not silently overwrite.

---

# 49. AUDITABILITY

Record:
- actor,
- action,
- timestamp,
- entity,
- before/after state where appropriate,
- provider context where relevant.

High-value audit events:
- cancellation,
- refund,
- payment recording,
- fulfillment confirmation,
- return approval/decline,
- provider re-sync/manual correction.

---

# 50. TESTING REQUIREMENTS

OMS is not complete without domain, API, frontend and E2E tests.

---

## 50.1 Order unit tests

At minimum:

- create valid internal order,
- imported external order normalization,
- historical line snapshot preserved,
- cancel eligible order,
- reject invalid cancellation,
- archive behavior,
- provider sync state does not replace business state.

---

## 50.2 Payment tests

- unpaid → paid,
- partial payment if supported,
- refund recalculates payment state,
- partial refund,
- full refund,
- failed refund does not claim success,
- duplicate external financial command protected.

---

## 50.3 Fulfillment tests

- fulfill complete order,
- partial fulfillment,
- multiple fulfillments,
- cannot fulfill more than remaining,
- derived fulfillment state,
- provider sync failure preserves expected local business state according to source-of-truth config,
- concurrent fulfillment conflict.

---

## 50.4 Return tests

- create return only for eligible fulfilled items,
- quantity validation,
- approve,
- decline requires reason,
- receive/process,
- restock disposition passed to port,
- completed return state.

---

## 50.5 Refund tests

- refund linked to return,
- standalone eligible refund if allowed,
- refund amount bounds,
- permission requirement,
- external provider failure,
- idempotency.

---

## 50.6 API integration tests

Cover:
- list/search/filter,
- order detail,
- create order,
- payment action,
- fulfillment flow,
- cancellation,
- return flow,
- refund flow,
- provider capability restrictions,
- tenant isolation,
- permission denial,
- conflict/stale state.

---

## 50.7 Frontend/component tests

Critical:
- OrderStatusCluster,
- Orders saved view/filter state,
- FulfillmentWizard,
- ReturnReview,
- RefundWizard,
- SyncErrorBanner,
- provider-capability-disabled actions,
- permission-controlled financial actions,
- responsive order detail.

---

# 51. END-TO-END FLOWS

Implement at least these.

## E2E 1 — Standard order

```text
Create/import order
 ↓
Record payment
 ↓
Fulfill all items
 ↓
Add tracking
 ↓
Verify order timeline
 ↓
Verify Paid + Fulfilled
```

---

## E2E 2 — Partial fulfillment

```text
Order with 100 units
 ↓
Fulfill 60
 ↓
Order becomes Partially Fulfilled
 ↓
Fulfill remaining 40
 ↓
Order becomes Fulfilled
```

---

## E2E 3 — Return and refund

```text
Paid + Fulfilled order
 ↓
Create return
 ↓
Approve
 ↓
Receive/inspect
 ↓
Issue refund
 ↓
Verify Return Completed
 ↓
Verify Payment Partially/Fully Refunded
 ↓
Verify timeline
```

---

## E2E 4 — Provider failure

```text
Order exists
 ↓
Create local fulfillment
 ↓
Provider sync fails
 ↓
Business fulfillment remains visible
 ↓
Sync failure banner appears
 ↓
Retry
 ↓
Sync becomes healthy
```

Only use this flow if source-of-truth architecture permits local-first fulfillment persistence.

---

# 52. PERFORMANCE

Orders can become high-volume.

Requirements:
- server-side pagination/cursor,
- indexed common filters,
- avoid N+1 on customer/provider relations,
- do not load full timeline in order index,
- order detail may lazy-load timeline/secondary panels,
- debounce search,
- batch provider sync carefully,
- avoid recalculating large summaries synchronously on every request.

---

# 53. OBSERVABILITY

Relevant structured logs/metrics:

```text
order.created
order.imported
payment.recorded
fulfillment.created
return.created
refund.requested
refund.failed
provider.sync.failed
provider.sync.retry
```

Do not log secrets, tokens or sensitive full payment credentials.

---

# 54. SECURITY

Mandatory:

- authentication,
- organization/tenant isolation,
- action-specific authorization,
- server-side financial permission checks,
- secrets never exposed to frontend,
- provider credentials handled by provider/core layer,
- webhook signature verification when applicable,
- validate external payloads,
- no trusted client-side totals for financial commands.

The backend recalculates/validates money-impacting values.

---

# 55. VISUAL RULES

Use UBOP design system.

Do:
- full-width dense tables,
- restrained status badges,
- consistent row height,
- clear order identity,
- clear monetary hierarchy,
- one primary action,
- sticky action areas when long workflows justify them,
- context rail for source/customer/provider.

Do NOT:
- use a card grid for order index,
- wrap every section in large floating rounded cards,
- use gradients for operational statuses,
- show 8 primary-looking buttons,
- use huge marketing headlines,
- use decorative charts where a task list is more useful.

---

# 56. IMPLEMENTATION ORDER — STRICT

Implement OMS in this order.

---

## Slice OMS-01 — Domain Foundation

Implement:
- Order
- OrderLine
- Payment/Transaction
- Product/Variant
- FulfillmentGroup
- Fulfillment
- Return/ReturnLine
- Refund
- Timeline/Event
- migrations
- repositories
- domain services
- status calculators
- validation

Tests first-class.

Suggested commit:

```text
feat(oms): establish order lifecycle domain
```

STOP and verify before OMS-02.

---

## Slice OMS-02 — Orders Index & Detail

Implement:
- list/search/filter/sort,
- saved/system views,
- order detail,
- order lines,
- customer/source context,
- payment summary,
- fulfillment summary,
- return summary,
- timeline.

Tests.

Suggested commit:

```text
feat(oms): add order operations workspace
```

STOP and verify before OMS-03.

---

## Slice OMS-03 — Internal Order Creation

Implement:
- customer selection contract,
- product/variant selection,
- line calculation,
- review,
- create,
- validation,
- success navigation.

Tests.

Suggested commit:

```text
feat(oms): add internal order creation flow
```

STOP and verify before OMS-04.

---

## Slice OMS-04 — Payment Operations

Implement:
- transactions,
- payment section,
- record payment,
- derived payment status,
- permission rules,
- timeline,
- idempotency foundation.

Tests.

Suggested commit:

```text
feat(oms): implement payment transaction workflow
```

STOP and verify before OMS-05.

---

## Slice OMS-05 — Fulfillment

Implement:
- fulfillment work queue,
- partial/full fulfillment,
- multiple fulfillment groups,
- item quantity validation,
- tracking,
- timeline,
- inventory availability port,
- provider writeback contract.

Tests.

Suggested commit:

```text
feat(oms): implement fulfillment operations
```

STOP and verify before OMS-06.

---

## Slice OMS-06 — Cancellation

Implement:
- eligibility,
- cancellation workflow,
- reason,
- payment impact hooks,
- fulfillment impact,
- audit/timeline,
- provider handling.

Tests.

Suggested commit:

```text
feat(oms): add guarded order cancellation
```

STOP and verify before OMS-07.

---

## Slice OMS-07 — Returns

Implement:
- returns work queue,
- create return,
- eligible lines,
- reason,
- approve/decline,
- receive/inspection,
- restock disposition port,
- status progression.

Tests.

Suggested commit:

```text
feat(oms): implement return lifecycle
```

STOP and verify before OMS-08.

---

## Slice OMS-08 — Refunds

Implement:
- refund eligibility,
- refund line/amount calculation,
- review,
- financial permission,
- provider execution,
- idempotency,
- payment state recalculation,
- failure handling.

Tests.

Suggested commit:

```text
feat(oms): implement guarded refund processing
```

STOP and verify before OMS-09.

---

## Slice OMS-09 — Product Catalog

Implement:
- product index,
- product detail,
- variants,
- provider provenance,
- commercial fields,
- no ERP inventory ownership.

Tests.

Suggested commit:

```text
feat(oms): add commerce catalog workspace
```

STOP and verify before OMS-10.

---

## Slice OMS-10 — Provider & Sync UX

Implement:
- provider provenance,
- source/channel context,
- capability-aware actions,
- sync status,
- retry,
- sync failure banner,
- provider event normalization tests.

Suggested commit:

```text
feat(oms): surface channel and sync operations
```

STOP and verify before OMS-11.

---

## Slice OMS-11 — OMS Overview

Implement:
- actionable OMS metrics,
- needs-attention queue,
- fulfillment workload,
- return work,
- provider health,
- links to filtered indexes.

Tests.

Suggested commit:

```text
feat(oms): add operations command overview
```

STOP and verify before OMS-12.

---

## Slice OMS-12 — Hardening

Implement/review:
- permissions,
- tenant isolation,
- concurrency,
- idempotency,
- audit,
- loading states,
- empty states,
- error states,
- accessibility,
- responsive fallback,
- performance,
- E2E tests,
- docs/context.

Split commits by concern.

Examples:

```text
fix(oms): enforce financial action permissions
```

```text
fix(oms): guard concurrent fulfillment updates
```

```text
test(oms): cover order return and refund journeys
```

```text
docs(context): record oms operational patterns
```

Do NOT place all hardening changes in one giant commit.

---

# 57. DEFINITION OF DONE — OMS MODULE

OMS is complete only when every relevant item is true.

## Product

- [ ] Orders can be created/imported through defined paths.
- [ ] Order index is operationally useful.
- [ ] Order detail separates all relevant state dimensions.
- [ ] Payment workflow works.
- [ ] Full fulfillment works.
- [ ] Partial fulfillment works.
- [ ] Multiple fulfillment records are supported.
- [ ] Cancellation follows eligibility rules.
- [ ] Returns have their own lifecycle.
- [ ] Refund is separate from return.
- [ ] Product catalog supports order operations.
- [ ] Timeline explains order history.
- [ ] Provider/channel provenance is visible.
- [ ] Provider failures do not erase/obscure business state.
- [ ] OMS Overview directs users to actionable work.

## UX

- [ ] Saved/system views exist.
- [ ] Search/filter/sort are clear.
- [ ] Dense table used for desktop index.
- [ ] Primary action changes according to order state.
- [ ] Payment, fulfillment, return badges are independent.
- [ ] Financial actions require deliberate review.
- [ ] Fulfillment and return workflows show quantities.
- [ ] Error recovery is actionable.
- [ ] Empty/loading states exist.
- [ ] Permission states exist.
- [ ] Provider capability limitations are visible.
- [ ] Responsive fallback exists.
- [ ] Accessibility checked.

## Engineering

- [ ] OMS does not own ERP inventory ledger.
- [ ] OMS does not directly access CRM persistence.
- [ ] Cross-module dependencies use contracts/ports.
- [ ] Provider adapters are behind provider ports.
- [ ] Derived statuses have centralized domain rules.
- [ ] Financial/external commands support idempotency where required.
- [ ] Concurrency hazards have protection.
- [ ] Tenant isolation verified.
- [ ] Unit/integration/frontend/E2E tests pass.
- [ ] Build/lint/type checks pass.
- [ ] Migrations pass.
- [ ] Context/progress docs updated.

---

# 58. FINAL AGENT CHECKLIST BEFORE EACH OMS SCREEN

Before coding every screen or transactional flow, explicitly determine:

```text
User job:
Primary business object:
Reference Shopify pattern:
Order state:
Payment state:
Fulfillment state:
Return state:
Provider sync state:
Primary action:
Secondary actions:
Permission requirement:
Provider capability requirement:
Loading state:
Empty state:
Validation state:
Failure recovery:
Audit event:
Next navigation:
```

If these are unclear, do not invent them.

Inspect project context and existing domain rules.

---

# 59. STOP CONDITION

After OMS-12 and the OMS Definition of Done:

Report exactly:

1. OMS slices implemented.
2. Tests run and results.
3. Important architecture decisions.
4. Remaining OMS limitations.
5. Provider capabilities currently supported.
6. Context files updated.
7. Suggested branch/commit history.

Then STOP.

Do not begin ERP.

Wait for explicit instruction for Module 03.
