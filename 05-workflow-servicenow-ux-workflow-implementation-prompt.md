# UBOP — MODULE 05 WORKFLOW AUTOMATION
## Implementation Prompt for AI Agent
### Reference UX/Workflow: ServiceNow Workflow Studio / Flow Designer
### Scope Lock: Workflow Automation only — do not redesign completed CRM, OMS, ERP, or BI modules

---

# 0. MANDATORY EXECUTION RULE

You are implementing **only the Workflow Automation module of UBOP**.

You MUST NOT begin or redesign:
- CRM business workflows,
- OMS order domain,
- ERP procurement/inventory domain,
- BI report authoring,
- provider marketplace architecture,
- microservice extraction,
- unrelated global shell,
- arbitrary scripting/runtime execution,
- AI workflow generation,
- BPMN engine replacement,
- RPA/browser automation,
- low-code application builder.

You MAY consume events, commands, provider capabilities, connection references, and read contracts exposed by existing modules.

You MUST NOT:
- import another module's repository directly,
- mutate another module's database directly,
- call provider credentials directly,
- bypass the provider abstraction layer,
- execute arbitrary user-supplied Python/JavaScript,
- invent business rules that belong to CRM/OMS/ERP.

The Workflow module **orchestrates existing capabilities**. It does not own their domain truth.

When Workflow Automation satisfies all acceptance criteria and tests, STOP.

Execution order:

1. Read all project context required by `CLAUDE.md`.
2. Inspect Core, CRM, OMS, ERP, BI and Provider contracts.
3. Inventory available domain events and callable capabilities.
4. Produce the Workflow implementation plan before coding.
5. Implement one Workflow slice at a time.
6. Add unit/integration/frontend tests immediately per slice.
7. Run build/lint/type/tests after each meaningful slice.
8. Update context/progress docs.
9. Report completed Workflow scope and limitations.
10. STOP.

---

# 1. YOUR ROLE

Act as a:

- Senior Enterprise Product Designer,
- Senior Workflow Automation Product Engineer,
- Senior Backend / Distributed Systems Engineer,
- Senior Frontend Engineer.

Primary reference product:

**ServiceNow Workflow Studio / Flow Designer**

Adopt ServiceNow's useful patterns:

- Flow = trigger + ordered automation logic,
- Action = reusable operation,
- Subflow = reusable flow fragment with inputs and outputs,
- clear distinction between design-time and runtime,
- trigger configuration,
- action catalog,
- flow logic such as If / Else / For Each,
- reusable subflows,
- data references passed between steps,
- connection-aware integration actions,
- test-before-activation,
- execution details,
- step-level runtime information,
- run history,
- role-aware design and operations,
- explicit draft / publish / active lifecycle,
- reusable components instead of copying blocks repeatedly.

ServiceNow's current Workflow Studio explicitly models flows, subflows and actions as distinct reusable components; subflows have defined inputs/outputs and no trigger, while flow tests produce execution details for inspection. UBOP should reproduce these mental models without copying ServiceNow's branding or exact interface.

Do NOT copy:
- ServiceNow logo,
- ServiceNow exact colors,
- proprietary icons/illustrations,
- pixel-for-pixel Workflow Studio UI.

Clone:
- mental model,
- information architecture,
- structured builder workflow,
- reusable action/subflow model,
- test/run experience,
- runtime diagnostics,
- operation safety,
- role-based access,
- publish/activate lifecycle.

Keep UBOP's own design language.

---

# 2. PRODUCT GOAL

Workflow Automation lets business users compose reliable cross-module processes from governed UBOP capabilities.

It should answer:

- What starts this automation?
- Under what conditions should it continue?
- What action runs next?
- What data from earlier steps is available?
- Which provider connection does this action use?
- What happens when a step fails?
- Is retry safe?
- Is human approval required?
- Which version is active?
- What happened in a specific run?
- Which step failed?
- What inputs and outputs were used?
- Can the flow be tested before activation?
- Can reusable logic be packaged as a subflow/action?

Core mental model:

```text
Trigger
  ↓
Flow Logic
  ↓
Action
  ↓
Action / Subflow / Branch
  ↓
Runtime Result
```

The Workflow module is an **orchestration layer**, not a source-of-truth domain.

---

# 3. DESIGN-TIME VS RUNTIME — NON-NEGOTIABLE

The architecture and UX must clearly separate:

```text
DESIGN TIME
Flow Definition
Flow Version
Trigger
Steps
Conditions
Action configuration
Subflows
Test configuration
Publish / Activate
```

from:

```text
RUNTIME
Flow Run
Step Run
Trigger payload reference
Resolved input values
Output values
Retries
Waits
Errors
Approvals
Timing
Logs
```

Never mutate an active historical run when a designer edits a flow later.

A run must always reference the exact version that executed.

---

# 4. CORE OBJECT MODEL

Use canonical Workflow entities independent of ServiceNow.

---

# 4.1 FlowDefinition

Represents logical identity of a workflow across versions.

```text
id
organization_id

name
description
category

owner_id
status

active_version_id?
draft_version_id?

created_at
updated_at
```

Definition status may include:

```text
DRAFT
ACTIVE
INACTIVE
ARCHIVED
```

Do not use status alone to represent version history.

---

# 4.2 FlowVersion

Immutable or effectively immutable once published.

```text
id
flow_definition_id

version_number
state

trigger_definition
flow_structure

created_by
created_at
published_at?
```

State:

```text
DRAFT
PUBLISHED
SUPERSEDED
```

Rule:
- editing an active flow creates/updates a Draft version,
- activation publishes a specific version,
- historical runs keep their version reference.

---

# 4.3 TriggerDefinition

```text
id
flow_version_id

trigger_type
configuration
enabled
```

MVP trigger types:

```text
DOMAIN_EVENT
SCHEDULE
MANUAL
WEBHOOK
```

Optional later:
- provider-specific event trigger,
- record change trigger if the architecture exposes record-event contracts.

Avoid implementing a generic database-table trigger abstraction that couples Workflow directly to module persistence.

---

# 4.4 StepDefinition

```text
id
flow_version_id

step_key
step_type

name
configuration

parent_step_key?
sequence_index

on_error_policy?
timeout_seconds?
retry_policy?

created_at
```

Step types:

```text
ACTION
CONDITION
FOR_EACH
SUBFLOW
WAIT
APPROVAL
```

Do not implement arbitrary script steps in MVP.

---

# 4.5 ActionDefinition

Reusable action metadata.

```text
id
organization_id

key
name
description
category

input_schema
output_schema

execution_type
capability_reference

version
status
```

Execution type examples:

```text
INTERNAL_CAPABILITY
PROVIDER_CAPABILITY
WORKFLOW_UTILITY
```

Status:

```text
DRAFT
PUBLISHED
DEPRECATED
```

---

# 4.6 SubflowDefinition

Reusable orchestration without a trigger.

```text
id
organization_id

name
description

input_schema
output_schema

active_version_id?
draft_version_id?

status
```

A Subflow:
- has inputs,
- has outputs,
- contains steps/flow logic,
- has no independent trigger,
- is called by a Flow or another approved Subflow.

Avoid recursion in MVP unless explicitly supported.

Default:
block direct or indirect recursive Subflow cycles.

---

# 4.7 ConnectionReference Binding

Provider actions must use a logical connection reference.

