# RoomKhoj — Direct-Owner Room Rental Marketplace

**"Find Your Perfect Room. Without Roaming Around."**

RoomKhoj is a production-oriented full-stack room rental marketplace designed for **Prayagraj, Uttar Pradesh, India** (supporting ADA, Naini, Civil Lines, Teliarganj, Jhunsi, Allahpur, Katra, Tagore Town, and surrounding localities). It connects room seekers directly with property owners — **with zero brokerage**, clear owner-stated tenant preferences, and mandatory admin moderation before any listing goes live.

---

## Core Business Rules & Features

- **Direct Owners Only (Zero Brokers):** Only direct property owners can publish listings. Brokers and agents are barred, brokerage is locked at `₹0`, and suspicious listings can be reported for swift moderation.
- **No Mandatory Login to Browse or Contact:** Room seekers can search, inspect photos, view tenant rules, and directly **Call** or **WhatsApp** property owners without creating an account.
- **Admin Approval Workflow:** Every newly submitted or edited property enters `pending` status until reviewed and approved by an administrator.
- **"Who Can Rent This Property?" (Tenant Preferences):** Clear owner-stated eligibility covering Tenant Types (Students, Families, Working Professionals, Bachelors, Couples, Any Tenant), Gender Preference (Girls Only, Boys Only, Any Gender), Occupancy, Food Preference, and House Rules — with automatic contradiction prevention on both frontend and backend.
- **7-Step Owner Listing Wizard:** Multi-step form with progress bar, validation, local & database draft saving, up to 10 validated photos (JPEG/PNG/WEBP, max 5 MB), cover photo selection, and submission confirmation.
- **Server-Side Search & GeoJSON Nearby Localities:** Fast MongoDB-indexed search across 17+ filters, sorting (newest, lowest rent, highest rent), pagination, active filter chips, and `2dsphere` nearby locality suggestions.
- **Owner Dashboard:** Animated stats, view/call/WhatsApp click analytics, status tabs, availability toggling (`available` / `rented`), and edit/delete controls with strict ownership verification.
- **Admin Moderation Console:** Role-gated admin panel to inspect full property details (including private house/flat numbers), approve/reject with reason, review reports, suspend suspicious owners, and manage cities & localities.
- **SEO & Performance:** SEO-friendly property slugs (`/rooms/:slug`), dynamic Open Graph metadata, `/sitemap.xml`, `robots.txt`, Cloudinary URL auto-optimization, route code-splitting, skeletons, and `prefers-reduced-motion` support.

---

## Tech Stack

| Layer | Technologies |
| --- | --- |
| **Frontend** | React 19, Vite, Tailwind CSS v4, React Router v7, React Hook Form, Framer Motion, Lucide React, Axios |
| **Backend** | Node.js, Express.js, Mongoose (MongoDB Atlas), Zod, JWT, bcryptjs, Helmet, CORS, Express Rate Limit |
| **Media & Verification** | Cloudinary v2 SDK + Multer (strict MIME & size validation), Optional Twilio SMS OTP adapter |

---

## Project Structure

```text
RoomKhoj/
├── client/          # React + Vite frontend (Vercel-ready)
├── server/          # Express + Mongoose backend (Render-ready)
├── render.yaml      # Render deployment blueprint
└── README.md
```

---

## Local Setup & Installation

### Prerequisites
- Node.js `v20+` (tested on `v24.13.1`)
- A **MongoDB Atlas** cluster URI (or local MongoDB)
- A **Cloudinary** account for production image hosting

### 1. Install Dependencies
```bash
cd server && npm install
cd ../client && npm install
```

### 2. Configure Environment Variables

Copy the templates and fill in your credentials:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

