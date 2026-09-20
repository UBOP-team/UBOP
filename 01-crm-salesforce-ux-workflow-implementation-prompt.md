# UBOP — MODULE 01 CRM
## Implementation Prompt for AI Agent
### Reference UX/Workflow: Salesforce Lightning Experience
### Scope Lock: CRM only — do not start OMS, ERP, BI, or Workflow Automation

---

# 0. MANDATORY EXECUTION RULE

You are implementing **only the CRM module of UBOP**.

You MUST NOT begin implementation of:
- OMS
- ERP
- BI
- Workflow Automation
- unrelated provider features
- unrelated global shell redesign

You may only touch shared/core code when CRM genuinely requires it.

When CRM satisfies all acceptance criteria and tests, STOP.

Do not continue to the next module.
Wait for a new explicit instruction.

Execution order:

1. Read all project context files.
2. Inspect the current codebase and existing conventions.
3. Produce a CRM-only implementation plan.
4. Implement one CRM slice at a time.
5. Add tests for every meaningful slice.
6. Run build/lint/type-check/test gates.
7. Update context/progress documentation.
8. Report CRM completion and remaining CRM gaps.
9. STOP.

---

# 1. ROLE

Act as a **Senior Enterprise Product Designer + Senior Frontend Engineer + Senior Backend Engineer**.

The UX/workflow reference for this module is **Salesforce Lightning Experience**.

Borrow these Salesforce interaction principles:
- object list views,
- filterable saved views,
- record workspaces,
- highlights panels,
- activity timeline,
- related records,
- lead qualification,
- lead conversion,
- opportunity stages,
- Path-style stage progression,
- opportunity Kanban,
- quick actions,
- contextual actions,
- role-aware access.

Do NOT create a generic CRUD CRM.

Do NOT copy Salesforce branding, logos, illustrations, proprietary visual assets, trademarks, exact colors, or pixel-for-pixel screens.

Clone:
- workflow logic,
- information hierarchy,
- interaction model,
- navigation model,
- enterprise density,
- action hierarchy,
- record organization,
- error/recovery patterns.

Keep UBOP's own typography, spacing, design tokens, iconography, and visual identity.

---

# 2. PRODUCT GOAL

The CRM module must support the commercial relationship lifecycle:

```text
Lead
  ↓ qualify
Account + Contact
  ↓
Opportunity
  ↓ progress through stages
Won / Lost
  ↓
future downstream handoff
```

The CRM must answer these questions quickly:
- Who are our prospects?
- Which leads require follow-up?
- Which companies are active customers?
- Who are the contacts inside each company?
- Which opportunities are open?
- What stage is each deal in?
- What should the sales rep do next?
- What happened previously with this relationship?
- Which provider is the record connected to?
- Is provider sync healthy?
- Who changed the record and when?

This module is a **sales work environment**, not an address book.

---

# 3. CANONICAL CRM DOMAIN MODEL

Use UBOP canonical entities independent of provider implementation.

## 3.1 Lead

A Lead is an unqualified prospect.

Required baseline fields:

```text
id
organization_id
owner_id

first_name
last_name
company_name
job_title

email
phone

source
status

estimated_value
notes

provider_reference
sync_status

created_at
updated_at
```

Recommended statuses:

```text
NEW
CONTACTED
QUALIFYING
QUALIFIED
UNQUALIFIED
CONVERTED
```

Rules:
- Converted Leads no longer behave like open editable leads.
- Status transitions create audit/activity history.
- Provider sync state is separate from lead status.

## 3.2 Account

An Account is a company/organization with which UBOP has a commercial relationship.

```text
id
organization_id
owner_id

name
account_type
industry

website
phone

billing_address
shipping_address

status
segment

provider_reference
sync_status

created_at
updated_at
```

Suggested account types:

```text
PROSPECT
CUSTOMER
PARTNER
SUPPLIER_RELATIONSHIP
OTHER
```

CRM primarily uses PROSPECT and CUSTOMER.

## 3.3 Contact

A Contact is a person associated with an Account.

```text
id
organization_id
account_id
owner_id

first_name
last_name
job_title
department

email
phone

is_primary

provider_reference
sync_status

created_at
updated_at
```