Example:

```text
Action:
Create Shopify Fulfillment

Connection Reference:
Primary Commerce OMS
```

Do NOT store:
- API token,
- OAuth secret,
- provider credentials

inside the Flow definition.

---

# 4.8 FlowRun

```text
id
organization_id

flow_definition_id
flow_version_id

trigger_type
trigger_reference?
trigger_payload_snapshot?

status

started_at
completed_at?

current_step_key?
error_summary?

correlation_id
idempotency_key?

created_at
```

Run states:

```text
QUEUED
RUNNING
WAITING
PAUSED
SUCCEEDED
FAILED
CANCELLED
```

---

# 4.9 StepRun

```text
id
flow_run_id

step_key
step_type
step_name

status

attempt
started_at
completed_at?

resolved_inputs
outputs

error_code?
error_message?

duration_ms?
```

Status:

```text
PENDING
RUNNING
WAITING
SUCCEEDED
FAILED
SKIPPED
CANCELLED
```

---

# 4.10 ApprovalRequest

Workflow-level human approval primitive.

```text
id
organization_id
flow_run_id
step_run_id

approver_type
approver_reference

status

requested_at
responded_at?
responded_by?

decision?
comment?
```

Status:

```text
PENDING
APPROVED
REJECTED
CANCELLED
EXPIRED
```

Do not duplicate ERP/CRM domain approval rules.
Workflow approval only orchestrates approval when a flow explicitly uses this primitive.

---

# 4.11 WaitState

For delayed/resumable automation.

```text
id
flow_run_id
step_run_id

wait_type
resume_at?
resume_event_type?
resume_correlation_key?

status
```

Wait types:

```text
DURATION
UNTIL_DATETIME
EVENT
```

Do not keep application worker processes sleeping in memory.

Persist wait state and resume asynchronously.

---

# 5. WORKFLOW INFORMATION ARCHITECTURE

Inside UBOP shell:

```text
Automation
├── Flows
├── Runs
├── Actions
├── Subflows
└── Templates
```

Optional Admin:

```text
Automation Settings
```

Do not create ten navigation areas for implementation details.

---

# 6. AUTOMATION HOME / FLOW INDEX

Reference:
ServiceNow Flow list / Workflow Studio management surface.

Default route:
`Automation → Flows`

Anatomy:

```text
Flows                                             [+ New Flow]

[ All ] [ Active ] [ Draft ] [ Failed Recently ] [ Inactive ]

Search flows...

Name                    Trigger               Last Run      Status
Low Stock Alert         Inventory Changed     2 min ago     Active
Large Order Approval    Order Created         1h ago        Active
Daily Revenue Summary   Schedule 08:00        Today         Active
```

Columns:

```text
Name
Trigger
Active Version
Last Run
Last Run Status
Owner
State
```

Optional:
- Updated At,
- Run count.

Do not show provider secrets or internal JSON.

---

# 7. FLOW INDEX SAVED/SYSTEM VIEWS

System views:

```text
All
Active
Draft
Inactive
Failed Recently
Owned by Me
```

Filters:
- owner,
- state,
- trigger type,
- category,
- last run status,
- provider/action category if needed.

---

# 8. FLOW DETAIL / DESIGNER ENTRY

Click flow → Flow Detail / Designer.

Header:

```text
Large Order Approval
Active · v3

Draft changes available

[Test] [Activate Draft] [More ▾]
```

Metadata:

```text
Owner
Operations Team

Trigger
OMS Order Created

Active Version
v3

Draft Version
v4

Last Run
12:42 · Succeeded
```

Tabs or sections:

```text
Designer
Runs
Versions
Settings
```

Do not place runtime debugging details directly inside the design canvas by default.

---

# 9. CREATE FLOW WORKFLOW

Primary action:
`+ New Flow`

Flow:

```text
1 Basic Information
 ↓
2 Trigger
 ↓
3 Open Designer
 ↓
4 Add Actions / Logic
 ↓
5 Configure
 ↓
6 Validate
 ↓
7 Test
 ↓
8 Publish / Activate
```

Do not activate immediately after naming a flow.

---

# 10. CREATE FLOW — BASIC INFORMATION

Fields:

```text
Name *
Description
Category
Owner
```

Naming guidance:
- use business intent,
- not implementation details.

Good:

```text
Large Order Approval
Low Stock Notification
Customer Follow-up Reminder
```

Bad:

```text
Flow 1
Automation Test
Webhook 3
```

---

# 11. TRIGGER SELECTION UX

Trigger card selection:

```text
Choose a trigger

Business Event
Run when something happens in UBOP

Schedule
Run at a defined time

Manual
Run when an authorized user starts it

Webhook
Run from an authenticated external request
```

Do not expose internal queue/topic names.

---

# 12. DOMAIN EVENT TRIGGER

Preferred for cross-module event-driven flows.

Examples:

```text
CRM.OpportunityWon
CRM.LeadConverted

OMS.OrderCreated
OMS.OrderPaid
OMS.FulfillmentCreated
OMS.ReturnRequested

ERP.InventoryLow
ERP.PurchaseOrderApproved
ERP.GoodsReceiptPosted
ERP.SupplierInvoiceMismatch

BI.RefreshFailed
```

Flow configuration:

```text
Trigger
Order Created

Source
OMS

Optional Conditions
Order total > 50,000,000
Channel = B2B
```

Workflow module consumes event contracts, not domain tables.

---

# 13. SCHEDULE TRIGGER

UX:

```text
Schedule

Frequency
Daily

Time
08:00

Timezone
Asia/Ho_Chi_Minh

Start Date
...

End
Never / Date
```

Support MVP:

```text
Once
Hourly
Daily
Weekly
Monthly
```

Do not build a fully arbitrary cron expression editor as primary UX.

Advanced cron can be omitted or secondary.

---

# 14. MANUAL TRIGGER

Manual trigger allows authorized user to run a flow with defined inputs.

Example:

```text
Manual Flow
Generate Monthly Operations Package

Inputs
Month *
Region
```

The flow defines its input schema.

Do not use free-form JSON as primary user input.

---

# 15. WEBHOOK TRIGGER

Webhook flow setup:

```text
Webhook Trigger

Endpoint
/generated safely/

Authentication
Signed Secret / Token

Expected Input Schema
...

Rate Limit
...

Replay Protection
Enabled
```

Security:
- verify signature/token,
- deduplicate request/event ID,
- tenant scope,
- validate schema,
- do not expose internal stack traces.

Provide secret rotation through Core/provider/security systems where appropriate.

Do not display full secret after initial creation.

---

# 16. FLOW DESIGNER — CORE UX

Reference:
ServiceNow Workflow Studio structured flow.

UBOP should use a **structured vertical flow**, not a freeform infinite graph by default.

Example:

```text
Large Order Approval

Trigger
┌─────────────────────────────────┐
│ OMS · Order Created             │
└─────────────────────────────────┘
                ↓
Condition
┌─────────────────────────────────┐
│ Order total > ₫50,000,000       │
└─────────────────────────────────┘
        Yes ↓              No ↓
┌─────────────────┐    ┌─────────────────┐
│ Request Approval│    │ Mark Auto Route │
└─────────────────┘    └─────────────────┘
        ↓
┌─────────────────────────────────┐
│ Notify Sales Owner              │
└─────────────────────────────────┘
```

