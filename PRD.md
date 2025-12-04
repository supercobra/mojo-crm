# PRD: Twenty-Clone CRM

**Author / Owner:** [Your Name or Team]  
**Date:** 2025-12-03  
**Version:** 0.1 (initial draft)  
**Status:** Draft / Internal

---

## 1. Purpose & Scope

### Purpose  
To build an open-source, self-hostable CRM system — inspired by the core value propositions of Twenty CRM — using a modern tech stack (React + Next.js + PostgreSQL). The goal is to deliver a lightweight but flexible CRM that gives full control over data and workflows, while maintaining a modern, simple UI/UX, suitable for small to mid-sized businesses, startups, or internal operations (e.g. manufacturing, support, SaaS).

### Why  
- To own data fully and avoid vendor lock-in — important for businesses like your SaaS Helpdesk, manufacturing, or supply-chain operations.  
- To have a CRM that can be extended or customized as your business needs evolve (custom data models, integrations, custom workflows).  
- To leverage a tech stack familiar to your team (React / Next.js / PostgreSQL / Docker), maximizing developer velocity and maintainability.  
- To provide a clean, modern, and user-friendly UI that supports productivity, not legacy-style clunky UI.

### Scope (MVP)  
Include core CRM functionality:

- Contacts (Persons)  
- Companies (Organizations)  
- Deals / Opportunities  
- Tasks & Notes  
- Custom data modeling (custom objects & fields)  
- Flexible views (Table / List, Kanban for Deals)  
- Basic RBAC (roles & permissions)  
- REST + GraphQL API for integration  
- CSV import/export for basic data migration  

Exclude (for MVP):

- Full ERP (inventory, accounting, payroll)  
- Marketing automation, email campaigns, advanced analytics  
- Multi-tenant SaaS hosting (single-tenant / self-hosting only)  
- Telephony / VoIP / built-in call features  
- Advanced sharing/permissions rules (field-level ACL)  

---

## 2. Success Metrics & Goals

- Support at least **10,000 contact/lead records** with acceptable performance.  
- CRUD operations (create/update/delete contact, company, deal, task) should complete within **< 200 ms** under typical load.  
- Provide **two view modes** for deals: **Table (list)** and **Kanban (pipeline)**.  
- Allow admin users to define at least **5 custom object types** (with custom fields of types: text, number, date, enum, relation).  
- Provide **REST + GraphQL APIs** for main objects (Contacts, Companies, Deals, Tasks/Notes, Custom Objects).  
- Implement **role-based access control** with at least three role levels: Admin, User, Read-only.  
- Ensure **usability**: a new user should be able to create a contact → create a deal → move the deal across stages → attach a note — in under **5 clicks** with no external documentation.  
- Codebase maintainability: build & deploy (dev) in under 5 minutes on a standard workstation; enforce code quality (TypeScript, linting, tests).

---

## 3. Personas / Target Users

| Persona | Role / Motivation |
|--------|------------------|
| Sales Rep (SMB / mid-size) | Manage leads, opportunities, deals; track follow-ups, tasks, and customer data. |
| Customer Support / Success Rep | Track customer contacts, companies; log interactions; manage support tasks/notes. |
| Small Business Owner / Manager | Oversight of sales pipeline; assign tasks; view deals; manage team permissions and roles. |
| Developer / Ops / Internal Integrator | Build internal integrations (e.g. with ERP, support backend), maintain hosting, extend data models. |
| Admin / IT Manager | Manage user roles, permissions, security, backups, deployment. |

---

## 4. User Scenarios / Flows

### Scenario: Lead → Opportunity → Deal  
- User adds a new Contact (or imports via CSV).  
- Associate Contact with a Company (existing or new).  
- Create a new Deal/Opportunity for that Company (optionally linked to a Contact).  
- Move Deal through different stages using Kanban (e.g. “Prospect → Proposal → Negotiation → Won / Lost”).  
- Attach notes or tasks to Contact, Company, or Deal (e.g. call scheduled, follow-up, reminders).  
- On deal closure — mark as Won or Lost; record relevant data (value, close date, final notes).

### Scenario: Custom Data Model (e.g. for Manufacturing Orders)  
- Admin defines a new custom object type (e.g. “FactoryOrder”) with fields: OrderID (string), ProductType (enum), Quantity (number), DeliveryDate (date), Status (enum), Attach to Company/Contact.  
- Sales or Ops user creates new FactoryOrder entries per customer, tracks throughout lifecycle (quote → production → shipped).  
- FactoryOrders show in list/table view; optionally filter/sort by status, date, company, custom fields.

### Scenario: Integration with External System  
- External backend (e.g. manufacturing ERP, support backend) calls GraphQL or REST API to create/update contacts or orders.  
- CRM reflects updated data; optionally triggers a webhook or task (e.g. notify sales, create follow-up).

### Scenario: Role-based Access Control  
- Admin assigns roles to users: e.g. Sales Rep (full CRUD), Support Rep (limited Deals access but full notes/tasks), Consultant (read-only access).  
- UI/API enforces permissions — users see only authorized data and can perform only allowed actions.

---

## 5. Functional Requirements (MVP)

### 5.1 Core Data Objects  

- **Contact**: first name, last name, emails, phones, custom fields, associated Company, associated Notes/Tasks.  
- **Company**: name, address, contact list, custom fields, associated Notes/Tasks, associated Deals.  
- **Deal / Opportunity**: title, associated Company (and optionally Contact), value (currency), stage, probability, close date, custom fields, associated Notes/Tasks.  
- **Task / Note**: free-form notes, tasks with due date, assigned user, status (open/closed), attached to any object (Contact, Company, Deal, Custom Object).  
- **Custom Objects & Fields**: admin UI to define new object types and custom fields (text, number, date, enum, boolean, relation to other objects).  