## 3.4 Opportunity

An Opportunity is a potential commercial deal.

```text
id
organization_id
account_id
owner_id

name
stage

amount
currency
probability

expected_close_date
actual_close_date

source
loss_reason

provider_reference
sync_status

created_at
updated_at
```

Default stages:

```text
PROSPECTING
QUALIFICATION
DISCOVERY
PROPOSAL
NEGOTIATION
CLOSED_WON
CLOSED_LOST
```

Stage configuration must be sufficiently data-driven to evolve later.
Do not duplicate hardcoded stage labels across components.

## 3.5 Opportunity Contact Role

An opportunity can involve multiple contacts.

```text
id
opportunity_id
contact_id
role
is_primary
```

Example roles:

```text
DECISION_MAKER
INFLUENCER
CHAMPION
PROCUREMENT
TECHNICAL_CONTACT
OTHER
```

## 3.6 Activity

Use one consistent activity model to power timelines.

Activity types:

```text
TASK
CALL
EMAIL
MEETING
NOTE
SYSTEM_EVENT
```

Fields:

```text
id
organization_id

subject
type
status

account_id?
contact_id?
lead_id?
opportunity_id?

owner_id
due_at?
completed_at?

body
metadata

created_at
```

Human activities and system events must be visually distinguishable.

---

# 4. CRM INFORMATION ARCHITECTURE

Inside the persistent UBOP shell:

```text
CRM
├── Overview
├── Leads
├── Accounts
├── Contacts
├── Opportunities
└── Activities
```

Rules:
- Do not add extra navigation categories without product requirements.
- Preserve last useful CRM subpage when reasonable.
- Tabs are local to a record; they are not global CRM navigation.

---

# 5. CRM OVERVIEW

Reference principle: a Salesforce-style sales workspace prioritizes active selling and next actions over decorative analytics.

## 5.1 Purpose

The CRM Overview is a **sales command surface**.

It must answer:
- What needs my attention?
- How large is my open pipeline?
- Which deals are at risk?
- What changed recently?
- What should I do next?

It must NOT be a collection of generic KPI cards.

## 5.2 Desktop layout

```text
CRM / Overview                                [Date range ▾]

┌─────────────────────────────────────────────────────────────┐
│ Pipeline value | Open opportunities | New leads | Due today │
└─────────────────────────────────────────────────────────────┘

┌───────────────────────────────────┬─────────────────────────┐
│ Pipeline by Stage                 │ My Work                 │
│ Prospecting      8   ₫420M        │ overdue activities      │
│ Qualification    6   ₫310M        │ leads to follow up      │
│ Discovery        4   ₫220M        │ deals needing action    │
│ Proposal         3   ₫170M        │                         │
│ Negotiation      2   ₫130M        │                         │
└───────────────────────────────────┴─────────────────────────┘

┌───────────────────────────────────┬─────────────────────────┐
│ Opportunities at risk             │ Recent activity         │
│ table/list                         │ timeline                │
└───────────────────────────────────┴─────────────────────────┘
```

## 5.3 KPI rules

Allowed summaries:
- Open pipeline value
- Open opportunity count
- Leads created in selected period
- Activities due/overdue
- Win rate if data quality is sufficient

Every summary must be actionable.

Example:

```text
Open Opportunities: 36
```

Clicking it opens the matching filtered Opportunity view.

Do not create dead metric cards.

## 5.4 Pipeline visualization

Use a compact stage summary, funnel, or equivalent operational visualization.

Selecting a stage navigates/filters to that stage.

Do not use decorative 3D charts or non-actionable graphics.

---

# 6. UNIVERSAL CRM LIST VIEW PATTERN

Leads, Accounts, Contacts, and Opportunities share a mature list-view system inspired by Salesforce Lightning list views.

## 6.1 Required anatomy

```text
Leads                                               [+ New Lead]

[ My Open Leads ▾ ]   [Pin]              [Table/Kanban if supported]

Search this view...

[Filters] [Sort] [Columns] [Refresh] [More]

☐ Name           Company       Status       Owner      Last activity
☐ Minh Nguyen    ABC Co        Contacted    Huy        Yesterday
☐ Lan Tran       Delta Ltd     New          Lan        Never

Selected: 2          [Assign owner] [Change status] [More]
```

