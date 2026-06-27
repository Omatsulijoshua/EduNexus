# EduNexus - Multi-Tenant School Management System SaaS

> **Connecting Every School.**

EduNexus is a state-of-the-art, multi-tenant School Management System SaaS designed to streamline academic operations, grading, reporting, and administration for schools. The platform features role-based dashboards for Super Admins, School Admins, Teachers, Parents, and Students.

---

## 🚀 Key Features

### 1. Multi-Tenant Architecture
- **Tenant Isolation:** Complete data separation between schools using tenant/school IDs.
- **Customizable Subdomains:** Dynamic routing (e.g., `schoolname.edunexus.com`) and custom domain mapping.
- **School Landing Page Builder:** Every registered school can customize and publish their public landing page (logo, colors, hero section, gallery, news, announcements).

### 2. Role-Based Portals & Dashboards
- **👑 Super Admin:** Platform analytics, subscription plan management, school approval/suspension, payment history, and global announcements.
- **🏫 School Admin:** Manage school profiles, academic sessions, grading systems, teachers, students, parents, classes, and arms. Approve and publish results.
- **👨‍🏫 Teacher:** View assigned classes/subjects, manage students, enter grades (CAs and Exams), save drafts, and submit results for approval.
- **👪 Parent:** Link multiple children, monitor attendance, view and print report sheets, and receive school announcements.
- **🎓 Student:** View profiles, class subjects, assignments, and download/print academic results.

### 3. Academic & Result Management
- **Flexible Grading System:** Define custom score weights (e.g., CA1: 10%, CA2: 10%, Assignment: 10%, Exam: 70%) and grading scales (A, B, C, D, F).
- **Master Sheets:** Generate comprehensive class-wide grids showing all students, subjects, scores, averages, and class positions. Exportable to PDF and Excel.
- **Report Sheets:** Beautiful, high-fidelity printable report cards containing student photos, attendance summaries, subject grades, and teacher/principal comments.

### 4. Subscription & Billing
- **Monetization:** Recurring subscription plans for schools (Monthly/Yearly).
- **Payment Gateways:** Integrated with Paystack/Flutterwave for Nigerian and international school payments.

---

## 🛠️ Technology Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | [Next.js 15](https://nextjs.org/) | App Router, React, TypeScript, Tailwind CSS |
| **Backend** | [Express.js](https://expressjs.com/) | Node.js, TypeScript, REST API |
| **Database** | [PostgreSQL](https://www.postgresql.org/) | Relational Database |
| **ORM** | [Prisma ORM](https://www.prisma.io/) | Database mapping and migrations |
| **Authentication** | JWT & Refresh Tokens | Secure role-based access control (RBAC) |
| **Uploads** | Cloudinary / S3 | Image and document storage |
| **Payments** | Paystack / Flutterwave | Subscription and school fees |

---

## 📂 Project Structure

```
EduNexus/
├── backend/                  # Express.js Backend
│   ├── prisma/               # Database Schema & Migrations
│   ├── src/
│   │   ├── controllers/      # Route controllers
│   │   ├── middleware/       # Auth & Tenant isolation middleware
│   │   ├── routes/           # API Endpoints
│   │   └── index.ts          # Server entry point
│   ├── .env.example          # Environment variables template
│   ├── package.json
│   └── tsconfig.json
├── frontend/                 # Next.js Frontend
│   ├── src/
│   │   ├── app/              # Next.js App Router Pages
│   │   ├── components/       # Reusable UI Components
│   │   ├── context/          # Auth & Tenant Contexts
│   │   └── lib/              # API Client & Utils
│   ├── public/               # Static assets (logos, images)
│   ├── package.json
│   └── tailwind.config.ts
└── README.md
```

---

## ⚙️ Local Setup & Installation

### Prerequisites
- Node.js (v18+ recommended)
- PostgreSQL running locally or in the cloud
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/Omatsulijoshua/EduNexus.git
cd EduNexus
```

### 2. Setup the Backend
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file from the template:
   ```bash
   cp .env.example .env
   ```
4. Configure your database connection in `.env`:
   ```env
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/edunexus?schema=public"
   JWT_SECRET="your_jwt_access_secret"
   JWT_REFRESH_SECRET="your_jwt_refresh_secret"
   PORT=5000
   ```
5. Run Prisma migrations to set up your database tables:
   ```bash
   npx prisma db push
   ```
6. Start the backend development server:
   ```bash
   npm run dev
   ```
   The backend will be running at `http://localhost:5000`. Verify using the health check endpoint: `http://localhost:5000/api/health`.

### 3. Setup the Frontend
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
   The frontend will be running at `http://localhost:3000`.

---

## 🔒 Database Schema Overview

EduNexus uses a highly relational schema built with Prisma:
- **User / School**: Multi-tenant isolation is enforced via `schoolId` on all tenant-specific tables.
- **AcademicSession / Term**: Manages terms (First, Second, Third) and sessions (e.g., 2026/2027).
- **Class / ClassArm / Subject**: Custom class setups (e.g. JSS 1A) and subject assignments.
- **TeacherAssignment**: Maps teachers to their respective classes and subjects.
- **Result / ResultScore / ReportSheet**: Comprehensive grading, CA, Exam scores, and final remarks.
- **Subscription / Payment**: Handles SaaS billing.

---

## 📄 License
This project is licensed under the MIT License.