Why:
- easier to understand,
- easier to validate,
- more accessible,
- maps well to structured execution,
- prevents spaghetti workflows.

---

# 17. DESIGNER LAYOUT

Desktop:

```text
┌────────────────────┬───────────────────────────────┬──────────────────────┐
│ Step Library       │ Flow Canvas                   │ Configuration Panel  │
│                    │                               │                      │
│ Actions            │ Trigger                       │ Selected step        │
│ Logic              │   ↓                           │ Inputs               │
│ Subflows           │ Action                        │ Connection           │
│                    │   ↓                           │ Retry                │
│ Search             │ Condition                     │ Error Policy         │
└────────────────────┴───────────────────────────────┴──────────────────────┘
```

Left:
Action/logic library.

Center:
structured flow.

Right:
configuration for selected node.

Do not navigate away from the flow for routine step configuration.

---

# 18. ADD STEP UX

Between steps:

```text
        ↓
      [+]
```

Click opens chooser:

```text
Add to Flow

Actions
Subflow
Condition
For Each
Wait
Approval
```

Search:

```text
Search actions...
```

Categories:

```text
CRM
OMS
ERP
BI
Notifications
Providers
Utilities
```

---

# 19. ACTION CATALOG

Reference:
ServiceNow actions/spokes mental model.

Action cards show:

```text
Send Notification
Notifications

Inputs:
Recipient
Subject
Message
```

Provider action:

```text
Create Shopify Fulfillment
Shopify Provider

Requires connection
Capability: create_fulfillment
```

Internal action:

```text
Create CRM Task
CRM

Capability: crm.activity.create
```

Do not expose internal REST endpoint names as action titles.

---

# 20. ACTION CONFIGURATION PANEL

Example:

```text
Action
Send Notification

Connection
UBOP Notifications

Inputs

Recipient
{{ trigger.order.owner.email }}

Subject
Large order requires approval

Message
Order {{ trigger.order.order_number }}
requires review.

Advanced
Retry Policy
Timeout
Error Behavior
```

Required fields clearly marked.

Validation occurs before testing/publishing.

---

# 21. DATA REFERENCES / "DATA PILLS" MODEL

ServiceNow uses prior-step data throughout flows.

UBOP should offer structured data references.

Example picker:

```text
Available Data

Trigger
  Order
    id
    order_number
    total
    customer
      name
      email

Step 2 · Approval
  decision
  approver
  comment
```

Selecting inserts a typed reference:

```text
{{ trigger.order.total }}
```

Do not make users manually type JSON paths as the default experience.

---

# 22. TYPED DATA REFERENCES

Each action input defines a type.

Example:

```text
Recipient
expects: email/string

Order Amount
expects: money/decimal
```

Data picker should prioritize compatible fields.

Invalid type mapping:

```text
Recipient <- trigger.order.total
```

must show configuration error.

Do not wait until runtime if static validation can catch it.

---

# 23. CONDITION BUILDER

Do not require code.

UX:

```text
Condition

ALL conditions are true

Order Total
[greater than]
[50,000,000]

AND

Order Channel
[equals]
[B2B]

[+ Add condition]
```

Support groups:

```text
ALL
ANY
```

MVP operators:

```text
equals
not equals
greater than
greater than or equal
less than
less than or equal
contains
not contains
is empty
is not empty
in
not in
```

Date operators as defined by type.

No `eval()`.

Compile validated condition AST/DSL.

---

# 24. CONDITION BRANCH UX

```text
Condition
Order total > ₫50M

True
 └── Request Approval

False
 └── Continue
```

Allow:
- If
- Else If if supported
- Else

Keep nesting understandable.

Warn on excessive depth.

---

# 25. FOR EACH LOOP

Reference:
ServiceNow Flow Logic.

UX:

```text
For Each

List
{{ trigger.order.items }}

Current Item
item
```

Inside:

```text
For Each Order Item
   ↓
Check Inventory
   ↓
...
```

Runtime safety:
- maximum collection size,
- transaction/run limits,
- timeout,
- concurrency policy.

Do not allow unbounded nested loops.

MVP recommendation:
limit nesting depth and collection size.

---

# 26. WAIT STEP

Use persisted asynchronous wait.

Types:

## Duration

```text
Wait
2 hours
```

## Until time

```text
Wait until
{{ trigger.order.expected_date }}
```

## Event

```text
Wait until
ERP.StockReservationConfirmed

Correlation
Order ID = {{ trigger.order.id }}
```

Do not block a worker thread/process while waiting.

---

# 27. APPROVAL STEP

Approval configuration:

```text
Request Approval

Approver
Order Owner's Manager

Decision Options
Approve
Reject

Due
24 hours

On timeout
Fail Flow / Continue Path / Escalate
```

MVP approver references may support:

```text
Specific User
Specific Role
Record Owner
Manager-of-user if Core supports hierarchy
```

Do not invent organizational hierarchy if not present.

---

# 28. APPROVAL RUNTIME UX

Approver sees:

```text
Approval Required

Flow
Large Order Approval

Order
#20391

Amount
₫85,000,000

Requested by
Automation

[Reject] [Approve]
```

Optional comment.

Approval page must link to relevant operational record.

Example:
`Open OMS Order`

---

# 29. APPROVAL RESUME

Runtime:

```text
Flow WAITING
 ↓
Approval APPROVED
 ↓
Flow resumes next approved branch
```

Reject follows reject branch.

Never poll aggressively from browser.

Runtime engine resumes through persisted event/job.

---

# 30. SUBFLOW

Use for reusable orchestration.

Example:

```text
Subflow
Notify Responsible Owner

Inputs:
entity_type
entity_id
owner_email
message

Outputs:
notification_id
sent_at
```

A Subflow has:
- defined inputs,
- defined outputs,
- internal actions/logic,
- no trigger.

---

# 31. CREATE SUBFLOW UX

Navigation:
`Automation → Subflows`

Primary:
`+ New Subflow`

Flow:

```text
Basic Info
 ↓
Define Inputs
 ↓
Build Steps
 ↓
Define Outputs
 ↓
Validate
 ↓
Test
 ↓
Publish
```

Do not create Subflows through copying JSON.

---

# 32. SUBFLOW INPUTS / OUTPUTS

Input editor:

```text
Input
owner_email

Type
Email/String

Required
Yes

Description
Recipient responsible for the source record
```

Output:

```text
Output
notification_id

Type
UUID/String
```

Output mapping:

```text
notification_id =
{{ step.send_notification.id }}
```

---

# 33. ACTION DESIGNER

Use reusable actions for atomic operations.

Navigation:
`Automation → Actions`

Action is lower-level than Subflow.

Examples:

```text
Create CRM Activity
Create OMS Tag
Reserve ERP Inventory
Refresh BI Semantic Model
Send Email Notification
Call Provider Capability
```

Action should:
- define inputs,
- define outputs,
- expose safe configuration,
- hide implementation details.

---

# 34. CUSTOM ACTION SAFETY

MVP should NOT allow arbitrary code execution.

Safe custom action options:

```text
Internal Capability Binding
Provider Capability Binding
HTTP Provider Action through existing Custom Provider system
Data Transform Utility from approved operators
```

Do not provide:
- arbitrary Python,
- arbitrary shell,
- unrestricted JS,
- arbitrary SQL.

