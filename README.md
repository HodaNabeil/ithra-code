<p align="center">
  <img src="public/img/logo.png" alt="IthraCode Logo" width="180" />
</p>

<h1 align="center">IthraCode</h1>

<p align="center">
  <strong>A modern, full-featured Arabic learning platform for programming & web development</strong>
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#%EF%B8%8F-tech-stack">Tech Stack</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-project-structure">Structure</a> •
  <a href="#-environment-variables">Env Variables</a> •
  <a href="#-scripts">Scripts</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma" alt="Prisma" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Stripe-Payments-635BFF?logo=stripe&logoColor=white" alt="Stripe" />
  <img src="https://img.shields.io/badge/PostgreSQL-Neon-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Redis-Upstash-DC382D?logo=redis&logoColor=white" alt="Redis" />
</p>

---

## 📖 Overview

**IthraCode** is a comprehensive, Arabic-first (RTL) online learning platform designed to deliver
professional programming and web development courses. The platform supports three core roles —
**Student**, **Instructor**, and **Admin** — with an integrated payment system, high-quality video
streaming, and live consultation booking.

---

## ✨ Features

### 🎓 Student

- Browse and explore courses and learning paths
- Smart shopping cart with coupon/discount support
- Secure checkout via **Stripe**
- Track progress across enrolled courses (lectures, attachments)
- Rate and review courses
- Personal "My Courses" dashboard

### 🧑‍🏫 Instructor

- Course management dashboard (create / edit / publish)
- Manage sections and lectures with flexible ordering
- Video upload and streaming via **Mux**
- Attach supplementary materials (PDF, DOC, Code, ...)
- Set availability slots for consultation bookings
- Google Calendar integration for consultations

### 🛡️ Admin

- Full administrative control panel
- Manage courses and users

### ⚙️ System

- Multi-provider authentication (Credentials + Google + GitHub) via **NextAuth v5**
- Role-based access control (Student / Instructor / Admin)
- Async payment processing via **BullMQ + Redis**
- Stripe Webhooks for real-time payment events
- SEO optimized (Sitemap + Robots + Meta tags)
- Dark / Light mode support
- Full RTL Arabic interface

---

## 🛠️ Tech Stack