#### `server/.env`
| Variable | Required | Description |
| --- | --- | --- |
| `NODE_ENV` | Yes | `development` or `production` |
| `PORT` | No | Default `5000` |
| `CLIENT_URL` | Yes | Allowed frontend origin(s), comma-separated (e.g., `http://localhost:5173` or `https://roomkhoj.vercel.app`) |
| `PUBLIC_API_URL` | Yes | Public backend URL (e.g., `http://localhost:5000` or `https://roomkhoj-api.onrender.com`) |
| `MONGO_URI` | Yes | MongoDB Atlas connection string |
| `JWT_SECRET` | Yes | Strong random secret (32+ chars) |
| `JWT_EXPIRES_IN` | No | Default `7d` |
| `STORAGE_PROVIDER` | Yes | `cloudinary` (required in production) or `local` (dev-only fallback) |
| `CLOUDINARY_CLOUD_NAME` | If `cloudinary` | Your Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | If `cloudinary` | Your Cloudinary API key |
| `CLOUDINARY_API_SECRET` | If `cloudinary` | Your Cloudinary API secret |
| `OTP_PROVIDER` | Optional | Leave empty if unconfigured, or set `twilio` |
| `TWILIO_ACCOUNT_SID` | If `twilio` | Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | If `twilio` | Twilio Auth Token |
| `TWILIO_PHONE_NUMBER` | If `twilio` | Twilio sender phone number |
| `ADMIN_NAME` / `ADMIN_MOBILE` / `ADMIN_PASSWORD` | Seed only | Used by `npm run seed` to bootstrap the initial admin account |

> **Note on OTP & External Services:** RoomKhoj never fakes OTP verification or cloud uploads. If `OTP_PROVIDER` is unset, `/api/auth/send-otp` returns `503` and `phoneVerified` stays `false` until a real SMS provider is configured. If `STORAGE_PROVIDER=cloudinary` is set without credentials, photo uploads return a clear `503` configuration error.

#### `client/.env`
| Variable | Description |
| --- | --- |
| `VITE_API_URL` | Backend API base URL (e.g., `http://localhost:5000/api` locally, or `https://your-render-service.onrender.com/api` in production) |

### 3. Seed Prayagraj Localities & Admin Account
Once `MONGO_URI` is set in `server/.env`:

```bash
cd server
# Seeds Prayagraj localities + Admin account only (recommended for production)
npm run seed

# Optional: also seed sample Prayagraj listings for pilot testing
npm run seed -- --with-samples
```

---

## Development Commands

### Standard Development (with MongoDB Atlas)
```bash
# Terminal 1 — Backend API (http://localhost:5000)
cd server
npm run dev

# Terminal 2 — Frontend App (http://localhost:5173)
cd client
npm run dev
```

### Quick Local Preview (Before Setting Up MongoDB Atlas)
To preview the full application locally using an ephemeral in-memory MongoDB instance with seeded Prayagraj data:
```bash
# Terminal 1 — Backend with local ephemeral MongoDB (Admin: 9999999999 / Admin@1234)
cd server
npm run dev:memory

# Terminal 2 — Frontend
cd client
npm run dev
```

### Automated End-to-End API & Security Verification
```bash
cd server
npm run test:api
```

### Production Frontend Build
```bash
cd client
npm run build
```

---

## Deployment Guide

### 1. Database — MongoDB Atlas
1. Create a free M0 or dedicated cluster on [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Create a database user and whitelist Render's outbound IPs (or `0.0.0.0/0` with strong credentials).
3. Copy the SRV connection string into `MONGO_URI`.
4. Run `npm run seed` once against the Atlas URI to seed Prayagraj localities and your admin account.

### 2. Image Storage — Cloudinary
1. Create a Cloudinary account and copy `Cloud Name`, `API Key`, and `API Secret`.
2. Set `STORAGE_PROVIDER=cloudinary` and the three `CLOUDINARY_*` variables on Render.

### 3. Backend — Render
1. Connect your repository to [Render](https://render.com) (uses `render.yaml` automatically, or create a Web Service with Root Directory `server`, Build Command `npm install`, Start Command `npm start`).
2. Configure all secret environment variables (`MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`, `PUBLIC_API_URL`, `CLOUDINARY_*`).
3. Verify health endpoint at `https://<your-service>.onrender.com/api/health`.

### 4. Frontend — Vercel
1. Import the repository into [Vercel](https://vercel.com) with **Root Directory** set to `client`.
2. Framework Preset: **Vite** (`client/vercel.json` is already configured for SPA client-side routing).
3. Set Environment Variable `VITE_API_URL=https://<your-render-service>.onrender.com/api`.
4. Deploy and update `CLIENT_URL` on Render to your live Vercel domain.