This protects platform integrity.

---

# 35. CONNECTION REFERENCE UX

Provider action selected:

```text
Create Shopify Fulfillment

Connection Reference
[Primary Commerce OMS ▾]
```

The user chooses logical connection reference.

Do not show API keys.

If no compatible connection exists:

```text
No compatible Shopify connection

[Create Connection]
```

Navigation should go to existing Integration flow.

Do not build a second connection manager inside Workflow.

---

# 36. FLOW VALIDATION

Before Test or Activate, run static validation.

Check:

- trigger configured,
- required action inputs,
- valid data references,
- type compatibility,
- connection reference exists,
- provider capability exists,
- subflow exists/published,
- no recursive subflow cycle,
- no unreachable branch where detectable,
- timeout/retry values valid,
- approval approver resolvable where statically possible,
- no invalid deleted references.

Validation panel:

```text
Validation

✓ Trigger configured
✓ Connections valid
✓ Required inputs configured

2 issues

Step 4 · Send Notification
Recipient is missing

Step 7 · ERP Action
Connection reference is disconnected

[Go to issue]
```

---

# 37. TEST FLOW — SERVICE NOW-INSPIRED

Reference:
ServiceNow lets designers test a saved flow using supplied trigger data, then inspect execution details.

UBOP must provide:

```text
[Test]
```

Test dialog depends on trigger type.

---

# 38. TEST DOMAIN EVENT FLOW

Example:

```text
Test Flow
Large Order Approval

Trigger
OMS.OrderCreated

Test Data
○ Select existing order
○ Use sample payload

Order
#20391

[Run Test]
```

Prefer selection of safe test/demo data.

Clearly indicate side effects.

If test can mutate real records:

```text
This test may create or modify UBOP records.
Use non-production/test data.
```

In product environments, implement test-mode safeguards where possible.

---

# 39. TEST MANUAL FLOW

Input form generated from trigger schema.

Example:

```text
Month
September 2026

Region
Vietnam

[Run Test]
```

---

# 40. TEST WEBHOOK FLOW

Allow test payload input validated against schema.

Do not require invoking public endpoint for every designer test.

---

# 41. TEST RESULT SUMMARY

After test:

```text
Test completed

Succeeded
Duration 1.24s

[View Execution Details]
```

Failure:

```text
Test failed

Step 4
Send Notification

Recipient email is missing.

[View Execution Details]
```

---

# 42. EXECUTION DETAILS — CRITICAL UX

Reference:
ServiceNow execution details show runtime state, actions run, durations and produced values.

UBOP execution detail:

```text
Run #RUN-10291
Large Order Approval · v3

Status
Failed

Started
13:20:01

Duration
1.24s

Trigger
OMS.OrderCreated
Order #20391

Execution
✓ Trigger                       12 ms
✓ Check Order Value              3 ms
✓ Request Approval              44 ms
✓ Approval received         12m 04s
✕ Send Notification            120 ms

Error
Recipient email is missing.
```

Click step to inspect details.

---

# 43. STEP RUN DETAIL

Right panel/page:

```text
Send Notification

Status
Failed

Attempt
1

Started
...

Duration
120 ms

Inputs
Recipient: null
Subject: "Large order approved"

Outputs
None

Error
MISSING_RECIPIENT

Message
Recipient email is required.

[Go to Flow Step]
```

Sensitive values must be masked.

---

# 44. EXECUTION DATA VISIBILITY

Do not expose all runtime data to all users.

Runtime details respect:
- organization,
- roles,
- sensitive field rules,
- provider secret masking.

Never log:
- API tokens,
- full secrets,
- passwords,
- raw confidential auth headers.

---

# 45. RUNS INDEX

Navigation:
`Automation → Runs`

```text
Runs

[ All ] [ Running ] [ Waiting ] [ Failed ] [ Succeeded ]

Flow                    Version  Started      Duration    Status
Large Order Approval    v3       13:20        12m 5s      Failed
Low Stock Alert         v7       13:18        320ms       Succeeded
```

Filters:
- flow,
- version,
- state,
- date,
- trigger type,
- correlation/business reference.

---

# 46. RUN DETAIL ACTIONS

Depending on state and permission:

```text
Cancel Run
Retry Failed Step / Retry Run
Open Source Record
Open Flow Version
```

Retry should only be enabled when semantics are safe.

Do not blindly rerun a monetary/provider action.

---

# 47. RETRY POLICY

Each action may define policy.

Example:

```text
Retry

Max Attempts
3

Backoff
Exponential

Initial Delay
30 sec

Retry On
Timeout
Rate Limit
Temporary Provider Error
```

Do NOT retry:
- validation errors,
- permission errors,
- known permanent errors,
- unsafe non-idempotent action without protection.

---

# 48. IDEMPOTENCY

Workflow runtime must protect against duplicate effects.

Critical actions:
- refunds,
- payments,
- fulfillments,
- inventory mutations,
- provider writes,
- emails/notifications where duplicates are undesirable.

Action execution context should include:

```text
flow_run_id
step_key
attempt
idempotency_key
```

Provider/domain actions use idempotency if supported.

Do not assume retries are harmless.

---

# 49. ERROR POLICY

Per-step error behavior:

MVP options:

```text
FAIL_FLOW
RETRY_THEN_FAIL
CONTINUE
```

Optional:
- route to error branch.

Do not implement hidden silent failure.

If `CONTINUE`:
UI must make it explicit.

Example:

```text
On error
Continue flow and record warning
```

---

# 50. TIMEOUT

Each external/provider action supports a bounded timeout.

Do not let a provider request block a worker indefinitely.

Timeout failure becomes a typed runtime error.

---

# 51. FLOW CANCELLATION

Running/waiting flow may be cancelled by authorized operator.

Cancellation:

```text
Cancel Run?

Completed actions will not automatically be undone.

Current state
Waiting for approval

[Keep Running] [Cancel Run]
```

Important:
cancellation is not rollback.

Do not imply completed external side effects are reverted.

---

# 52. COMPENSATION

Do NOT build a full Saga compensation framework in MVP unless explicitly required.

If an action has a safe domain-specific compensation:
- expose it as an explicit action/subflow,
- do not auto-infer compensating behavior.

Example:

```text
Reserve Inventory
```

can later be paired with:

```text
Release Inventory Reservation
```

but designer controls process logic.

---

# 53. FLOW VERSIONING

Version behavior:

```text
v3 ACTIVE

Edit Flow
 ↓
v4 DRAFT

Test v4
 ↓
Publish / Activate
 ↓
v4 ACTIVE
v3 SUPERSEDED
```

Existing runs of v3 remain v3.

Do not mutate v3 definition.

---

# 54. VERSION HISTORY UX

```text
Versions

v4 Draft
Updated by Huy · 14:10

v3 Active
Published 20 Sep · Huy

v2 Superseded
Published 18 Sep
```

Actions:
- view,
- compare summary if implemented,
- restore/copy to draft if supported.

Do not make historical published version editable.

---

# 55. ACTIVATE FLOW

Before activate:

```text
Activate Flow

Version
v4

Validation
✓ No errors

Trigger
OMS.OrderCreated

Connections
✓ Primary Commerce OMS
✓ UBOP Notifications

This activation will replace active v3.

[Cancel] [Activate v4]
```

---

# 56. DEACTIVATE FLOW

