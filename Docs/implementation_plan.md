# Implementation Plan - Technova Society MERN Stack Application

Build a production-grade **MERN Stack** (MongoDB, Express.js, React, Node.js) web application for **Technova Society** formatted for seamless deployment on **Vercel** with **MongoDB Atlas**. The interface will feature a dark theme, modern glassmorphic UI, responsive controls, and strict compliance with all form fields and workflows specified in `From Club End.md` and `From Our End (Flow).md`.

> [!NOTE]
> **Review Notes (Fixed)**: 11 issues identified and corrected — field conflation, missing files, schema gaps, incorrect Vercel serverless setup, missing seeder & CORS configuration, incorrect field types, and society/club access control with mandatory coordinator contact number.

---

## Architecture & Deployment Setup

- **Frontend**: React (Vite) styled with Vanilla CSS design system (Dark Theme, CSS Variables, glassmorphism, responsive cards, micro-animations).
- **Backend API**: Node.js & Express API configured as Vercel Serverless Functions (`/api`), connecting to MongoDB via Mongoose.
- **Database**: MongoDB Atlas (MongoDB Mongoose models with connection string stored in environment variable `MONGODB_URI`).
- **Branding Directory**: `images/` directory at the project root for uploading brand logos, favicons, and media assets.
- **Deployment**: Vercel configuration (`vercel.json`) linking frontend client build and API routes.

---

## MongoDB Atlas — Cluster Confirmed ✅

> [!IMPORTANT]
> **Cluster**: `technova.wsgnxei.mongodb.net`
> **DB User**: `adityatripathi7631_db_user`
> **Connection String** (stored in `.env` as `MONGODB_URI`):
> ```
> mongodb+srv://adityatripathi7631_db_user:7Ad9kPKtZlXZ41E4@technova.wsgnxei.mongodb.net/technova?retryWrites=true&w=majority
> ```
> This will be written to `.env` locally and set as a Vercel Environment Variable in project settings. **Never commit `.env` to git.**

> [!NOTE]
> **Vercel Environment Variables to set**:
> - `MONGODB_URI` — the full connection string above
> - `JWT_SECRET` — a strong random secret (e.g. `openssl rand -hex 32`)
> - `NODE_ENV=production`

---

## Strict Requirement & Field Breakdown

### 1. Form Fields (From `From Club End.md`)
- **Emp. ID** (`empId` - String, required)
- **Name** (`name` - String, required)
- **Email ID** (`email` - String, required)
- **Department** (`department` - String, required)
- **Club Name** (`clubName` - Dropdown, required)
- **Club Coordinator** (`clubCoordinator` - Autofilled based on selected club)
- **Event Name** (`eventName` - String, required)
- **Event Description** (`eventDescription` - Textarea, required)
- **Event Duration** (`eventDuration` - String, required)
- **Venue** (`venue` - String, required)
- **Resource Requirement Checklist** *(each carries status: Pending / Approved / Rejected, independently reviewable by Approver)*:
  - `itPerson`: Checkbox
  - `discipline`: Checkbox
  - `operations`: Checkbox
  - `bannerPrintings`: Checkbox
  - `food`: Checkbox
  - `canopy`: Checkbox → conditionally shows **`canopyCount`** (Number, required if canopy is checked) — *"Canopy Count (If Selected Yes)"*
  - `chairs`: Checkbox → conditionally shows **`chairsCount`** (Number, required if chairs is checked) — *"No of Chairs Required"*
  - `electrician`: Checkbox *(standalone, carries full Pending/Approved/Rejected status — was previously missing status tracking)*
  - `additionalMediaCoverage`: Checkbox *(marked with "Approval Required" badge — higher scrutiny flag)*

> [!IMPORTANT]
> **Fix #1 — Field Separation (was conflated)**: `Additional Society Requirement` and `Select Society` are TWO separate fields in the spec:
> - **`additionalRequirement`**: Free-text Textarea — *"Additional Society Requirement"* (open text input)
> - **`selectedSocieties`**: Multiselect Dropdown — *"Select Society (Dropdown) (Multiselect)"* (select from seeded societies list in DB)

### 2. Workflows & Dashboard Roles (From `From Our End (Flow).md`)
1. **Club Coordinator Portal**:
   - Register Event Request -> Backend saves event & generates **4-digit Event ID** (e.g. `1024`).
   - Track Event Status by 4-digit ID or Email -> View live status of each resource requirement (Approved / Rejected / Pending), attached feedback notes, and assigned Authority Contact Card.
   - Email notification payload simulation sent to student email upon status changes.

