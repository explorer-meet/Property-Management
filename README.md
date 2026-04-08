# Property Management System

A full-stack **Property Management System (PMS)** built with:

- **Backend**: Node.js + Express + MongoDB (Mongoose) + JWT Auth
- **Frontend**: React 18 + Vite + Tailwind CSS + Redux Toolkit + Recharts

---

## Project Structure

```
Property-Management/
├── backend/
│   ├── config/           # MongoDB connection
│   ├── controllers/      # Business logic
│   ├── middleware/        # JWT auth + role guards
│   ├── models/           # Mongoose schemas
│   ├── routes/           # Express routes
│   ├── .env              # Environment variables
│   └── server.js
└── frontend/
    ├── src/
    │   ├── app/           # Redux store + slices
    │   ├── components/    # Sidebar, Layout, UI helpers
    │   ├── pages/
    │   │   ├── auth/      # Login, Register
    │   │   ├── owner/     # Dashboard, Properties, Tenants, Rent, Maintenance, Vacancies
    │   │   └── tenant/    # Dashboard, Rent, Maintenance
    │   └── utils/         # Axios API client
    └── ...
```

---

## Getting Started

### Prerequisites
- Node.js >= 18
- MongoDB running locally (or provide a MongoDB Atlas URI)

### 1. Backend Setup

```bash
cd backend
# Edit .env — set MONGO_URL and JWT_SECRET
npm install
npm run dev
# Runs on http://localhost:5000
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

---

## Environment Variables

**backend/.env**
```
PORT=5000
MONGO_URL=mongodb://localhost:27017/property_management
JWT_SECRET=your_strong_secret_here
JWT_EXPIRES_IN=7d
```

**frontend/.env**
```
VITE_API_URL=http://localhost:5000/api
```

---

## Features

### Owner Module
| Feature | Description |
|---|---|
| Dashboard | Stats: properties, leases, rent, maintenance |
| Properties | Add / Edit / Delete properties (Home, Flat, Office, Shop) |
| Tenants & Leases | Assign tenants, set lease dates, rent amount, security deposit |
| Rent Management | Generate monthly rent records, mark paid/overdue |
| Maintenance | View & update tenant requests with comments |
| Vacancies | View vacant properties, mark occupied |

### Tenant Module
| Feature | Description |
|---|---|
| Dashboard | Property details, lease info, owner contact |
| Rent & Payments | View rent history, due dates, payment status |
| Maintenance | Raise new requests, track status & owner updates |

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/signup` | Register user |
| POST | `/api/auth/signin` | Login |
| GET | `/api/auth/profile` | Get profile |
| PUT | `/api/auth/profile` | Update profile |

### Owner
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/owner/dashboard` | Dashboard stats |
| CRUD | `/api/owner/properties` | Property management |
| GET | `/api/owner/vacancies` | Vacant properties |
| CRUD | `/api/owner/leases` | Tenant/lease management |
| CRUD | `/api/owner/rent` | Rent records |
| GET/PATCH | `/api/owner/maintenance` | Maintenance requests |

### Tenant
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/tenant/dashboard` | Tenant dashboard |
| GET | `/api/tenant/lease` | Active lease |
| GET | `/api/tenant/rent-history` | Rent history |
| POST/GET | `/api/tenant/maintenance` | Raise/view requests |