## 6.2 Baseline saved views

### Leads
- My Open Leads
- All Open Leads
- New Leads
- Leads Requiring Follow-up
- Converted Leads

### Accounts
- My Accounts
- Active Customers
- Prospects
- Recently Updated

### Contacts
- My Contacts
- All Contacts
- Primary Contacts
- Recently Added

### Opportunities
- My Open Opportunities
- All Open Opportunities
- Closing This Month
- At Risk
- Closed Won
- Closed Lost

MVP may ship system-defined views before user-created views.
Architecture must not prevent user-created views later.

## 6.3 Filter drawer

```text
Filters

Owner
[Me]

Stage
[Proposal] [Negotiation]

Amount
[>=] [100,000,000]

Close Date
[This Quarter]

[Reset]                     [Apply]
```

Requirements:
- active filters are visible as chips/tokens,
- easy reset,
- multiple filters combine predictably,
- URL/search params preserve useful shareable state,
- no full-page navigation just to edit filters.

## 6.4 Column controls

Provide sensible defaults and user-configurable visible columns where useful.

Rules:
- identity column stays near left,
- important status/business fields follow,
- provider/sync columns are secondary unless operationally needed,
- sticky headers for long tables,
- sticky first identity column when table width warrants it.

## 6.5 Bulk actions

Bulk action bar appears only after selection.

Examples:
- Assign owner
- Change status
- Export
- Add tag if tagging exists

Do not permanently occupy table header space with bulk actions.

---

# 7. LEADS — EXACT UX

## 7.1 Leads index

Default columns:

```text
Lead
Company
Status
Source
Owner
Last Activity
Created
```

Optional:
- Email
- Phone
- Estimated Value
- Provider
- Sync Status

Primary action:
`+ New Lead`

## 7.2 Lead creation

Use a right drawer only if the form remains compact; otherwise full-page creation.

Fields:

```text
First Name
Last Name *
Company *
Email
Phone
Lead Source
Owner
Status
Estimated Value
Notes
```

Validation:
- last name required,
- company required,
- valid email,
- inline field errors,
- preserve entered data after failed submission.

## 7.3 Lead record page

```text
← Leads

Minh Nguyen
ABC Packaging
Contacted

[Log Activity] [Convert Lead] [More ▾]

Highlights
Owner           Huy Nguyen
Email           ...
Phone           ...
Source          Website
Estimated value ₫120M
Last activity   Yesterday

Progress Path
[New] — [Contacted] — [Qualifying] — [Qualified] — [Converted]

Tabs
[ Activity ] [ Details ] [ Related ]
```

### Activity tab

At top:

```text
[Log Call] [New Task] [Meeting] [Note]
```

Below:
Activity Timeline.

### Details tab

Sections:
- Lead Information
- Contact Information
- Qualification
- System / Provider Information

### Related tab

Keep future-compatible related records here.
Do not add fake data or unrelated modules.

---

# 8. LEAD STATUS WORKFLOW

Primary progression:

```text
NEW
 ↓
CONTACTED
 ↓
QUALIFYING
 ↓
QUALIFIED
 ↓
CONVERT
```

Alternative:

```text
QUALIFYING
 ↓
UNQUALIFIED
```

Rules:
- move status from Path or explicit transition action,
- every transition writes a system activity/audit entry,
- converted lead cannot silently return to open,
- qualification fields may become mandatory before conversion.

Recommended conversion prerequisites:

```text
last_name
company
valid owner
status == QUALIFIED
```

---

# 9. LEAD CONVERSION WORKFLOW

This is a critical flow.

A Salesforce-like conversion transforms a qualified Lead into Account + Contact and optionally an Opportunity.

## 9.1 Entry

For Qualified lead:

```text
[Convert Lead]
```

Prefer requiring Qualified state before conversion.

## 9.2 Conversion wizard

### Step 1 — Account

```text
Account

○ Create new account
  Account name: ABC Packaging

○ Use existing account
  [Search accounts...]
```

Duplicate hint:

```text
Possible match found:
ABC Packaging Co.
[Use existing]
```

Never silently create duplicate accounts.

### Step 2 — Contact