| Layer              | Technology                                            |
| ------------------ | ----------------------------------------------------- |
| **Framework**      | [Next.js 16](https://nextjs.org) (App Router)         |
| **UI**             | React 19 · Tailwind CSS 4 · Radix UI · Lucide Icons   |
| **Language**       | TypeScript 5                                          |
| **Database**       | PostgreSQL ([Neon](https://neon.tech)) · Prisma ORM 7 |
| **Authentication** | NextAuth v5 (Auth.js) · Prisma Adapter                |
| **Payments**       | Stripe (Checkout Sessions + Webhooks)                 |
| **Video**          | [Mux](https://mux.com) (Streaming & Playback)         |
| **Queue**          | BullMQ + Redis ([Upstash](https://upstash.com))       |
| **State**          | Zustand · React Query (TanStack)                      |
| **Forms**          | React Hook Form + Zod                                 |
| **Code Quality**   | Prettier · ESLint · Husky · Commitlint                |
| **Logging**        | Pino + Pino Pretty                                    |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 20
- **pnpm** ≥ 10
- **Docker** (for local Redis — optional)
- **PostgreSQL** account (Neon or local)
- **Stripe** account (test mode)
- **Mux** account (video streaming)

### 1. Clone the Repository

```bash
git clone https://github.com/HodaNabeil/ithracode-1.git
cd ithracode-1
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root (see [Environment Variables](#-environment-variables)):

```bash
cp .env.example .env
```

### 4. Set Up the Database

```bash
# Apply migrations
npx prisma migrate dev

# Seed initial data
pnpm seed
```

### 5. Start Redis (Optional — for queues)

```bash
docker compose up -d
```

### 6. Start the Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 7. Start the Payment Worker (separate terminal)

```bash
pnpm worker
```

---

## 📁 Project Structure

```
ithracode-1/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── migrations/            # Migration files
│   └── seed.ts                # Database seeder
├── public/
│   └── img/                   # Static images & assets
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (public)/          # Public pages (home, courses, learning paths)
│   │   ├── (student)/         # Student pages (my courses, study view)
│   │   ├── admin/             # Admin dashboard
│   │   ├── instructor/        # Instructor dashboard
│   │   ├── auth/              # Authentication pages
│   │   ├── api/               # API Routes
│   │   │   ├── auth/          #   └─ Authentication
│   │   │   ├── checkout/      #   └─ Stripe checkout session
│   │   │   ├── courses/       #   └─ Course operations
│   │   │   ├── orders/        #   └─ Order management
│   │   │   └── webhook/       #   └─ Stripe webhook handler
│   │   ├── success/           # Payment success page
│   │   └── unauthorized/      # Unauthorized access page
│   ├── components/
│   │   ├── ui/                # Base Radix/Shadcn components
│   │   └── shared/            # Shared components (Header, ...)
│   ├── features/              # Feature-based architecture
│   │   ├── auth/              #   └─ Authentication
│   │   ├── courses/           #   └─ Course browsing & details
│   │   ├── cart/              #   └─ Shopping cart
│   │   ├── my-courses/        #   └─ Enrolled courses & study view
│   │   ├── learning-paths/    #   └─ Learning paths
│   │   ├── contact/           #   └─ Contact page
│   │   ├── admin/             #   └─ Admin features
│   │   └── user/              #   └─ User profile
│   ├── server/
│   │   ├── db/                # Prisma Client setup
│   │   ├── services/          # Server-side services
│   │   └── workers/           # BullMQ Workers (payment processing)
│   ├── lib/                   # Utilities (Auth, Prisma, Stripe, Redis, ...)
│   ├── hooks/                 # Custom React Hooks
│   ├── store/                 # Zustand Stores
│   ├── providers/             # Context Providers (Auth, Theme)
│   ├── validation/            # Zod Schemas
│   ├── mappers/               # Data Mappers
│   ├── types/                 # TypeScript type definitions
│   ├── config/                # App configuration
│   ├── constant/              # Constants
│   └── utils/                 # Helper utilities
├── configs/                   # Additional configs
├── docker-compose.yml         # Redis container
├── package.json
├── tsconfig.json
├── next.config.ts
├── eslint.config.mjs
├── prettier.config.js
└── commitlint.config.js
```

---

## 🔐 Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# ── App ──
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:3000/api"

# ── Database (PostgreSQL) ──
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"
DIRECT_URL="postgresql://user:password@host:5432/dbname?sslmode=require"

# ── Redis (BullMQ) ──
REDIS_URL="redis://localhost:6380"

# ── NextAuth ──
AUTH_SECRET="your-secret-here"        # openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"

# ── OAuth Providers ──
AUTH_GOOGLE_ID="..."
AUTH_GOOGLE_SECRET="..."
AUTH_GITHUB_ID="..."
AUTH_GITHUB_SECRET="..."

# ── Stripe ──
STRIPE_API_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# ── Mux (Video Streaming) ──
MUX_TOKEN_ID="..."
MUX_TOKEN_SECRET="..."
```

---

## 📜 Scripts

| Command             | Description                         |
| ------------------- | ----------------------------------- |
| `pnpm dev`          | Start the development server        |
| `pnpm build`        | Build for production                |
| `pnpm start`        | Start the production server         |
| `pnpm lint`         | Lint the codebase with ESLint       |
| `pnpm format`       | Format code with Prettier           |
| `pnpm format:check` | Check code formatting               |
| `pnpm type-check`   | Run TypeScript type checking        |
| `pnpm seed`         | Seed the database with initial data |
| `pnpm db:push`      | Push schema changes to the database |
| `pnpm db:reset`     | Reset the database (force)          |
| `pnpm db:studio`    | Open Prisma Studio                  |
| `pnpm worker`       | Start the payment processing worker |

---

## 🗄️ Database Schema

```mermaid
erDiagram
    User ||--o{ Course : instructs
    User ||--o{ Enrollment : enrolls
    User ||--o{ Order : places
    User ||--o{ Review : writes
    User ||--o| Cart : has

    Course ||--o{ Section : contains
    Course }o--|| Path : "belongs to"
    Course }o--o| Track : "optionally in"

    Section ||--o{ Lecture : contains
    Lecture ||--o{ Attachment : has
    Lecture ||--o{ Progress : tracks

    Enrollment ||--o{ Progress : tracks
    Enrollment }o--|| Course : "enrolled in"

    Order ||--o{ OrderItem : contains
    Order }o--o| Payment : "paid via"
    OrderItem }o--|| Course : references

    Cart ||--o{ CartItem : contains
    CartItem }o--|| Course : references

    Path ||--o{ Track : organizes
    User ||--o{ ConsultationBooking : books
    User ||--o{ InstructorAvailability : sets
```

---

## 🔄 Payment Flow

```mermaid
sequenceDiagram
    participant S as Student
    participant App as Application
    participant Stripe as Stripe
    participant WH as Webhook
    participant Q as BullMQ Worker
    participant DB as Database

    S->>App: Add courses to cart
    S->>App: Initiate checkout
    App->>Stripe: Create Checkout Session
    Stripe-->>S: Redirect to payment page
    S->>Stripe: Complete payment
    Stripe->>WH: checkout.session.completed event
    WH->>Q: Enqueue payment processing job
    Q->>DB: Update order + create enrollment
    Q-->>App: Revalidate cached pages
    App-->>S: Display success page
```

---

## 🤝 Contributing

Contributions are welcome! Please follow the
[Conventional Commits](https://www.conventionalcommits.org/) specification for commit messages.

```bash
# Valid commit message examples
git commit -m "feat(courses): add course filtering by level"
git commit -m "fix(cart): resolve duplicate item issue"
git commit -m "docs: update README with setup instructions"
```

Commit messages are automatically validated via **Husky** + **Commitlint**.

---

## 📄 License

This project is private and not licensed for public use.

---

<p align="center">
  Made with ❤️ by the <strong>IthraCode</strong> team
</p>