### 5.2 Views & UI / UX  

- **List / Table View**: for Contacts, Companies, Deals, Custom Objects. Columns configurable (including custom fields). Supports sorting, filtering, grouping.  
- **Kanban View**: for Deals / Opportunities — customizable pipeline stages. Drag-and-drop to move deals between stages.  
- **Global Search**: search across objects (Contacts, Companies, Deals, custom objects).  
- **Responsive UI**: desktop-targeted (mobile optional for MVP but desirable).  
- **Modern / Simple Design**: clean layout, minimal clutter, intuitive navigation.  
- **Keyboard / Productivity Shortcuts** (bonus).  

### 5.3 Authentication & Authorization  

- Sign up / Login (email + password)  
- Role-based permissions: Admin, User, Read-only (at minimum)  
- Admin console to manage users and roles  

### 5.4 API & Integrations  

- **REST API**: CRUD endpoints for core objects and custom objects.  
- **GraphQL API**: for flexible querying/mutations.  
- **Webhooks**: support external systems subscribing to events (e.g. object created/updated/deleted).  

### 5.5 Data Import / Export  

- CSV import for Contacts, Companies, Deals (basic).  
- CSV / JSON export for data backup or migration.  

### 5.6 Security & Data Integrity  

- Secure password storage (bcrypt or similar), HTTPS support.  
- Role-based access checks at backend and API level.  
- Audit log (who created/updated/deleted each object, timestamp).  
- Backup / restore process (via PostgreSQL dumps or similar).  

### 5.7 Performance & Scalability  

- Target acceptable response times (<200 ms) for CRUD operations in typical usage.  
- Database schema should handle tens of thousands of records, proper indexing on common queries.  
- Deployment via Docker / docker-compose (aligned with your existing dev-ops workflows).  

---

## 6. Non-functional Requirements & Tech Stack

- **Frontend:** React + Next.js, TypeScript, CSS (Tailwind or CSS-in-JS), modern component library.  
- **Backend:** Node.js (could use Next.js API routes or standalone server), TypeScript.  
- **Database:** PostgreSQL.  
- **API Layer:** GraphQL (e.g. Apollo) + REST.  
- **Auth & Security:** JWT or session-based auth; password hashing; role-based authorization.  
- **Deployment:** Docker / docker-compose for dev + prod; optional container orchestration for scale.  
- **Testing:** Unit tests, integration tests, E2E tests; static type checking, linting.  
- **Logging & Monitoring:** error logging, request logging, basic metrics (optionally integrate with monitoring tools).  
- **Documentation:** README, contribution guide, API docs, deployment guide.  

---

## 7. Timeline / High-Level Roadmap

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| Phase 1 – Architecture & Data Model | ~2 weeks | DB schema + metadata for custom objects; basic backend skeleton; auth system. |
| Phase 2 – Core CRUD + UI for Contacts/Companies/Deals | ~3–4 weeks | List & table views; CRUD screens; basic styling/layout. |
| Phase 3 – Kanban view, Tasks/Notes, Custom Objects UI | ~2–3 weeks | Kanban for deals; notes/tasks feature; admin UI for custom object definitions & custom fields. |
| Phase 4 – API + Import/Export + RBAC | ~2 weeks | REST & GraphQL APIs; CSV import/export; role & permission management. |
| Phase 5 – Deployment Setup, Testing, Documentation | ~2 weeks | Docker setup, tests, documentation, CI/ CD scripts. |
| Phase 6 – Internal Beta & Feedback | ~1–2 weeks | Internal release; gather feedback; UX refinements; bug fixes. |
| Phase 7 – v1.0 Release | – | Tag stable release; baseline for future features/expansions. |

Estimated total time: **~12–15 weeks** with a small 2-3 person team (frontend + backend + part-time design/ops).  

---

## 8. Risks, Assumptions & Open Questions

- **Custom-object metadata model complexity** — designing schema for arbitrary custom fields and relations is tricky and may require careful migration planning.  
- **Performance with large data + complex custom objects / relations** — needs indexing + possibly caching.  
- **UI/UX complexity** — exposing custom-object creation and customization without overwhelming users requires thoughtful UI design.  
- **Maintenance overhead** — custom CRM means long-term maintenance; need discipline (tests, docs, migrations).  
- **Security & data backup** — must establish good processes for backups, restore, role-management, secure hosting.  
- **Scope creep** — easy to keep adding features (ERP, marketing, analytics) — important to keep firm on MVP scope.  

---

## 9. Future / Stretch Goals (Post-MVP)

- Field-level permissions / sharing rules / granular ACLs  
- Advanced workflow/automation builder (e.g. chained triggers, conditional rules, scheduled tasks)  
- Integrations: email/calendar sync, support ticket system, marketing automation, ERP / inventory / manufacturing modules  
- Reporting & analytics dashboards (pipeline analytics, custom reports)  
- Multi-tenant / SaaS-ready architecture (if you want to offer CRM to external customers)  
- Mobile-optimized UI / responsive design / mobile app  
- White-labeling / theming  
- Audit history & versioning (track object history + rollback)  

---

## 10. Appendix / References  

- General guidance on what a PRD should include (purpose, features, scope, release criteria, timeline) :contentReference[oaicite:0]{index=0}  
- Best practices for using a PRD as a living, collaborative document across teams :contentReference[oaicite:1]{index=1}  

---