```text
Contact

○ Create new contact
  Minh Nguyen
  minh@...

○ Use existing contact
  [Search contacts...]
```

### Step 3 — Opportunity

```text
Opportunity

[x] Create opportunity

Name
ABC Packaging — 2026 Supply Contract

Amount
₫120,000,000

Expected close
...

Initial stage
Qualification
```

Allow explicit `Do not create opportunity` if supported by product scope.

### Step 4 — Review

```text
Lead
Minh Nguyen

Will become:

Account
ABC Packaging

Contact
Minh Nguyen

Opportunity
ABC Packaging — 2026 Supply Contract
₫120M
Qualification

[Back]                         [Convert]
```

## 9.3 Success state

```text
Lead converted

✓ Account: ABC Packaging
✓ Contact: Minh Nguyen
✓ Opportunity: Supply Contract

[Open Opportunity] [Open Account]
```

System activity:

```text
Lead converted by Huy Nguyen
Created Account, Contact, Opportunity
```

## 9.4 Failure behavior

Conversion must be transactional.

If conversion fails mid-process:
- rollback partial writes,
- preserve wizard input,
- explain the failure,
- allow retry,
- do not leave orphaned Account/Contact/Opportunity records.

---

# 10. ACCOUNTS — CUSTOMER 360

## 10.1 Accounts index

Default columns:

```text
Account
Type
Segment
Owner
Open Opportunities
Pipeline Value
Last Activity
```

Optional:
- Industry
- Phone
- Provider
- Sync

## 10.2 Account record header

```text
Acme Corporation
Customer · Enterprise

[Log Activity] [New Opportunity] [New Contact] [More ▾]

Highlights
Owner           Lan
Open Pipeline   ₫240M
Contacts        6
Last activity   3 days ago
Provider        Internal CRM
Sync            Healthy
```

## 10.3 Tabs

```text
[ Overview ] [ Activity ] [ Contacts ] [ Opportunities ] [ Related ]
```

### Overview

Two-column desktop layout.

Left:
- Account details
- commercial summary

Right:
- key contacts
- relationship summary
- next activity

### Activity
Shared CRM activity timeline.

### Contacts
Embedded related-list table.

### Opportunities
Related opportunities table.

### Related
Keep future module relations abstract.
Do not import OMS/ERP implementations into CRM.

---

# 11. CONTACTS

## 11.1 Contacts index

Columns:

```text
Contact
Account
Job Title
Email
Phone
Owner
Last Activity
```

## 11.2 Contact record

```text
Linh Tran
Procurement Manager at Acme Corporation

[Log Activity] [New Opportunity] [More]
```

Tabs:

```text
Overview | Activity | Opportunities | Related
```

Account association must be visually prominent.
Do not duplicate all Account data inside Contact.

---

# 12. ACTIVITY TIMELINE

Use one consistent timeline component across Lead, Account, Contact, and Opportunity.

## 12.1 Timeline grouping

```text
Upcoming
Overdue
Today
Earlier This Week
September 2026
Older
```

Avoid one endless undifferentiated feed.

## 12.2 Human activity example

```text
Call completed
Today · 10:35

Huy Nguyen called Minh Nguyen

"Discussed pricing and expected Q4 order volume."

Related:
Opportunity: 2026 Supply Contract
```

## 12.3 System event example

```text
Stage changed
Yesterday · 16:20

Proposal → Negotiation
Changed by Lan Tran
```

Human activity and system history use different visual treatment.

## 12.4 Activity composer

Quick actions:

```text
Log Call
Create Task
Schedule Meeting
Add Note
```

The form is context-aware.
Launching from Opportunity auto-associates that Opportunity.

---

# 13. OPPORTUNITIES — CORE SALES WORKSPACE

Opportunity is the most important CRM record.

It must center:
- highlights,
- stage path,
- current stage guidance,
- activity composer,
- activity timeline,
- related contacts.

## 13.1 Opportunities index — Table mode

Columns:

```text
Opportunity
Account
Stage
Amount
Probability
Expected Close
Owner
Last Activity
```

Primary action:
`+ New Opportunity`

View switch:
`Table | Kanban`

---

# 14. OPPORTUNITY KANBAN

Implement stage-based Kanban based on the active opportunity list view.