Deactivating means no new trigger executions.

It does not automatically cancel existing running/waiting runs unless explicitly selected/supported.

Confirmation:

```text
Deactivate Large Order Approval?

New triggers will stop.
3 runs are currently active.

○ Let active runs finish
○ Cancel active runs (if permitted)

[Cancel] [Deactivate]
```

Default safer choice:
let active runs finish.

---

# 57. FLOW TEMPLATES

Navigation:
`Automation → Templates`

Use templates as starter blueprints.

Examples:

```text
Low Stock Notification
Large Order Approval
Failed Provider Sync Alert
Daily Sales Summary
Opportunity Won Handoff
Supplier Invoice Mismatch Alert
```

Template creates a Draft flow.

It is not active automatically.

Do not bind real credentials/connections silently.

---

# 58. TEMPLATE SETUP

After choosing template:

```text
Use Template
Low Stock Notification

Required setup

Inventory Event
ERP.InventoryLow ✓

Notification Connection
[Choose...]

Recipients
[Inventory Managers]

[Create Draft]
```

---

# 59. ACTION / SUBFLOW CATALOG UX

Actions index:

```text
Actions

Search actions...

CRM
  Create Activity

OMS
  Add Order Tag

ERP
  Reserve Inventory
  Release Reservation

BI
  Refresh Semantic Model

Notifications
  Send Notification

Providers
  Shopify · Create Fulfillment
```

Each action detail shows:
- description,
- inputs,
- outputs,
- category,
- required connection/capability,
- version,
- usage count,
- status.

---

# 60. DEPRECATION

Published reusable Action/Subflow can be deprecated.

Deprecated:
- existing flows can continue if version remains supported,
- new usage should warn/block according to policy.

Do not hard-delete reusable components used by active flow versions.

---

# 61. DOMAIN EVENT CONTRACT

Workflow subscribes to stable event contracts.

Example:

```json
{
  "event_id": "...",
  "event_type": "OMS.OrderCreated",
  "occurred_at": "...",
  "organization_id": "...",
  "entity": {
    "type": "order",
    "id": "..."
  },
  "data": {}
}
```

Prefer minimal stable event payload plus fetch/reference capability over giant provider/raw payloads.

Do not couple to internal ORM objects.

---

# 62. EVENT DEDUPLICATION

Trigger ingestion uses:

```text
organization_id + event_id
```

or equivalent uniqueness.

Duplicate event should not start duplicate runs unless trigger explicitly allows it.

---

# 63. TRIGGER CONDITION EVALUATION

Flow trigger conditions evaluate normalized trigger data.

Example:

```text
OMS.OrderCreated

AND
order.total > 50M
order.channel = B2B
```

If false:
- no run or a trigger-evaluation audit depending on observability policy,
- do not create full failed run.

---

# 64. CONCURRENCY POLICY

Flow can optionally define concurrency behavior.

MVP useful options:

```text
ALLOW_PARALLEL
ONE_PER_CORRELATION_KEY
```

Example:

```text
Low Stock workflow

Correlation
product_id + warehouse_id

Only one active run per correlation
```

Avoid duplicate concurrent processing.

---

# 65. RUN CORRELATION

Flows need correlation to business objects.

Examples:

```text
Order ID
Opportunity ID
Purchase Order ID
Supplier Invoice ID
Inventory Item ID
```

Run detail should show:

```text
Related
Order #20391
```

with navigation.

---

# 66. SCHEDULE ENGINE

Scheduled flows should not depend on browser sessions.

Use persistent scheduler/job queue.

Protect against duplicate schedule firing through lease/idempotency mechanism.

Timezone must be explicit.

---

# 67. WORKER ARCHITECTURE

Conceptual:

```text
Trigger Ingestion
      ↓
Run Creation
      ↓
Workflow Queue
      ↓
Execution Worker
      ↓
Step Executor
      ↓
Domain / Provider Capability
      ↓
Persist Step Result
      ↓
Next Step / Wait / Complete
```

Do not run long workflow execution entirely in a synchronous API request.

---

# 68. ASYNC EXECUTION

API command:

```text
Run Flow
```

should usually:

```text
validate
create FlowRun QUEUED
enqueue
return run ID
```

Worker progresses asynchronously.

UI follows status.

---

# 69. PERSIST AFTER EACH STEP

After meaningful step transition, persist:
- step state,
- outputs,
- error,
- next position.

This enables:
- resumability,
- diagnostics,
- retries,
- process restarts.

Do not keep the entire workflow state only in memory.

---

# 70. WAIT / RESUME ENGINE

Wait:

```text
Step enters WAITING
 ↓
persist state
 ↓
worker released
 ↓
timer/event occurs
 ↓
resume message queued
 ↓
worker loads FlowRun
 ↓
continue next step
```

---

# 71. APPROVAL NOTIFICATIONS

Approval step may call Notification capability.

However:
approval truth remains Workflow ApprovalRequest.

Notification delivery failure does not necessarily invalidate ApprovalRequest.

Example:

```text
Approval Request
PENDING

Notification
FAILED
```

Expose retry/escalation if appropriate.

---

# 72. FLOW BUILDER AUTOSAVE

Draft designer may autosave low-risk structural edits.

Show:

```text
Saved 10 seconds ago
```

But publication/activation remains explicit.

Do not auto-activate.

---

# 73. UNSAVED / INVALID DRAFT

If autosave not used:
- show unsaved state,
- warn on navigation.

If draft is invalid:
- saving draft is allowed,
- testing/activation may be blocked.

This supports work-in-progress.

---

# 74. DESIGNER UNDO/REDO

If feasible:
- local undo/redo for editor actions.

Do not implement complex distributed undo for runtime operations.

Editor undo only affects Draft configuration.

---

# 75. KEYBOARD / ACCESSIBILITY

Designer must support:
- keyboard traversal between nodes,
- Add Step via keyboard,
- selected node visible,
- configuration panel labeled,
- branch labels accessible,
- status not color-only,
- error summary,
- focus returns correctly after dialogs,
- alternative to drag/drop.

Do not make drag/drop the only way to reorder steps.

---

# 76. RESPONSIVE STRATEGY

Workflow authoring is desktop-first.

Desktop:
- 3-pane designer,
- run details,
- action library.

Tablet:
- designer usable with collapsible left/right panels,
- full-screen config drawer if needed.

Mobile:
prioritize:
- flow status,
- run monitoring,
- approval actions,
- retry/cancel when permitted.

Do not force full workflow authoring onto mobile MVP.

---

# 77. EMPTY STATES

## No flows

```text
No automation flows yet

Flows connect UBOP events, conditions, actions and provider capabilities into repeatable business processes.

[Create Flow] [Browse Templates]
```

## No runs

```text
No runs yet

Runs will appear after this flow is tested or triggered.
```

## No actions in category

```text
No compatible actions

Connect a provider or enable a module capability to make more actions available.
```

---

# 78. LOADING STATES

Designer:
- retain canvas structure while loading action metadata.

Run detail:
- step skeleton/list,
- refresh localized.

Action search:
- quick incremental loading.

Never blank the designer because one provider action catalog request refreshes.

---

# 79. ERROR UX

Configuration error:

```text
This step needs attention

Connection Reference is missing.

[Choose Connection]
```

Runtime error:

