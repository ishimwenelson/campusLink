# 🏆 CampusLink Investment Association

> **"Together we grow – Share, Save, Succeed"**

A professional, full-stack investment group management platform built with Next.js 15, Firebase, Socket.io, and Framer Motion.

---

## 🎨 Design System

- **Primary Color**: Gold / Amber (`#d97706` — `amber-600`)
- **Background**: Warm cream (`#fffbeb`)
- **Typography**: Playfair Display (headings) + DM Sans (body)
- **Theme**: Professional banking mixed with warm community feel

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone <repo>
cd CAMPUSLINK
npm install
```

### 2. Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Authentication** (Email/Password)
3. Create a **Firestore** database
4. Create a **Storage** bucket
5. Generate a **Service Account** key (Project Settings → Service Accounts)

### 3. Environment Variables

```bash
cp .env.local.example .env.local
```

Fill in all values in `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

FIREBASE_ADMIN_PROJECT_ID=...
FIREBASE_ADMIN_CLIENT_EMAIL=...
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

NEXT_PUBLIC_APP_URL=http://localhost:3000
JWT_SECRET=your_32_char_minimum_secret_here
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
```

### 4. Deploy Firebase Security Rules

Copy the contents of `lib/firebase/rules.txt` into your Firestore Rules in the Firebase Console.

### 5. Create First President Account

In Firebase Authentication, manually create a user with `president@campuslink.rw`, then in Firestore create the user document:

```json
{
  "email": "president@campuslink.rw",
  "role": "president",
  "fullName": "President Name",
  "phone": "+250700000000",
  "nationalID": "1...",
  "createdAt": "2025-01-01T00:00:00.000Z",
  "totalShareValue": 400000,
  "paidSoFar": 0,
  "emergencyTaken": 0,
  "interestOwed": 0,
  "isActive": true,
  "passwordChanged": true,
  "documentsUploaded": true
}
```

Set custom claim via Firebase Admin SDK or Cloud Functions:
```javascript
admin.auth().setCustomUserClaims(uid, { role: "president" });
```

### 6. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
CAMPUSLINK/
├── app/
│   ├── (dashboards)/          # Role-based dashboard pages
│   │   ├── member/            # Member dashboard
│   │   ├── investor/          # Investor + proposals
│   │   ├── president/         # Full system overview
│   │   ├── treasurer/         # Financial reports
│   │   ├── secretary/         # Member management
│   │   └── board/             # Board meetings
│   ├── api/
│   │   ├── auth/session/      # JWT session management
│   │   ├── auth/register/     # Member registration (admin SDK)
│   │   └── payments/          # Payment recording
│   └── auth/
│       ├── login/             # Login page
│       └── change-password/   # First-login password change
├── components/
│   ├── dashboard/             # Reusable dashboard components
│   ├── modals/                # Modal dialogs
│   └── certificate/           # PDF certificate generator
├── lib/
│   ├── firebase/              # Firebase config, admin, Firestore helpers
│   ├── hooks/                 # React hooks (auth, socket, notifications)
│   ├── types/                 # TypeScript types + business rules
│   └── utils/                 # Utility functions
├── public/assets/             # Logo and icon images
├── styles/globals.css         # Global styles + Tailwind
├── middleware.ts               # Route protection + role routing
├── server.js                  # Custom Next.js + Socket.io server
└── tailwind.config.ts         # Gold color theme configuration
```

---

## 💼 Business Rules (Implemented)

| Rule | Value |
|------|-------|
| Minimum share value | 400,000 RF |
| Share unit price | 1,000 RF |
| Minimum shares | 400 |
| Payment period | 5 years |
| Annual target | 20% of total share value |
| Emergency max | 40% of amount paid so far |
| Emergency interest | 5% of emergency amount |
| Default password | `CampusLink2025` |

---

## 👥 User Roles

| Role | Permissions |
|------|------------|
| `member` | View own dashboard, payments, request emergency |
| `investor` | Member + create/vote proposals, view discussions |
| `president` | Full access, approve emergencies, all reports |
| `treasurer` | Financial overview, all member finances, exports |
| `secretary` | Register members, manage documents, member directory |
| `boardMember` | Create/manage meetings, access board dashboard |

---

## 🔔 Real-time Features (Socket.io)

- Live notifications (bell icon with unread count)
- Real-time vote updates on proposals
- Live meeting notes editing
- Emergency approval/rejection notifications
- New payment notifications

**⚠️ Vercel Limitation**: Vercel doesn't support persistent WebSocket connections. For full Socket.io support, deploy on:
- [Railway](https://railway.app) — Recommended
- [Render](https://render.com)
- [Fly.io](https://fly.io)

---

## 🚀 Deployment

### Railway (Recommended for full Socket.io)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

Set all environment variables in Railway dashboard.

### Vercel (Static/Serverless — no WebSocket)

```bash
npx vercel deploy
```

Note: Socket.io will fall back to polling on Vercel.

---

## 📄 Share Certificate

Certificates are auto-generated with `@react-pdf/renderer` when a member completes full payment (`paidSoFar >= totalShareValue`). The certificate includes:

- CampusLink logo and branding
- Member full name
- Share count and total value
- Investment period dates
- Signature lines (Member + President)
- Unique serial number
- Gold border design with watermark

---

## 🔐 Security

- Firebase Auth with custom claims for role-based access
- JWT session cookies (httpOnly, secure)
- Firestore security rules enforcing role-based data access
- Middleware protecting all dashboard routes
- Input validation with Zod + react-hook-form

---

## 📞 Support

Contact your system administrator or create an issue in the repository.

---

*CampusLink Investment Association © 2025 — Together we grow*