```text
Prospecting       Qualification      Discovery       Proposal
₫420M · 8         ₫310M · 6          ₫220M · 4       ₫170M · 3

┌─────────────┐   ┌─────────────┐
│ Acme Supply │   │ Delta Deal  │
│ ₫120M       │   │ ₫80M        │
│ Acme Corp   │   │ Delta Ltd   │
│ Close 30/9  │   │ Close 3/10  │
└─────────────┘   └─────────────┘
```

Requirements:
- columns = stages,
- header = record count,
- optionally sum Amount,
- current list filters remain active,
- cards show useful fields only,
- drag/drop changes stage,
- transition validation still applies,
- failed transition rolls card back,
- show clear error reason,
- provide keyboard/non-drag alternative.

---

# 15. OPPORTUNITY RECORD

```text
← Opportunities

Acme — 2026 Supply Contract
Negotiation

[Log Activity] [Edit] [Mark Stage Complete] [More ▾]

Highlights
Account         Acme Corporation
Amount          ₫240M
Probability     70%
Expected Close  30 Sep 2026
Owner           Huy Nguyen

Stage Path
[Prospecting]—[Qualification]—[Discovery]—[Proposal]—[Negotiation]—[Won/Lost]

Current Stage Guidance
Key fields:
- Final quote
- Decision maker
- Expected close

Suggested next actions:
- Confirm purchasing approval
- Schedule pricing review

Tabs
[ Activity ] [ Details ] [ Contacts ] [ Related ]
```

---

# 16. OPPORTUNITY STAGE PATH

## 16.1 Visual behavior

- completed stages distinct,
- current stage emphasized,
- future stages neutral,
- Closed Won/Lost terminal states explicit.

## 16.2 Stage metadata

Each stage can define:
- required fields,
- recommended fields,
- guidance,
- suggested next actions.

Example:

### Qualification
Required:
- Account
- Amount
- Expected Close

Guidance:
- confirm need,
- confirm commercial fit,
- identify primary contact.

### Proposal
Required:
- Amount
- Primary Contact

### Negotiation
Required:
- Expected Close
- Decision Maker contact role

### Closed Lost
Required:
- Loss Reason

## 16.3 Transition UX

If fields are missing, show a stage-transition panel before changing stage:

```text
Move to Proposal

Complete required information:

Amount              ✓
Primary Contact     Missing
Expected Close      ✓

[Cancel]            [Update & Move]
```

Never update stage and then surprise user with a generic error.

---

# 17. CLOSED WON / CLOSED LOST

## Closed Won

```text
Mark opportunity as Won?

Amount
₫240M

Close date
20 Sep 2026

[Cancel] [Mark Won]
```

On success:
- stage = CLOSED_WON,
- actual_close_date recorded,
- system activity created,
- emit domain event such as `OpportunityWon`,
- DO NOT implement OMS behavior in this CRM phase.

No direct CRM import of OMS code.

## Closed Lost

Require:

```text
Loss reason *
- Price
- Competitor
- Timing
- Budget
- No decision
- Other

Notes
```

Then close.

---

# 18. OPPORTUNITY CONTACT ROLES

Opportunity page displays involved contacts.

```text
Contacts

Name          Role              Primary
Linh Tran     Decision Maker    ✓
Minh Pham     Technical         -
```

Actions:
- Add Contact
- Change Role
- Set Primary
- Remove

Do not model this as one `contact_id` on Opportunity.

---

# 19. PROVIDER / SYNC UX INSIDE CRM

Possible CRM providers:
- Internal CRM
- Salesforce
- HubSpot
- Custom CRM Provider

Users manage CRM records first.
Integration detail is secondary context.

## 19.1 Record provenance

```text
Provider
Salesforce

Connection
Salesforce — APAC Sales

External ID
006xx000...

Last sync
2 minutes ago

Sync status
Healthy
```

## 19.2 Business state != sync state

Never merge these.

```text
Opportunity Stage
Negotiation

Sync Status
Failed
```

## 19.3 Sync error banner

```text
Salesforce sync failed

Your CRM changes are saved in UBOP.
The external provider has not received the latest update.

Reason:
Connection token expired.

[Reconnect] [Retry sync] [View details]
```