```text
Create Shopify Fulfillment failed

Order was not modified by this step.

Reason
Provider rate limit exceeded.

Retry
Scheduled in 30 seconds

[View Provider] [Retry Now]
```

Flow-level failure:

```text
Flow failed at Step 4

Completed earlier steps were not automatically rolled back.

[View Execution]
```

---

# 80. PERMISSIONS

Conceptual roles:

## Automation Viewer
- view flows allowed,
- view run summaries,
- no edit.

## Automation Operator
- Viewer,
- inspect runs,
- cancel/retry permitted runs,
- handle operational failures.

## Flow Designer
- create/edit drafts,
- test,
- use published actions/subflows.

## Automation Publisher
- publish/activate/deactivate.

## Action Designer
- create reusable actions/subflows if granted.

## Automation Admin
- governance/configuration.

Keep publish/activate separate from ordinary viewing.

---

# 81. SENSITIVE RUNTIME DATA

Some data references may contain:
- customer email,
- financial values,
- internal notes,
- provider metadata.

Runtime viewer must respect source permissions.

Do not assume Flow Designer role grants unrestricted domain data access.

Use redaction/authorization.

---

# 82. OBSERVABILITY

Structured events/metrics:

```text
workflow.run.queued
workflow.run.started
workflow.run.succeeded
workflow.run.failed
workflow.run.cancelled

workflow.step.started
workflow.step.succeeded
workflow.step.failed
workflow.step.retry

workflow.approval.requested
workflow.approval.approved
workflow.approval.rejected

workflow.wait.started
workflow.wait.resumed
```

Metrics:
- runs by state,
- failure rate,
- average duration,
- retry count,
- queue latency,
- step duration,
- provider failure frequency.

Do not log secrets.

---

# 83. PERFORMANCE / LIMITS

Protect platform.

MVP limits:

- maximum steps per flow,
- maximum branch depth,
- maximum loop size,
- maximum subflow nesting depth,
- maximum runtime duration policy,
- max retries,
- payload size,
- webhook rate limits.

Exact values should live in config, not random UI constants.

UI should warn:

```text
This loop may process 5,000 items.
Current automation limit is 500 items per run.
```

---

# 84. REUSABILITY RULE

When logic appears in several flows:

Ask whether it should become:
- Action,
- Subflow,
- Template.

Action:
atomic reusable capability.

Subflow:
multi-step reusable process.

Template:
starter copy for new Flow.

Do not use a Subflow for a single atomic provider call when an Action is appropriate.

---

# 85. FLOW VS BUSINESS DOMAIN RULE

Bad:

```text
Workflow directly calculates order payment state.
```

Good:

```text
Workflow calls OMS action:
Record Payment / Request Payment Review
```

Bad:

```text
Workflow directly updates inventory_position table.
```

Good:

```text
Workflow calls ERP action:
Reserve Inventory
```

Business invariants stay in domain module.

---

# 86. BUILT-IN ACTION CATALOG — MVP

Expose only actions supported by existing modules.

Examples:

## CRM

```text
Create CRM Activity
Assign CRM Owner
Transition Opportunity Stage
```

Only if domain exposes safe capability.

## OMS

```text
Add Order Tag
Create Fulfillment Request
```

Do not expose unsafe direct refund action without explicit permission/idempotency design.

## ERP

```text
Reserve Inventory
Release Reservation
Create Purchase Requisition
```

## BI

```text
Refresh Semantic Model
```

## Notifications

```text
Send In-App Notification
Send Email
```

Only if notification capability exists.

---

# 87. PROVIDER ACTION CATALOG

Providers contribute governed actions through capability adapters.

Example:

```text
Shopify
  Create Fulfillment
  Update Order Tags

Salesforce
  Create Task
  Update Opportunity

Custom Provider
  approved capabilities...
```

Do not dynamically expose every arbitrary HTTP endpoint without provider definition/governance.

---

# 88. FLOW TEMPLATES — MVP SET

Potential templates:

## Low Stock Alert

```text
ERP.InventoryLow
 ↓
Condition: Available < Threshold
 ↓
Notify Inventory Manager
```

## Large Order Approval

```text
OMS.OrderCreated
 ↓
Condition: Total > Threshold
 ↓
Approval
 ↓
Notify Owner
```

## Opportunity Won Handoff

```text
CRM.OpportunityWon
 ↓
Create internal handoff action/subflow
 ↓
Notify Operations
```

Do not create OMS order directly unless the existing domain contract explicitly supports that action.

## Provider Sync Failure Alert

```text
Provider.SyncFailed
 ↓
Condition: Severity
 ↓
Notify Integration Admin
```

## BI Refresh Failure Alert

```text
BI.RefreshFailed
 ↓
Notify BI Owner
```

Templates remain Draft until configured and activated.

---

# 89. EXPECTED API CAPABILITY SURFACE

Exact routing follows project conventions.

Capabilities:

```text
GET    /automation/flows
POST   /automation/flows
GET    /automation/flows/{id}
PATCH  /automation/flows/{id}

GET    /automation/flows/{id}/versions
POST   /automation/flows/{id}/versions
GET    /automation/flows/{id}/versions/{version}

POST   /automation/flows/{id}/validate
POST   /automation/flows/{id}/test
POST   /automation/flows/{id}/activate
POST   /automation/flows/{id}/deactivate

GET    /automation/runs
GET    /automation/runs/{id}
POST   /automation/runs/{id}/cancel
POST   /automation/runs/{id}/retry

GET    /automation/actions
POST   /automation/actions
GET    /automation/actions/{id}
POST   /automation/actions/{id}/test
POST   /automation/actions/{id}/publish

GET    /automation/subflows
POST   /automation/subflows
GET    /automation/subflows/{id}
POST   /automation/subflows/{id}/test
POST   /automation/subflows/{id}/publish

GET    /automation/templates

GET    /automation/approvals
GET    /automation/approvals/{id}
POST   /automation/approvals/{id}/approve
POST   /automation/approvals/{id}/reject
```

Do not expose internal worker queue APIs to UI.

---

# 90. RUNTIME ENGINE COMPONENTS

Conceptual modules:

```text
TriggerRegistry
TriggerIngestionService

FlowDefinitionService
FlowVersionService
FlowValidationService

WorkflowRuntime
RunScheduler
StepExecutor

ActionRegistry
ActionExecutor

SubflowExecutor

ConditionEvaluator
LoopExecutor

WaitManager
ApprovalManager

RetryPolicyService
IdempotencyService

ExecutionLogService
WorkflowObservability
```

Avoid one giant `WorkflowService`.

---

# 91. CONDITION DSL

Safe representation example:

```json
{
  "type": "group",
  "operator": "AND",
  "children": [
    {
      "type": "condition",
      "left": {"ref": "trigger.order.total"},
      "operator": "GT",
      "right": {"value": "50000000"}
    }
  ]
}
```

Backend validates:
- reference exists,
- types compatible,
- operator allowed for type.

No arbitrary expression eval.

---

# 92. FLOW STRUCTURE REPRESENTATION

Prefer structured JSON/AST matching designer.

Example:

```text
Trigger
Steps[]
  Action
  Condition
    true_steps[]
    false_steps[]
  ForEach
    steps[]
  Subflow
```

This is safer for MVP than arbitrary node/edge graph execution.

If frontend uses graph library for display, backend still validates a structured executable model.

