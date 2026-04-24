# MediID — Secure Health Identity Platform

> A full-stack, role-based health identity platform with QR access, family account management, emergency protocols, and audit logging.

![Django](https://img.shields.io/badge/Django-5.0+-092E20?style=flat-square&logo=django)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=flat-square&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────┐
│                   CLIENT (React + TS + Vite)              │
│   Landing → Auth → Patient Dashboard → Doctor Dashboard   │
│   Zustand (state) + Axios (JWT) + Framer Motion (UI)      │
└─────────────────────────┬────────────────────────────────┘
                          │ HTTP (Vite proxy → :8000)
┌─────────────────────────▼────────────────────────────────┐
│                     DJANGO REST API                       │
│   JWT Auth → RBAC Middleware → Views → Serializers        │
│   7 apps: accounts, patients, family, doctors,            │
│           records, emergency, audit                       │
└──────┬───────────────────────────────────────────────────┘
       │
    SQLite (dev) / PostgreSQL (prod)
```

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🪪 **Health Identity** | UUID-based Health IDs (`MID-XXXX-XXXX`) with auto-generated QR codes |
| 🔐 **JWT Authentication** | Access (30min) + Refresh (7d) tokens with rotation & blacklisting |
| 👨‍⚕️ **Doctor Verification** | Admin-approved doctor accounts before they can add records |
| 📋 **Medical Records** | Doctors add diagnoses, prescriptions, notes + file/photo uploads |
| 🚨 **Emergency Mode** | Time-limited (24h) emergency QR codes — no authentication required |
| 👨‍👩‍👧‍👦 **Family Management** | One account manages multiple family member health profiles |
| 📊 **Audit Logging** | Every access, record addition, and emergency scan is logged |
| 🛡️ **RBAC Permissions** | Role-based access control enforced on every API endpoint |

---

## 📁 Project Structure

```
MEDID/
├── backend/                          # Django REST API
│   ├── config/
│   │   ├── settings/
│   │   │   ├── base.py              # Shared settings
│   │   │   ├── development.py       # SQLite, DEBUG=True
│   │   │   └── production.py        # PostgreSQL, HTTPS
│   │   ├── urls.py                  # Root URL routing
│   │   └── wsgi.py
│   ├── core/
│   │   ├── permissions.py           # IsPatient, IsDoctor, IsAdmin, etc.
│   │   ├── qr.py                    # QR code generation
│   │   └── storage.py              # File storage abstraction
│   ├── apps/
│   │   ├── accounts/                # Custom User model + JWT auth
│   │   ├── patients/                # Patient profile endpoints
│   │   ├── family/                  # Family member CRUD
│   │   ├── doctors/                 # Doctor profiles + verification
│   │   ├── records/                 # Medical records + file uploads
│   │   ├── emergency/              # Emergency token system
│   │   └── audit/                   # Access logging
│   ├── manage.py
│   └── requirements.txt
│
├── frontend/                         # React + TypeScript + Vite
│   ├── src/
│   │   ├── api/client.ts            # Axios + JWT interceptor
│   │   ├── store/authStore.ts       # Zustand auth state
│   │   ├── types/index.ts           # TypeScript interfaces
│   │   ├── components/ui/           # Card, Button, Input, Modal, Navbar, etc.
│   │   ├── pages/
│   │   │   ├── public/Landing.tsx   # Premium landing page
│   │   │   ├── auth/Login.tsx       # Login form
│   │   │   ├── auth/Register.tsx    # Register with role selection
│   │   │   ├── patient/Dashboard.tsx # Health ID, QR, timeline, emergency
│   │   │   ├── doctor/Dashboard.tsx  # Patient lookup, add records
│   │   │   ├── admin/Dashboard.tsx   # Verify doctors, audit logs
│   │   │   └── emergency/EmergencyView.tsx # Public emergency access
│   │   ├── App.tsx                  # Router + providers
│   │   ├── main.tsx                 # Entry point
│   │   └── index.css                # Dark glassmorphic design system
│   ├── package.json
│   └── vite.config.ts               # Proxy /api → Django
│
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- **Python** 3.10+
- **Node.js** 20.19+ or 22.12+
- **Git**

### 1. Clone the Repository

```bash
git clone https://github.com/Poornachandra-dh/MEDID.git
cd MEDID
```

### 2. Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations
python manage.py makemigrations
python manage.py migrate

# Create admin superuser
python manage.py createsuperuser --email admin@mediid.com --name "Admin"
# You'll be prompted to set a password

# Start the backend server
python manage.py runserver 8000
```

The API will be available at `http://localhost:8000/api/`

### 3. Frontend Setup

Open a **new terminal**:

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:5173/`

### 4. Access the Application

| URL | Description |
|-----|-------------|
| `http://localhost:5173/` | Frontend (Landing Page) |
| `http://localhost:5173/login` | Login |
| `http://localhost:5173/register` | Register (Patient or Doctor) |
| `http://localhost:5173/dashboard` | Patient Dashboard |
| `http://localhost:5173/doctor` | Doctor Panel |
| `http://localhost:5173/admin` | Admin Panel |
| `http://localhost:8000/admin/` | Django Admin Panel |

---

## 📡 API Reference

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/register/` | ❌ | Register new user |
| `POST` | `/api/auth/login/` | ❌ | Get JWT tokens |
| `POST` | `/api/auth/refresh/` | ❌ | Refresh access token |
| `POST` | `/api/auth/logout/` | ✅ | Blacklist refresh token |
| `GET/PATCH` | `/api/auth/profile/` | ✅ | Own profile |

### Patient
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| `GET` | `/api/patient/me/` | ✅ | Patient | Own profile + Health ID |
| `GET` | `/api/patient/<health_id>/` | ✅ | Doctor/Admin | Lookup patient |

### Family
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| `POST` | `/api/family/add/` | ✅ | Patient | Add family member |
| `GET` | `/api/family/list/` | ✅ | Patient | List family members |
| `DELETE` | `/api/family/<id>/` | ✅ | Patient | Remove family member |

### Medical Records
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| `POST` | `/api/records/add/` | ✅ | Doctor | Add record (multipart for files) |
| `GET` | `/api/records/<patient_id>/` | ✅ | Owner/Doctor/Admin | List records |
| `GET` | `/api/records/<id>/file/` | ✅ | Owner/Doctor | Get report file URL |

### Emergency
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET/PATCH` | `/api/emergency/<id>/manage/` | ✅ | Manage emergency data |
| `POST` | `/api/emergency/<id>/toggle/` | ✅ | Enable/disable emergency mode |
| `GET` | `/api/emergency/access/<token>/` | ❌ | Public emergency access |

### Admin
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| `GET` | `/api/admin/doctors/pending/` | ✅ | Admin | List unverified doctors |
| `POST` | `/api/admin/doctors/<id>/verify/` | ✅ | Admin | Verify a doctor |
| `GET` | `/api/audit/logs/` | ✅ | Admin | View access logs |

---

## 🧪 Testing the Flow

### 1. Register a Patient
- Go to `/register` → select "Patient" → fill form
- A unique Health ID (`MID-XXXX-XXXX`) and QR code are auto-generated

### 2. Register a Doctor
- Go to `/register` → select "Doctor" → fill form
- After login, create your Doctor Profile (hospital, specialization, license)

### 3. Admin Verifies the Doctor
- Login as admin at `/login`
- Go to Admin Panel → "Pending Doctors" → click "✓ Verify"

### 4. Doctor Adds Medical Records
- Login as the verified doctor
- Enter the patient's Health ID in "Patient Lookup"
- Click "+ Add Record" → fill diagnosis, prescription, notes
- Optionally attach report files/photos (drag & drop supported)

### 5. Patient Views Records
- Login as the patient → Dashboard shows the medical timeline
- Records include doctor name, diagnosis, prescriptions, and attached files

### 6. Enable Emergency Mode
- On Patient Dashboard → click "Enable Emergency Mode"
- A time-limited (24h) emergency QR code is generated
- Anyone scanning this QR can access critical info (blood group, allergies, medications, emergency contact) **without logging in**

---

## 🔒 Security

- **UUID primary keys** — prevents ID enumeration attacks
- **JWT with rotation** — access tokens expire in 30 minutes
- **Token blacklisting** — refresh tokens are blacklisted after rotation
- **RBAC on every endpoint** — backend is the single source of truth
- **Emergency tokens** — SHA-256 hashed, timing-safe comparison via `secrets.compare_digest`
- **Audit trail** — every access is logged with actor, IP, user agent, and timestamp
- **CORS restricted** — configured per environment

---

## 🛠️ Tech Stack

### Backend
- **Django 5.0+** — Web framework
- **Django REST Framework** — API layer
- **SimpleJWT** — JWT authentication
- **Pillow + qrcode** — QR code generation
- **SQLite** (dev) / **PostgreSQL** (prod)

### Frontend
- **React 18** — UI library
- **TypeScript 5.6** — Type safety
- **Vite 6** — Build tool
- **Zustand** — State management
- **React Query** — Server state
- **Framer Motion** — Animations
- **Axios** — HTTP client
- **react-qr-code** — QR code display

---

## 📦 Production Deployment

For production, update `backend/config/settings/production.py`:

```bash
# Set environment variables
export DJANGO_SETTINGS_MODULE=config.settings.production
export DJANGO_SECRET_KEY=your-secure-secret-key
export DB_NAME=mediid_db
export DB_USER=mediid_user
export DB_PASSWORD=strong-password
export DB_HOST=your-db-host
export ALLOWED_HOSTS=yourdomain.com
export FRONTEND_URL=https://yourdomain.com
```

---

## 📄 License

This project is licensed under the MIT License.

---

## 👤 Author

**Poornachandra DH**

Built with ❤️ using Django + React