Local business work must not disappear because provider sync failed.

---

# 20. CRM SEARCH

Search across:
- Leads
- Accounts
- Contacts
- Opportunities

Example:

```text
Search: "Acme"

Accounts
Acme Corporation
Customer · Owner: Lan

Contacts
Linh Tran
Procurement Manager · Acme Corporation

Opportunities
Acme — 2026 Supply Contract
Negotiation · ₫240M
```

Result identity must be understandable without opening the record.

---

# 21. PERMISSIONS

Minimum conceptual roles:

## Sales Representative
- read permitted CRM records,
- create leads,
- edit owned/allowed leads and opportunities,
- log activities,
- convert authorized leads.

## Sales Manager
- representative permissions,
- team visibility,
- assign owner,
- manage pipeline,
- broader CRM access.

## Admin
- CRM configuration,
- provider-level controls where authorized.

Rules:
- do not display enabled controls that will always fail,
- use read-only states for read-only permission,
- destructive/admin actions clearly separated.

---

# 22. EMPTY STATES

## No Leads

```text
No leads yet

Leads are potential customers that have not been qualified.

[Create Lead]
```

If appropriate:

```text
[Create Lead] [Connect CRM Provider]
```

## No Opportunities

```text
No open opportunities

Create an opportunity for an existing account or convert a qualified lead.

[New Opportunity]
```

Never use only `No data`.

---

# 23. LOADING STATES

Use:
- page skeleton on initial load,
- row skeletons for table loading,
- local progress indicator for mutation,
- background sync indicator for provider sync.

Do not blank the full page during:
- filter changes,
- timeline refresh,
- provider retry,
- local inline edit.

---

# 24. ERROR STATES

Every error communicates:
1. What failed?
2. What was preserved?
3. Why, if known?
4. What can the user do next?

Example:

```text
Could not move opportunity to Proposal.

Your opportunity is unchanged.
A primary contact is required for the Proposal stage.

[Add Contact]
```

---

# 25. DESTRUCTIVE ACTIONS

Require confirmation for:
- destructive deletes,
- irreversible lifecycle actions where applicable,
- sensitive provider disconnect actions if surfaced here.

Do not use confirmation dialogs for ordinary safe actions.

---

# 26. RESPONSIVE BEHAVIOR

CRM is desktop-first.

Desktop:
- full tables,
- multi-column record layout,
- Kanban,
- timeline + details where appropriate.

Tablet:
- collapsed sidebar,
- fewer default columns,
- right-side context moves below main content,
- drawers remain usable.

Mobile:
- record lookup,
- quick lead/contact creation,
- activity logging,
- stage viewing,
- simple stage transition,
- quick call/email actions.

Do not squeeze full large-screen Kanban onto narrow mobile.
Use a stage/list fallback.

---

# 27. ACCESSIBILITY

Mandatory:
- semantic headings,
- visible form labels,
- keyboard navigation,
- visible focus states,
- screen-reader labels for icon buttons,
- sufficient contrast,
- Kanban stage changes possible without drag/drop,
- status never communicated by color alone,
- field errors linked to their fields.

---

# 28. FRONTEND COMPONENT INVENTORY

Expected reusable CRM components:

```text
CRMOverview
CRMResourceIndex
SavedViewSelector
FilterDrawer
ColumnSelector
BulkActionBar

RecordHeader
HighlightsPanel
RecordTabs

StagePath
StageTransitionPanel

ActivityComposer
ActivityTimeline
ActivityItem

OpportunityKanban
OpportunityCard

RelatedList
ProviderProvenance
SyncStatus
SyncErrorBanner

LeadConversionWizard
ContactRoleTable
```

Do not over-generalize before repeated patterns are proven.

---

# 29. CLIENT DATA/STATE RULES

Use the project-standard data layer.

Rules:
- server state belongs to query/cache layer,
- local UI state remains local,
- filters belong in URL where shareable/useful,
- do not copy server entities into global UI store without need,
- invalidate only affected queries,
- optimistic updates only where safe rollback exists.

For Kanban drag/drop:
- optimistic update is allowed only with reliable rollback and predictable validation,
- otherwise show a pending transition state.

---

# 30. BACKEND BOUNDARIES