---

# 93. TESTING REQUIREMENTS

Workflow module requires strong tests.

---

# 93.1 Flow Definition tests

- create draft flow,
- valid trigger,
- invalid trigger blocked,
- required step inputs,
- type mismatch detected,
- invalid data ref detected,
- activate published version,
- active version immutable,
- new draft does not change active run behavior.

---

# 93.2 Trigger tests

- domain event starts run,
- trigger conditions false → no run,
- duplicate event deduplicated,
- manual trigger schema validation,
- schedule trigger fires once as expected,
- webhook auth validation,
- webhook replay protection.

---

# 93.3 Condition tests

- equals,
- comparisons,
- empty checks,
- AND,
- OR,
- nested group,
- type mismatch rejected.

---

# 93.4 Action tests

- internal capability success,
- provider capability success,
- missing connection,
- unsupported capability,
- timeout,
- permanent error,
- transient error,
- retry policy,
- idempotent repeated attempt.

---

# 93.5 Subflow tests

- inputs required,
- outputs mapped,
- parent receives outputs,
- invalid recursive cycle blocked,
- version used is explicit.

---

# 93.6 For Each tests

- empty list,
- multiple items,
- iteration context,
- max collection guard,
- nested depth guard.

---

# 93.7 Wait tests

- duration wait persists,
- timed resume,
- event wait correlation,
- duplicate resume event ignored,
- process restart does not lose wait.

---

# 93.8 Approval tests

- request created,
- approve resumes approved branch,
- reject resumes rejected branch,
- unauthorized decision rejected,
- duplicate decision rejected,
- timeout behavior,
- approval persists across worker restart.

---

# 93.9 Retry tests

- transient failure retries,
- backoff,
- max attempts,
- permanent failure not retried,
- retry-safe idempotency key stable per step execution context.

---

# 93.10 Run tests

- queued → running → succeeded,
- failure stores step,
- cancel waiting run,
- cancellation does not imply rollback,
- exact version reference retained,
- correlation reference retained.

---

# 93.11 Frontend tests

Critical:

- Flow Designer renders structure,
- Step Library search,
- configuration panel,
- data reference picker,
- condition builder,
- branch visualization,
- validation issue navigation,
- Test dialog,
- Execution Details,
- run filters,
- approval screen,
- version history,
- activate confirmation,
- provider connection missing state,
- permission states.

---

# 94. END-TO-END WORKFLOW FLOWS

Implement at least these.

## E2E 1 — Domain Event + Condition + Notification

```text
ERP.InventoryLow
 ↓
Condition available < threshold
 ↓
Send Notification
 ↓
Run Succeeded
```

Assert execution details.

---

## E2E 2 — Large Order Approval

```text
OMS.OrderCreated
 ↓
Order total > threshold
 ↓
Approval Request
 ↓
Approver approves
 ↓
Notify Owner
 ↓
Succeeded
```

Verify wait/resume.

---

## E2E 3 — Provider Transient Failure

```text
Event Trigger
 ↓
Provider Action
 ↓
Transient failure
 ↓
Retry with backoff
 ↓
Success
```

Verify:
- one logical business effect,
- attempts recorded,
- final run success.

---

## E2E 4 — Subflow

```text
Manual Trigger
 ↓
Reusable Notification Subflow
 ↓
Subflow output
 ↓
Final Action
```

Verify inputs/outputs.

---

## E2E 5 — Versioning

```text
Flow v1 active
 ↓
start run A
 ↓
create draft v2
 ↓
activate v2
 ↓
start run B
```

Assert:
- run A uses v1,
- run B uses v2.

---

# 95. PERFORMANCE ACCEPTANCE

- trigger ingestion lightweight,
- run execution async,
- persisted after steps,
- no blocking wait threads,
- bounded loop size,
- bounded payload sizes,
- action catalog metadata cached,
- run index paginated,
- execution details lazy-load heavy payloads,
- retry scheduling async,
- schedule engine deduplicated.

---

# 96. SECURITY ACCEPTANCE

- tenant isolation for flows/runs/actions/subflows,
- runtime respects caller/system authorization model,
- provider secrets not stored in flow,
- sensitive runtime fields masked,
- webhook authenticated,
- replay protected,
- no arbitrary code execution,
- no arbitrary SQL,
- no direct DB mutation across modules,
- approval decision authorized,
- publish/activate role enforced,
- run operational controls permissioned.

---

# 97. VISUAL DESIGN RULES

Do:
- structured vertical workflow,
- consistent step cards,
- clear trigger distinction,
- explicit True/False branches,
- right-side configuration,
- visible connection/provider context,
- compact metadata,
- clear success/warning/error state,
- strong execution trace.

Do NOT:
- build a decorative infinite canvas with spaghetti arrows,
- use random node colors,
- use gradients for step types,
- hide configuration in multiple modal layers,
- use huge cards,
- show raw JSON as primary configuration,
- overload canvas with runtime logs by default,
- turn every action into a unique visual design.

Consistency should come from:
- shell,
- step card anatomy,
- iconography,
- spacing,
- status semantics,
- configuration patterns.

---

# 98. IMPLEMENTATION ORDER — STRICT

## WF-01 — Domain & Versioning Foundation

Implement:
- FlowDefinition,
- FlowVersion,
- TriggerDefinition,
- StepDefinition,
- FlowRun,
- StepRun,
- migrations,
- repositories,
- version lifecycle.

Tests.

Commit:

```text
feat(workflow): establish versioned automation domain
```

STOP and verify.

---

## WF-02 — Action Registry & Capability Binding

Implement:
- ActionDefinition,
- input/output schemas,
- internal capability adapter,
- provider capability adapter,
- connection reference binding,
- catalog API.

Tests.

Commit:

```text
feat(workflow): add governed action capability registry
```

STOP and verify.

---

## WF-03 — Trigger Engine

Implement:
- DOMAIN_EVENT,
- MANUAL,
- SCHEDULE,
- WEBHOOK,
- schema validation,
- deduplication,
- correlation,
- trigger condition foundation.

Tests.

Commit:

```text
feat(workflow): implement automation trigger engine
```

STOP and verify.

---

## WF-04 — Runtime Engine

Implement:
- run creation,
- async queue,
- step execution,
- persistence after each step,
- success/failure state,
- runtime context.

Tests.

Commit:

```text
feat(workflow): add resumable workflow runtime
```

STOP and verify.

---

## WF-05 — Condition Builder & Runtime

Implement:
- safe DSL,
- AND/OR groups,
- typed operators,
- branches,
- validation,
- frontend condition builder.

Tests.

Commit:

```text
feat(workflow): add typed conditional flow logic
```

STOP and verify.

---

## WF-06 — Data Reference System

Implement:
- typed data references,
- trigger fields,
- prior-step outputs,
- data picker,
- validation,
- runtime resolution.

Tests.

Commit:

```text
feat(workflow): implement typed workflow data references
```

STOP and verify.

---

## WF-07 — Flow Designer

Implement:
- structured vertical canvas,
- Step Library,
- add/reorder,
- configuration panel,
- action search,
- draft editing,
- validation summary.

Tests.

Commit:

```text
feat(workflow): add structured flow designer workspace
```

STOP and verify.

---

## WF-08 — For Each & Safe Iteration

Implement:
- list iteration,
- iteration context,
- limits,
- nested guard,
- UI visualization.

