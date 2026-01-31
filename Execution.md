**Allsee LicenseGuard - Execution Plan & Architecture**

1. Project Overview
LicenseGuard is a centralized License Management & Renewal Hub designed specifically for the Digital Signage industry. It solves the critical "Service Disruption" problem where expired licenses cause screens to go black, impacting revenue and compliance.

The solution addresses the Parent/Child Organizational Constraint  by separating "Visibility" (for local Site Managers) from "Payment Authority" (for HQ Finance Admins).
+1

Core Objectives
Zero Downtime: Prevent screens from going black via Proactive Alerts & Grace Periods.


Hierarchical Control: Enforce strict permissions where Child Orgs can request renewals, but only Parent Orgs can pay.
+1

Efficiency: Introduce "Co-Terming" to consolidate 50 scattered invoices into 1 annual payment.

2. Technical Architecture (PERN Stack)
Backend (/server)
Runtime: Node.js + Express (TypeScript)

Database: PostgreSQL (Neon Tech)

ORM: Prisma (Schema-first design)

Authentication: JWT (JSON Web Tokens) with Role-Based Access Control (RBAC).

Frontend (/client)
Framework: React + Vite (TypeScript)

Styling: Tailwind CSS (ShadCN UI or similar component library recommended).

State Management: React Query (TanStack Query) for efficient server-state syncing.

3. Database Design (Prisma Schema)

Strict enforcement of the Parent/Child hierarchy required by the challenge.

Code snippet
// This schema must be applied to server/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// 1. Organization Hierarchy
// Supports infinite nesting, but we focus on 2 levels: HQ (Parent) -> Site (Child)
model Organization {
  id            String         @id @default(uuid())
  name          String
  type          OrgType        @default(CHILD) // PARENT or CHILD
  billingMode   BillingMode    @default(END_USER_CAN_PAY) // Reseller Constraint
  
  // Hierarchy Logic
  parentId      String?
  parent        Organization?  @relation("OrgHierarchy", fields: [parentId], references: [id])
  children      Organization[] @relation("OrgHierarchy")

  // Relations
  devices       Device[]
  users         User[]
  renewalRequests RenewalRequest[]
}

// 2. Users (RBAC)
model User {
  id             String       @id @default(uuid())
  email          String       @unique
  password       String       // Hashed
  name           String
  role           UserRole     @default(VIEWER) 
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])
}

// 3. The Digital Signage Assets
model Device {
  id             String        @id @default(uuid())
  name           String        // e.g., "Reception Screen"
  location       String        // e.g., "Building A, Floor 1"
  serialNumber   String        @unique
  
  // License State Machine
  licenseKey     String?
  status         LicenseStatus @default(ACTIVE)
  expiryDate     DateTime
  
  organizationId String
  organization   Organization  @relation(fields: [organizationId], references: [id])

  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt
}

// 4. The Communication Layer (Child -> Parent)
model RenewalRequest {
  id             String        @id @default(uuid())
  createdAt      DateTime      @default(now())
  status         RequestStatus @default(PENDING)
  
  // Who asked for it?
  requesterOrgId String
  requesterOrg   Organization  @relation(fields: [requesterOrgId], references: [id])
  
  // Optional: Link to specific devices if partial renewal
  notes          String?
}

// Enums
enum OrgType {
  PARENT
  CHILD
}

enum BillingMode {
  END_USER_CAN_PAY
  RESELLER_ONLY
}

enum UserRole {
  ADMIN
  VIEWER
}

enum LicenseStatus {
  ACTIVE         // Green (> 60 days)
  EXPIRING_SOON  // Amber (< 60 days)
  EXPIRED        // Red (Grace Period Active)
  SUSPENDED      // Black Screen (Service Cut)
}

enum RequestStatus {
  PENDING
  APPROVED
  REJECTED
}
4. Feature Implementation Roadmap
Phase 1: The "Traffic Light" Dashboard (Visibility)
Goal: Provide instant visual clarity on fleet health.

Backend:

Endpoint GET /api/dashboard/stats: Returns counts of Active, Warning, and Critical devices.

Logic: Filter devices based on user's Org ID. If Parent, aggregate all child devices.

Frontend:

Timeline Visualization: A horizontal bar chart showing upcoming expiries by month (e.g., "March: 50 Licenses Expiring").

Map View: (Bonus) Use Leaflet/Google Maps to show pins for Child Orgs. Red Pin = Site with expired licenses.

Phase 2: The Logic Engine (State Machine)
Goal: Automate the transition between Active -> Warning -> Grace Period -> Suspended.

Implementation:

Create a Cron Job (using node-cron) that runs every night at 00:00.

Job 1 (Warning): Find devices expiring in 60 days → Update status to EXPIRING_SOON → Send Email Alert.

Job 2 (Grace Period): Find devices where expiryDate < Today → Update status to EXPIRED. Do not suspend yet.

Job 3 (Suspension): Find devices where expiryDate < Today - 14 Days → Update status to SUSPENDED.

Phase 3: The "Request & Renew" Loop (The Core Requirement)

Goal: Solve the Parent/Child permission constraint.
+1

Child Org Experience:

Login as Site Manager.

View "Red" devices.

Restriction: "Pay" button is hidden/disabled.

Action: Click "Request Renewal". This triggers POST /api/renewal-request.

Feedback: Toast notification: "Request sent to HQ."

Parent Org Experience:

Login as HQ Admin.

Notification: "New Renewal Request from London Store."

Action: Click "Approve & Pay".

Result: Updates device expiryDate + 1 Year. Closes the Request ticket.

Phase 4: Advanced Features (Winning Factors)
A. "Co-Terming" / Bulk Consolidation
Why this wins: It solves a massive real-world finance headache.

Feature: Allow the Parent Admin to select 50 devices with different expiry dates (Jan, March, Dec).

Action: "Align All to End of Year".

Math: Calculate pro-rated cost for the gap period.

Result: All 50 devices now expire on Dec 31st. Next year, it's one single invoice.

B. Auto-Failover "Grace Token"
Why this wins: It shows empathy for "Service Disruption".

Feature: If a payment fails or is missed, the system injects a temporary "7-Day Grace Token" automatically.

UI: The dashboard shows a countdown: "Grace Period Active: 6 Days remaining until blackout."

C. Reseller Policy Toggle

Why this wins: Shows understanding of Allsee's B2B model.

Feature: In the Admin Settings, a toggle for Billing Mode.

Mode A (Direct): End-user sees pricing and Stripe checkout.

Mode B (Managed): End-user sees "Contact Reseller" button (checkout hidden).

5. API Endpoints Specification
Authentication
POST /api/auth/login - Returns JWT with orgId, role, and orgType (Parent/Child).

GET /api/auth/me - Validates token.

Devices
GET /api/devices - Smart filter based on hierarchy.

POST /api/devices/bulk-renew - Parent Only. Accepts array of IDs. Updates expiry.

POST /api/devices/co-term - Parent Only. Aligns dates.

Requests
POST /api/requests - Child Only. Creates a "nag" to the parent.

GET /api/requests - Parent Only. See all incoming requests from sites.

6. Deployment & Demo Strategy
Seed Data is Key: The seed.ts script must generate a "Crisis Scenario" (lots of red/amber alerts) so the demo immediately shows value.

Role Switching: Implement a simple "Switch User" dropdown in the frontend header (Dev Mode only) to quickly jump between "HQ Admin" and "London Store Manager" to show both sides of the workflow during the presentation.