2. **Approver / Authority Portal**:
   - Logged-in view for pre-seeded authority emails:
     - `amrit.mangla@technova.com`
     - `aditya.tripathi@technova.com`
     - `Pooja.mam@technova.com`
   - Granular Itemized Review: Approve or Reject *each checkbox item* individually.
   - Attach feedback comments for individual items or overall event.
   - Assign Team Member for further discussion (generates Contact Card shown on student tracker).
   - Log all decisions automatically into Audit Logs.
   - **📅 Calendar View** *(New Feature)*:
     - Full interactive calendar showing all submitted events plotted by their event date.
     - Colour-coded by status: Pending (amber), Approved (green), Rejected (red), In Review (blue).
     - Clicking a date/event opens a side panel with the full event details and quick-action approve/reject buttons.
     - Month, Week, and Day view modes.
   - **📢 Next-Day Event Update Posting** *(New Feature)*:
     - Approvers can post a **"Next-Day Update"** for any approved event or scheduled meeting.
     - Update types: `Event Reminder`, `Meeting Notice`, `Venue Change`, `Time Change`, `Cancellation`, `General Announcement`.
     - Update is visible to the Club Coordinator in their tracker view and is timestamped with the posting approver's name.
     - Coordinators are notified (update visible on their 4-digit ID tracker page) when an update is posted for their event.

3. **Admin Command Center**:
   - Admin Login: `Admin.admin@technova.com`
   - Authority Access & Security: Change authority account passwords, add/remove authority credentials.
   - Team Member Directory: Add/remove team members with full contact info (Name, Role, Email, Phone) to be assigned by approvers.
   - **Societies & Clubs Manager** *(Admin-only — no approver or public access)*:
     - **Add Club**: Requires all three coordinator fields simultaneously:
       - `coordinatorName` — Full name (required)
       - `coordinatorEmail` — Email address (required)
       - `coordinatorPhone` — Contact number (required)
     - **Remove Club/Society**: Soft-delete (marks `isActive: false`) so existing event submissions referencing that club remain intact in history.
     - Clubs added here immediately appear in the Club Name dropdown on the Coordinator submission form, with coordinator autofilled.
   - Dynamic Form Field Configurator: Create new form fields or toggle existing ones.
   - System Activity Audit Log: Full audit trail of all approvals, rejections, feedback comments, field changes, and login attempts.

> [!IMPORTANT]
> **Access Control — Societies & Clubs**: The `/api/admin/clubs` endpoints (`GET`, `POST`, `PATCH`, `DELETE`) are protected by **both** `auth.js` (valid JWT) **and** `requireRole('admin')` middleware. Approver-role JWTs will receive `403 Forbidden`. The Club dropdown on the public Coordinator form fetches only via a dedicated read-only public endpoint `/api/clubs` (no auth required, returns only active clubs).

---

## Database Schemas (Mongoose / MongoDB)