Tests.

Commit:

```text
feat(workflow): add bounded collection iteration
```

STOP and verify.

---

## WF-09 — Subflows

Implement:
- SubflowDefinition/version,
- inputs,
- outputs,
- designer,
- invocation,
- cycle validation,
- test.

Tests.

Commit:

```text
feat(workflow): add reusable subflow orchestration
```

STOP and verify.

---

## WF-10 — Wait / Resume

Implement:
- persisted waits,
- duration,
- until datetime,
- event wait,
- correlation,
- scheduler/resume.

Tests.

Commit:

```text
feat(workflow): implement persistent wait and resume
```

STOP and verify.

---

## WF-11 — Human Approval

Implement:
- ApprovalRequest,
- approval step,
- pending UI,
- approve/reject,
- permission,
- timeout policy,
- resume.

Tests.

Commit:

```text
feat(workflow): add human approval automation step
```

STOP and verify.

---

## WF-12 — Retry, Timeout & Idempotency

Implement:
- typed errors,
- retry policies,
- backoff,
- timeout,
- idempotency context,
- safe retry rules.

Tests.

Commit:

```text
feat(workflow): harden action execution reliability
```

STOP and verify.

---

## WF-13 — Test Flow Experience

Implement:
- trigger-specific test dialog,
- test execution,
- warning for side effects,
- result summary,
- link to execution details.

Tests.

Commit:

```text
feat(workflow): add pre-activation flow testing
```

STOP and verify.

---

## WF-14 — Execution Details & Run Operations

Implement:
- Runs index,
- Execution Details,
- step inspection,
- inputs/outputs,
- masking,
- cancel,
- safe retry,
- related record navigation.

Tests.

Commit:

```text
feat(workflow): add workflow execution diagnostics
```

STOP and verify.

---

## WF-15 — Publish / Activate / Version History

Implement:
- validate-before-publish,
- version list,
- draft vs active,
- activate replacement,
- deactivate,
- active run behavior.

Tests.

Commit:

```text
feat(workflow): implement automation publishing lifecycle
```

STOP and verify.

---

## WF-16 — Reusable Action & Subflow Management

Implement:
- Actions index/detail,
- Subflows index/detail,
- publish/deprecate,
- usage metadata,
- tests.

Commit:

```text
feat(workflow): add reusable automation component management
```

STOP and verify.

---

## WF-17 — Templates

Implement:
- template index,
- starter flows,
- setup requirements,
- create Draft from template.

Tests.

Commit:

```text
feat(workflow): add governed automation templates
```

STOP and verify.

---

## WF-18 — Permissions & Governance

Implement:
- Viewer,
- Operator,
- Designer,
- Publisher,
- Action Designer,
- Admin,
- runtime data authorization,
- publish controls.

Tests.

Commit:

```text
feat(workflow): enforce automation governance roles
```

STOP and verify.

---

## WF-19 — Observability & Limits

Implement:
- structured events,
- metrics,
- runtime limits,
- loop/nesting guards,
- payload bounds,
- schedule deduplication.

Tests.

Commit:

```text
feat(workflow): add runtime observability and safety limits
```

STOP and verify.

---

## WF-20 — Hardening

Review:
- tenant isolation,
- accessibility,
- responsive monitor/approval UX,
- worker restart resiliency,
- concurrency,
- webhook security,
- error isolation,
- performance,
- E2E tests,
- docs/context.

Split commits:

```text
fix(workflow): enforce webhook replay protection
fix(workflow): preserve resumable run state
test(workflow): cover approval and retry journeys
docs(context): record workflow studio interaction model
```

Do NOT create one giant hardening commit.

---

# 99. DEFINITION OF DONE — WORKFLOW AUTOMATION

## Product

- [ ] Flows have Trigger + Steps.
- [ ] Domain Event trigger works.
- [ ] Manual trigger works.
- [ ] Schedule trigger works.
- [ ] Webhook trigger works securely.
- [ ] Action catalog exists.
- [ ] Provider actions use Connection References.
- [ ] Conditions work.
- [ ] Branches work.
- [ ] For Each works within limits.
- [ ] Typed data references work.
- [ ] Subflows have inputs/outputs and no trigger.
- [ ] Wait/resume is persistent.
- [ ] Human Approval works.
- [ ] Retry/backoff works.
- [ ] Idempotency protects safe retries.
- [ ] Flow test works.
- [ ] Execution Details work.
- [ ] Runs index works.
- [ ] Versioning works.
- [ ] Draft and Active version are distinct.
- [ ] Activation does not mutate historical runs.
- [ ] Templates create Drafts.
- [ ] Runtime diagnostics identify failed step.

## UX

- [ ] Structured vertical designer.
- [ ] Step Library searchable.
- [ ] Configuration panel stays in context.
- [ ] Data picker is typed.
- [ ] Conditions do not require code.
- [ ] Validation issues navigate to steps.
- [ ] Test is available before activation.
- [ ] Execution details show step state/timing/error.
- [ ] Provider connection context is visible.
- [ ] Secrets are never shown.
- [ ] Empty/loading/error states exist.
- [ ] Mobile supports monitoring/approval, not full authoring.
- [ ] Accessibility verified.

## Engineering

- [ ] Workflow does not own CRM/OMS/ERP business truth.
- [ ] No direct cross-module persistence writes.
- [ ] No arbitrary code execution.
- [ ] No arbitrary SQL.
- [ ] Provider operations go through adapters.
- [ ] Flow version immutable after publish.
- [ ] Runs reference exact version.
- [ ] Runtime persisted after steps.
- [ ] Waits survive worker restart.
- [ ] Retries are typed and bounded.
- [ ] Idempotency used for risky effects.
- [ ] Trigger events deduplicated.
- [ ] Tenant isolation verified.
- [ ] Sensitive values masked.
- [ ] Webhooks authenticated/replay-protected.
- [ ] Unit/integration/frontend/E2E tests pass.
- [ ] Build/lint/type checks pass.
- [ ] Migrations pass.
- [ ] Context/progress docs updated.

---

# 100. FINAL AGENT CHECKLIST BEFORE EACH WORKFLOW SCREEN / FEATURE

Before coding, explicitly determine:

```text
User role:
User job:
ServiceNow reference pattern:
Design-time or runtime:
Primary object:
Flow version state:
Trigger type:
Step type:
Input schema:
Output schema:
Data references:
Connection reference:
Provider capability:
Retry behavior:
Idempotency need:
Timeout:
Error policy:
Permission:
Sensitive data:
Audit/observability:
Loading state:
Empty state:
Error recovery:
Responsive behavior:
Accessibility:
```

If unclear:
- inspect project context,
- inspect existing module contracts,
- do not invent domain behavior.

---

# 101. STOP CONDITION

After WF-20 and the Workflow Definition of Done:

Report exactly:

1. Workflow slices implemented.
2. Tests run and results.
3. Trigger types implemented.
4. Action / Subflow capabilities implemented.
5. Runtime architecture.
6. Wait / Approval / Retry behavior.
7. Versioning behavior.
8. Security/idempotency decisions.
9. Provider capability bindings supported.
10. Remaining Workflow limitations.
11. Context files updated.
12. Suggested branch/commit history.

Then STOP.

Do not start new modules or redesign existing modules without explicit instruction.
