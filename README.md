# Summer Camp Digital Portfolio Unified System

A premium, multi-tenant (SaaS) Digital Portfolio platform designed for Summer Camp programs. This is a unified Next.js application containing both the frontend user interfaces and serverless backend API routes (Route Handlers). It is optimized for 1-click serverless deployment on **Vercel** and connects to **Supabase (PostgreSQL)**, **Cloudinary (Images)**, and **AWS S3 (Slides/PDFs)**.

---

## 🚀 Deployment Instructions

### 1. Frontend & Backend API Deployment (Vercel)

1. Import your GitHub repository **`khanhduy2002tpqn/Profile`** on Vercel.
2. In the project configuration:
   * **Framework Preset:** `Next.js` (automatically detected).
   * **Root Directory:** select **`frontend`**.
3. Configure the following **Environment Variables** in Vercel Project Settings:
   * `DATABASE_URL`: *Your Supabase PostgreSQL pooled database connection string* (e.g. `postgres://postgres.xxxx:...:6543/postgres?pgbouncer=true`).
   * `JWT_SECRET`: *A secure random string* (used to sign CMS administrator session tokens).
   * `FRONTEND_URL`: *Your deployed Vercel domain* (e.g., `https://profile-summercamp.vercel.app`).
   * `CLOUDINARY_CLOUD_NAME`: *Cloudinary cloud identifier*.
   * `CLOUDINARY_API_KEY`: *Cloudinary credentials API key*.
   * `CLOUDINARY_API_SECRET`: *Cloudinary credentials API secret*.
   * `AWS_S3_BUCKET`: *Your AWS S3 bucket name*.
   * `AWS_ACCESS_KEY_ID`: *AWS credentials access key ID*.
   * `AWS_SECRET_ACCESS_KEY`: *AWS credentials secret access key*.
   * `AWS_REGION`: *AWS region of your bucket (e.g., `us-east-1`)*.
4. Click **Deploy**. Vercel will automatically build and serve your public portfolio lookups and CMS endpoints.

---

## 💻 Local Development Setup

To run the application locally on your machine:

1. Navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Create a `.env` file with your database connection strings:
   ```env
   # PostgreSQL connection string for Prisma
   DATABASE_URL="postgres://postgres.xxxx:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres"

   # JWT secret for token signatures
   JWT_SECRET="generate-a-secure-random-secret-key"

   # Environment domain references
   FRONTEND_URL="http://localhost:3000"

   # Optional Cloud Storage (Leave blank to use local fallback directory: public/uploads)
   CLOUDINARY_CLOUD_NAME=""
   CLOUDINARY_API_KEY=""
   CLOUDINARY_API_SECRET=""
   AWS_S3_BUCKET=""
   AWS_ACCESS_KEY_ID=""
   AWS_SECRET_ACCESS_KEY=""
   AWS_REGION=""
   ```
3. Generate the Prisma Client locally:
   ```bash
   npx prisma generate
   ```
4. Apply the migrations to setup tables:
   ```bash
   npx prisma migrate dev --name init
   ```
5. Seed the database with the default tenant organization (`summer-camp`), season (`SC2026`), and administrator credentials (`admin@summercamp.com` / `admin123`):
   ```bash
   npx prisma db seed
   ```
6. Start the local Next.js development server on [http://localhost:3000](http://localhost:3000):
   ```bash
   npm run dev
   ```

---

## 📂 Project Directory Structure

```
├── frontend/                 # Next.js Serverless Project
│   ├── prisma/
│   │   ├── schema.prisma     # Prisma PostgreSQL schema
│   │   ├── seed.ts           # DB Seeder script (organization, admin, seasons)
│   │   └── tsconfig.json     # Isolated seeder compiler settings
│   ├── public/               # Static assets & robots.txt Crawler exclusions
│   │   └── uploads/          # Local uploads fallback directory
│   └── src/
│       ├── app/
│       │   ├── page.tsx      # Public search page (CampID lookups)
│       │   ├── p/[publicId]/ # Public Portfolio viewer (scrapbook lightbox, projects)
│       │   ├── api/          # Serverless Route Handlers
│       │   │   ├── auth/     # CMS Login & Profile tokens
│       │   │   ├── seasons/  # Season CRUD & Active public lookups
│       │   │   ├── students/ # Student CRUD & Portfolio resource uploads
│       │   │   ├── import/   # Bulk Excel sheet parser & ZIP extractor
│       │   │   └── dashboard/# Stats metrics calculations
│       │   └── cms/          # Admin Control Panel pages (Dashboard, CRUD list, Imports)
│       └── lib/
│           ├── api.ts        # Relative path fetch wrapper
│           ├── auth.ts       # JWT header claims validator
│           ├── prisma.ts     # Global PrismaClient instantiator with pg adapter
│           └── storage.ts    # Cloudinary & S3 uploads manager
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