1. **`EventRequest` Schema**:
   - `eventId`: String (4-digit, zero-padded, unique, indexed — e.g. `"0047"`, generated server-side atomically)
   - `empId`, `name`, `email`, `department`
   - `clubName`: String (from SocietyClub dropdown)
   - `clubCoordinator`: String (autofilled server-side from SocietyClub lookup)
   - `eventName`, `eventDescription`, `eventDuration`, `venue`
   - `resources`: Object with **9 keys** matching all checkboxes:
     ```
     {
       itPerson:              { checked, status, feedback },
       discipline:            { checked, status, feedback },
       operations:            { checked, status, feedback },
       bannerPrintings:       { checked, status, feedback },
       food:                  { checked, status, feedback },
       canopy:                { checked, status, feedback, count },
       chairs:                { checked, status, feedback, count },
       electrician:           { checked, status, feedback },
       additionalMediaCoverage: { checked, status, feedback }
     }
     ```
   - `additionalRequirement`: String (free-text textarea — *Fix #1*)
   - `selectedSocieties`: [String] (array of society names from multiselect — *Fix #1, separate field*)
   - `overallStatus`: `'Pending' | 'In Review' | 'Partially Approved' | 'Approved' | 'Rejected'`
   - `assignedContact`: `{ memberId: ObjectId ref TeamMember, name, role, email, phone }` (Contact Card)
   - `reviewedBy`: String (approver email who actioned)
   - `overallFeedback`: String
   - `timestamps` (createdAt, updatedAt)

2. **`User` Schema** *(Fix #2 — pre-seeded via seeder script)*:
   - `name`, `email`, `passwordHash` (bcrypt), `role`: `'admin' | 'approver'`, `isActive`: Boolean
   - **Pre-seeded accounts** (seeded via `api/scripts/seed.js`):
     - `amrit.mangla@technova.com` / role: `approver`
     - `aditya.tripathi@technova.com` / role: `approver`
     - `Pooja.mam@technova.com` / role: `approver`
     - `Admin.admin@technova.com` / role: `admin`

3. **`TeamMember` Schema** *(Fix #3 — assignable contact cards)*:
   - `name`, `role`, `email`, `phone`, `department`, `isActive`: Boolean

4. **`SocietyClub` Schema** *(Fix #4 + Fix #11 — coordinator phone now required, all coordinator fields mandatory)*:
   - `societyName`: String, required
   - `clubName`: String, required, unique
   - `coordinatorName`: String, **required** (must be provided when club is created)
   - `coordinatorEmail`: String, **required** (used for autofill on submission form)
   - `coordinatorPhone`: String, **required** (contact number — new mandatory field)
   - `isActive`: Boolean, default `true` (soft-delete on removal, preserves history)
   - `timestamps`

5. **`FormField` Schema** *(Admin-configurable dynamic fields)*:
   - `fieldKey`: String (unique slug), `fieldLabel`, `fieldType` (`'text'|'textarea'|'checkbox'|'dropdown'|'multiselect'`), `required`, `options`: [String], `enabled`, `order`

6. **`AuditLog` Schema** *(Fix #5 — added actorRole for audit clarity)*:
   - `timestamp`, `actorEmail`, `actorRole`, `action` (e.g. `'APPROVE_ITEM'|'REJECT_ITEM'|'ASSIGN_CONTACT'|'PASSWORD_RESET'|'LOGIN'|'ADD_MEMBER'`), `targetEventId`, `details`: String

7. **`EventUpdate` Schema** *(New — Next-Day Update Posts by Approvers)*:
   - `eventId`: ObjectId ref `EventRequest` (or null for standalone meeting updates)
   - `updateType`: Enum `['Event Reminder', 'Meeting Notice', 'Venue Change', 'Time Change', 'Cancellation', 'General Announcement']`
   - `title`: String, required
   - `message`: String, required
   - `targetDate`: Date, required (the date this update is about — typically next day)
   - `postedBy`: String (approver email), required
   - `postedByName`: String (approver display name)
   - `visibleToEventId`: String (4-digit event ID — links update to coordinator tracker view)
   - `timestamps`

---

## Proposed File Structure

```
Technova/
├── images/                          # Branding Assets — upload custom logo/favicon here
│   ├── logo.svg                     # Default SVG logo (replace with your brand)
│   └── favicon.svg                  # Default SVG favicon (replace with your brand)
│
├── api/                             # Node.js + Express Backend (Vercel Serverless)
│   ├── config/
│   │   └── db.js                    # Mongoose MongoDB Atlas connection (uses MONGODB_URI)
│   ├── middleware/
│   │   ├── auth.js                  # JWT verification middleware
│   │   └── requireRole.js           # Role guard: 'admin' | 'approver'
│   ├── models/
│   │   ├── EventRequest.js
│   │   ├── User.js
│   │   ├── TeamMember.js
│   │   ├── SocietyClub.js
│   │   ├── FormField.js
│   │   ├── AuditLog.js
│   │   └── EventUpdate.js           # Next-Day Update posts by approvers
│   ├── routes/
│   │   ├── auth.js                  # POST /login, POST /change-password
│   │   ├── events.js                # POST /submit, GET /track/:id or ?email=
│   │   ├── approver.js              # GET /queue, PATCH /review/:id, POST /assign, GET /calendar, POST /updates
│   │   ├── admin.js                 # CRUD: users, team, clubs, form-fields, audit-logs
│   │   └── clubs.js                 # Public GET /api/clubs (no auth, active only)
│   ├── scripts/
│   │   └── seed.js                  # One-time seeder: creates 4 authority accounts
│   └── index.js                     # Express app with CORS config, route mounting
│
├── client/                          # React (Vite) Frontend
│   ├── public/
│   │   └── favicon.svg              # Symlinked or copied from /images/
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js             # Axios instance with JWT interceptor
│   │   ├── context/
│   │   │   └── AuthContext.jsx      # Auth state, login/logout, token persistence
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── ProtectedRoute.jsx   # Role-based route guard
│   │   │   ├── EventCard.jsx
│   │   │   ├── ContactCard.jsx      # Displayed in tracker when approver assigns member
│   │   │   ├── StatusBadge.jsx      # Pending (amber) / Approved (green) / Rejected (red)
│   │   │   ├── ResourceChecklist.jsx # Reusable checkbox group for form + review
│   │   │   ├── CalendarView.jsx     # Interactive calendar with event plotting
│   │   │   ├── EventUpdatePanel.jsx # Side panel for posting next-day updates
│   │   │   └── Toast.jsx            # Success/Error notification system
│   │   ├── pages/
│   │   │   ├── Login.jsx            # Shared login page (routes to correct dashboard by role)
│   │   │   ├── CoordinatorPortal.jsx   # Dashboard 1: Submit form + Track by ID or Email
│   │   │   ├── ApproverWorkspace.jsx   # Dashboard 2: Queue + Calendar + Next-Day Updates
│   │   │   └── AdminDashboard.jsx      # Dashboard 3: Full control panel
│   │   ├── styles/
│   │   │   └── theme.css            # CSS design tokens, glassmorphism, animations
│   │   ├── App.jsx                  # React Router v6 routing
│   │   └── main.jsx
│   ├── vite.config.js               # Proxy /api → backend in dev (Fix #10)
│   └── package.json
│
├── .env.example                     # Template: MONGODB_URI, JWT_SECRET, PORT
├── vercel.json                      # Vercel build & serverless rewrite rules (Fix #10)
├── package.json                     # Root scripts: dev, build, seed
└── README.md                        # Local dev + Vercel deployment guide
```

---

## Proposed Changes

### 1. Branding Assets Directory
#### [NEW] images/logo.svg
#### [NEW] images/favicon.svg

---

### 2. Backend — Config, Middleware & Seeder
#### [NEW] api/config/db.js — MongoDB Atlas connection with retry logic
#### [NEW] api/middleware/auth.js — JWT `Authorization: Bearer` verification
#### [NEW] api/middleware/requireRole.js — Role guard (`admin` / `approver`)
#### [NEW] api/scripts/seed.js — Idempotent seeder for 4 authority accounts + default clubs

> [!IMPORTANT]
> **Fix #6 & #7**: Auth middleware and role guard were completely absent from the previous plan. These are critical for protecting Approver and Admin routes. The seeder script is needed so authority passwords can be set before deployment without manual DB insertion.

---

### 3. Backend — Models (Mongoose)
#### [NEW] api/models/EventRequest.js
#### [NEW] api/models/User.js
#### [NEW] api/models/TeamMember.js
#### [NEW] api/models/SocietyClub.js — includes `coordinatorEmail` for autofill
#### [NEW] api/models/FormField.js
#### [NEW] api/models/AuditLog.js — includes `actorRole`

---

### 4. Backend — Routes
#### [NEW] api/routes/auth.js — `POST /api/auth/login`, `POST /api/auth/change-password`
#### [NEW] api/routes/events.js — `POST /api/events/submit`, `GET /api/events/track/:eventId`, `GET /api/events/track-by-email?email=`
#### [NEW] api/routes/approver.js — `GET /api/approver/queue`, `PATCH /api/approver/review/:eventId`, `POST /api/approver/assign-contact/:eventId`
#### [NEW] api/routes/admin.js — Full CRUD for users, team members, societies/clubs, form fields; `GET /api/admin/audit-logs`
- `POST /api/admin/clubs` — Create club; **validates `clubName`, `coordinatorName`, `coordinatorEmail`, `coordinatorPhone` all present** (400 if any missing)
- `DELETE /api/admin/clubs/:id` — Soft-delete (sets `isActive: false`)
- `GET /api/admin/clubs` — Returns all clubs including inactive (admin view)

#### [NEW] api/routes/clubs.js (public read-only) — `GET /api/clubs` — Returns only `isActive: true` clubs for the Coordinator submission form dropdown (no auth)
#### [NEW] api/index.js — Express app, CORS config (Fix #8), route mounting

> [!NOTE]
> **Fix #8 — CORS**: The Express server must whitelist the Vercel frontend domain in CORS config. During development, all origins are allowed; production restricts to `https://technova.vercel.app` (or your custom domain).

---

### 5. Frontend — Auth & API Layer
#### [NEW] client/src/api/axios.js — Axios instance with base URL + JWT `Authorization` header interceptor
#### [NEW] client/src/context/AuthContext.jsx — Login/logout, role detection, token in `localStorage`
#### [NEW] client/src/components/ProtectedRoute.jsx — Redirects unauthenticated or wrong-role users

> [!IMPORTANT]
> **Fix #9**: These three files were entirely absent from the previous plan. Without them, the Approver and Admin dashboards would be accessible to anyone. The `AuthContext` decodes the JWT role to route users to the correct dashboard after login.

---

### 6. Frontend — UI Components & Pages
#### [NEW] client/src/components/Navbar.jsx
#### [NEW] client/src/components/ResourceChecklist.jsx — Shared checkbox group used in both submission form and approver review
#### [NEW] client/src/components/ContactCard.jsx — Displayed in Coordinator Tracker when a contact is assigned
#### [NEW] client/src/components/StatusBadge.jsx — Amber/Green/Red/Blue glow badges per item
#### [NEW] client/src/components/Toast.jsx — Success/error notification system
#### [NEW] client/src/pages/Login.jsx — Single login page, role-routes post-auth
#### [NEW] client/src/pages/CoordinatorPortal.jsx — Tab 1: Form submission | Tab 2: Track by 4-digit ID or Email
#### [NEW] client/src/pages/ApproverWorkspace.jsx — Event queue + per-item review + contact assignment
#### [NEW] client/src/pages/AdminDashboard.jsx — 4-tab admin panel: Users, Team, Clubs, Fields, Audit Log
#### [NEW] client/src/styles/theme.css
#### [NEW] client/src/App.jsx — React Router v6 with protected routes

---

### 7. Vercel Deployment Config
#### [NEW] vercel.json

> [!IMPORTANT]
> **Fix #10 — Vercel Config**: The `vercel.json` must correctly:
> - Build the Vite client from `client/` folder
> - Serve Express as a **single serverless function** at `api/index.js`
> - Add a rewrite rule: all `/api/**` → `/api/index.js`, all other routes → `/client/dist/index.html` (SPA catch-all)
> - Set `outputDirectory` to `client/dist`

#### [NEW] .env.example — Documents required env vars: `MONGODB_URI`, `JWT_SECRET`, `NODE_ENV`
#### [NEW] README.md — Step-by-step local setup and Vercel deployment guide

---

## Verification Plan

### Verification Checklist

| # | Test | Expected Result |
|---|------|-----------------|
| 1 | Run `npm run seed` | 4 authority accounts created in MongoDB, idempotent (no duplicates on re-run) |
| 2 | `POST /api/auth/login` with each authority credential | Returns JWT with role, redirects to correct dashboard |
| 3 | Submit full event form (all fields filled) | Returns `{ eventId: "0047" }`, stored in DB with all 9 resource fields |
| 4 | Submit form with Canopy checked but no count | Validation error returned — count required |
| 5 | `GET /api/events/track/0047` | Returns event with all resource statuses = `Pending` |
| 6 | Approver: Approve IT, Reject Canopy with feedback, assign Team Member | Per-item statuses updated, AuditLog entry created |
| 7 | `GET /api/events/track/0047` again | IT = `Approved`, Canopy = `Rejected` with feedback, Contact Card visible |
| 8 | Track by email: `GET /api/events/track-by-email?email=submitter@gmail.com` | Returns list of all events for that email |
| 9 | Admin: Change approver password | Password updated, old password rejected, new password accepted |
| 10 | Admin: Add team member, verify available in Approver assign dropdown | Appears in dropdown |
| 11 | Admin: Add Club without coordinator phone | `400 Bad Request` — all three coordinator fields are required |
| 11b | Admin: Add Club with all fields (name, email, phone) | Club appears in dropdown; coordinator name autofills on selection in submission form |
| 11c | Admin: Remove (soft-delete) a Club | Club disappears from Coordinator dropdown; existing events referencing it still show club name in history |
| 11d | Approver-role JWT hits `POST /api/admin/clubs` | `403 Forbidden` |
| 12 | Admin: View Audit Logs | All actions from steps 6, 9, 10, 11 are logged with actor email, role, timestamp |
| 13 | Non-approver JWT attempts to hit `/api/approver/queue` | `403 Forbidden` |
| 14 | `npm run build` from root | Vite builds client cleanly, no TypeScript or import errors |
| 15 | Deploy to Vercel, test `/api/events/track/0047` | Live API responds correctly from MongoDB Atlas |