CRM route flow:

```text
CRM API
  ↓
Application Service
  ↓
Domain Model / Domain Service
  ↓
Repository Contract
  ↓
Infrastructure Repository
```

Provider flow:

```text
CRM Application
  ↓
CRM Provider Port
  ↓
Provider Adapter
```

Do not call Salesforce/HubSpot/custom-provider clients directly inside route handlers or domain entities.

---

# 31. EXPECTED API CAPABILITIES

Adapt URLs to current project conventions, but preserve these capabilities:

```text
GET    /crm/leads
POST   /crm/leads
GET    /crm/leads/{id}
PATCH  /crm/leads/{id}
POST   /crm/leads/{id}/activities
POST   /crm/leads/{id}/convert
POST   /crm/leads/{id}/transition

GET    /crm/accounts
POST   /crm/accounts
GET    /crm/accounts/{id}
PATCH  /crm/accounts/{id}

GET    /crm/contacts
POST   /crm/contacts
GET    /crm/contacts/{id}
PATCH  /crm/contacts/{id}

GET    /crm/opportunities
POST   /crm/opportunities
GET    /crm/opportunities/{id}
PATCH  /crm/opportunities/{id}
POST   /crm/opportunities/{id}/transition
POST   /crm/opportunities/{id}/close-won
POST   /crm/opportunities/{id}/close-lost

GET    /crm/opportunities/{id}/contact-roles
POST   /crm/opportunities/{id}/contact-roles

GET    /crm/activities
POST   /crm/activities
```

Do not create redundant APIs if current architecture already provides an equivalent pattern.

---

# 32. TESTING REQUIREMENTS

CRM cannot be declared complete without tests.

## 32.1 Unit/domain tests

### Lead
- create valid Lead
- reject invalid required data
- valid status transition
- invalid transition
- converted Lead restrictions

### Lead Conversion
- create Account + Contact + Opportunity
- select/link existing Account
- select/link existing Contact if supported
- rollback transaction on failure
- final Lead state = Converted

### Opportunity
- valid stage progression
- validation failure when required fields missing
- Closed Won stores actual close date
- Closed Lost requires loss reason
- emits OpportunityWon domain event

### Activity
- associates to correct CRM object
- meaningful lifecycle transition generates system event

### Provider
- local mutation preserved when external sync is retryable
- sync state stored separately from business state

## 32.2 API integration tests

Cover:
- list/filter,
- detail,
- create/update,
- conversion,
- stage transitions,
- permission denial,
- validation errors,
- organization/tenant isolation.

## 32.3 Frontend/component tests

Critical components:
- LeadConversionWizard
- StagePath
- OpportunityKanban transition behavior
- Filter state
- ActivityTimeline
- permission read-only behavior
- sync error banner

## 32.4 E2E happy path

```text
Create Lead
 ↓
Log Call
 ↓
Move Lead to Qualified
 ↓
Convert Lead
 ↓
Create Account + Contact + Opportunity
 ↓
Open Opportunity
 ↓
Advance stages
 ↓
Close Won
```

Assert:
- records created correctly,
- timeline reflects changes,
- navigation is coherent,
- final state is correct.

---

# 33. PERFORMANCE

Index pages:
- pagination/cursor strategy,
- no full activity history per row,
- avoid N+1 queries,
- debounce search,
- cache stable configuration data.

Record pages:
- critical identity/header/details load first,
- related lists may lazy-load,
- timeline paginates/progressively loads.

---

# 34. VISUAL RULES

Use UBOP design system.

Do:
- dense professional tables,
- clear spacing between information groups,
- restrained semantic badges,
- one obvious primary action per context,
- consistent icon set,
- strong identity/status hierarchy.

Do NOT:
- wrap every area in giant rounded cards,
- use arbitrary gradients,
- use excessive shadows,
- use glassmorphism,
- center-align operational tables,
- create decorative hero headers,
- use KPI cards as a substitute for real information architecture.

---

# 35. STRICT IMPLEMENTATION ORDER

## CRM-01 — Domain & API Foundation
- entities/models
- migrations
- repositories
- services
- validation schemas
- baseline tests

Suggested commit:
`feat(crm): establish core domain foundation`

STOP and verify before next slice.

