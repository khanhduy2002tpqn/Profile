# Summer Camp Digital Portfolio SaaS System

A premium, multi-tenant (SaaS) Digital Portfolio platform designed for Summer Camp organizations. Built with Next.js, NestJS, Tailwind CSS, Prisma, and PostgreSQL.

## 🚀 Quick Start Guide

### 1. Database Setup (Prisma & Supabase)

Get a PostgreSQL connection string from your Supabase project (both Session/Transaction URL for pooled connections, and Direct URL for migrations).

1. Go to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Create or configure your `backend/.env` file with the Supabase connection strings:
   ```env
   # PostgreSQL connection urls
   DATABASE_URL="postgres://postgres.xxxx:your-password@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=10"
   DIRECT_URL="postgres://postgres.xxxx:your-password@aws-0-us-east-1.pooler.supabase.com:5432/postgres"

   # JWT secret key for CMS admin auth
   JWT_SECRET="generate-a-secure-random-secret-key"

   # Backend URL (used for local uploads relative paths)
   BACKEND_URL="http://localhost:5000"
   FRONTEND_URL="http://localhost:3000"

   # Optional Cloud Storage (Leave blank to use local fallback directory: /uploads)
   CLOUDINARY_CLOUD_NAME=""
   CLOUDINARY_API_KEY=""
   CLOUDINARY_API_SECRET=""
   AWS_S3_BUCKET=""
   AWS_ACCESS_KEY_ID=""
   AWS_SECRET_ACCESS_KEY=""
   AWS_REGION=""
   ```
3. Run migrations to initialize the PostgreSQL schema:
   ```bash
   npx prisma migrate dev --name init
   ```
4. Seed the database with the default tenant organization, active season, and administrator credentials:
   ```bash
   npx prisma db seed
   ```
   * **Default Admin Account:** `admin@summercamp.com`
   * **Default Admin Password:** `admin123`

---

### 2. Run the Development Servers

#### Backend API (NestJS)
Runs on [http://localhost:5000/api](http://localhost:5000/api)
```bash
cd backend
npm run start:dev
```

#### Frontend Dashboard & Portfolio (Next.js)
Runs on [http://localhost:3000](http://localhost:3000)
```bash
cd frontend
npm run dev
```

---

## 📂 Project Directory Structure

```
├── backend/                  # NestJS REST API Backend
│   ├── prisma/
│   │   ├── schema.prisma     # Prisma PostgreSQL Models
│   │   └── seed.ts           # Seeding script (default admin, active season)
│   ├── src/
│   │   ├── auth/             # JWT, Guard & Decorators logic
│   │   ├── season/           # Multi-season management CRUD
│   │   ├── student/          # Student CRUD, Album, Cert, Projects, Awards
│   │   ├── import/           # Bulk xlsx parsing & zip file extractor mapping
│   │   ├── storage/          # Cloudinary/S3 Client upload with local disk fallback
│   │   ├── prisma.service.ts
│   │   └── main.ts           # Bootstrap (CORS, Static upload serving, prefix)
│   └── uploads/              # Local storage fallback directory
│
├── frontend/                 # Next.js App Router Frontend
│   ├── public/               # static assets (favicon, robots.txt disallows)
│   └── src/
│       ├── app/
│       │   ├── page.tsx      # Public search page (CampID lookups)
│       │   ├── p/[publicId]/ # Public Portfolio page (noindex, scrapbook, slide download)
│       │   └── cms/
│       │       ├── login/    # Admin portal login
│       │       ├── layout.tsx# Sidebar, season picker Context wrapper
│       │       ├── dashboard/# Dashboard reports & recharts distributions
│       │       ├── students/ # CRUD list & detailed tabbed profile manager
│       │       ├── seasons/  # Active season picker toggle and CRUD
│       │       └── import/   # Real-time ZIP extraction validation terminal log
│       └── lib/
│           └── api.ts        # Custom fetch wrapper with authorization injection
```

---

## 📦 Bulk Import Template Specification

### 1. Metadata Sheet (Excel/CSV)
The Excel or CSV template sheet should contain the following columns:
* **CampID** (e.g., `SC2026-CAMP001`)
* **FullName** (e.g., `Nguyễn Văn A`)
* **Age** (e.g., `12`)
* **Hometown** (e.g., `Hà Nội`)

### 2. Assets ZIP Structure
Prepare all assets at the root directory of your ZIP archive named using the `{CampID}_` prefix to trigger auto-matching:
- **Avatar:** `{CampID}_avatar.jpg`
- **Certificate:** `{CampID}_cert.png`
- **Scrapbook Album Photos:** `{CampID}_act_01.jpg`, `{CampID}_act_02.jpg`, etc.
- **Projects Cover Image:** `{CampID}_proj01_cover.jpg`
- **Projects Slide File:** `{CampID}_proj01.pptx`
- **Projects PDF Document:** `{CampID}_proj01.pdf`
- **Awards Certificate:** `{CampID}_award01.png`