## CRM-02 — Leads
- Leads index
- create Lead
- Lead record page
- details
- status Path
- Activity Timeline integration

Suggested commit:
`feat(crm): implement lead management workflow`

STOP and verify.

## CRM-03 — Lead Conversion
- duplicate-aware Account selection
- Contact creation/selection
- optional Opportunity creation
- transactional conversion
- conversion result UI

Suggested commit:
`feat(crm): add transactional lead conversion`

STOP and verify.

## CRM-04 — Accounts & Contacts
- Account index
- Account 360 record
- related Contacts
- related Opportunities
- Contact index/detail

Suggested commit:
`feat(crm): add account and contact workspaces`

STOP and verify.

## CRM-05 — Opportunities
- index
- create/detail
- Stage Path
- stage validation
- Closed Won/Lost
- Contact Roles

Suggested commit:
`feat(crm): implement opportunity sales lifecycle`

STOP and verify.

## CRM-06 — Opportunity Kanban
- table/kanban switch
- stage grouping
- amount summary
- drag/drop
- accessible alternate transition
- rollback/error handling

Suggested commit:
`feat(crm): add opportunity pipeline kanban`

STOP and verify.

## CRM-07 — CRM Overview
- actionable summaries
- pipeline visualization
- work queue
- at-risk opportunities
- recent activity

Suggested commit:
`feat(crm): add sales command overview`

STOP and verify.

## CRM-08 — Provider / Sync UX
- provider provenance
- sync state
- sync error banner
- retry affordance
- separate provider status from business status

Suggested commit:
`feat(crm): surface provider sync state`

STOP and verify.

## CRM-09 — Hardening
- permissions
- tenant isolation
- empty/loading/error states
- accessibility
- responsive fallback
- performance review
- full E2E flow
- update project context

Split commits by concern. Examples:

`fix(crm): enforce ownership and permission guards`

`test(crm): cover end-to-end sales lifecycle`

`docs(context): record crm interaction architecture`

Do not combine unrelated hardening work into one oversized commit.

---

# 36. DEFINITION OF DONE — CRM

## Product
- [ ] Leads can be created and managed.
- [ ] Lead status lifecycle is clear.
- [ ] Lead conversion works end-to-end.
- [ ] Accounts have a useful 360 workspace.
- [ ] Contacts work within Accounts.
- [ ] Opportunities use stage-driven workflow.
- [ ] Closed Won/Lost flows are explicit.
- [ ] Opportunity Contact Roles work.
- [ ] Activity Timeline is shared across CRM records.
- [ ] Opportunity Kanban works.
- [ ] CRM Overview surfaces actionable work.

## UX
- [ ] Every index has useful filters and hierarchy.
- [ ] Every record has identity, status, highlights, and contextual actions.
- [ ] Complex workflows are not reduced to generic CRUD modals.
- [ ] Empty/loading/error states exist.
- [ ] Business state and provider sync state are separate.
- [ ] Permission states render correctly.
- [ ] Mobile fallback exists for critical CRM work.
- [ ] Keyboard/accessibility behavior is tested.

## Engineering
- [ ] CRM domain boundaries respected.
- [ ] No direct dependency on OMS/ERP/BI implementation.
- [ ] Provider access goes through ports/adapters.
- [ ] Tests pass.
- [ ] Build passes.
- [ ] Lint passes.
- [ ] Type checks pass.
- [ ] Migrations valid.
- [ ] Tenant isolation tested.
- [ ] Context/progress docs updated.

---

# 37. FINAL AGENT CHECK BEFORE EVERY SCREEN

Before implementing each CRM screen, answer internally:

```text
User job:
Primary object:
Reference Salesforce pattern:
Primary action:
Secondary actions:
Business states:
Provider/sync states:
Permissions:
Loading state:
Empty state:
Error state:
Next navigation destination:
```

If one is unclear, inspect project context before coding.

Do not invent decorative UI to fill space.

Do not proceed to OMS, ERP, BI, or Workflow Automation.

When the CRM module passes its Definition of Done, report:
1. completed CRM slices,
2. tests executed,
3. remaining CRM limitations,
4. architecture decisions made,
5. context files updated.

Then STOP and wait for the next module instruction.
