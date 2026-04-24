# MediID — Senior Developer Implementation Blueprint
> *Generalized as: "Secure Role-Based Health Identity Platform with QR Access & Family Account Management"*
> Authored from the perspective of a 15-year full-stack architect.

---

## 0. HOW TO READ THIS DOCUMENT

This is not a spec. This is a **battle-tested implementation guide**.
Every decision below has a "why" — because junior devs copy patterns, senior devs understand tradeoffs.
Sections are ordered by the actual build sequence, not feature importance.

---

## 1. GENERALIZED PROBLEM STATEMENT

> Build a **multi-tenant, role-controlled identity platform** where:
> - A resource (patient) is **managed by its owner but updated only by authorized agents (doctors)**
> - Each resource has a **portable, scannable identity token (QR)**
> - Access has **two modes**: Full (authenticated) and Emergency (time-limited, data-limited, unauthenticated-safe)
> - One account can **own multiple resource profiles** (family model)

This pattern applies beyond healthcare:
- Asset management systems
- Legal case management
- Pet health records
- School student portals

Keeping this abstraction in mind helps you build reusable components.

---

## 2. ARCHITECTURE OVERVIEW

```
┌──────────────────────────────────────────────────────────┐
│                        CLIENT (React + TS)                │
│   Landing → Auth → Patient Dashboard → Doctor Dashboard  │
│   React Query (cache) + Axios (interceptors) + Framer    │
└────────────────────────┬─────────────────────────────────┘
                         │ HTTPS (Nginx reverse proxy)
┌────────────────────────▼─────────────────────────────────┐
│                     DJANGO REST API                       │
│   JWT Auth → RBAC Middleware → Views → Serializers        │
│   Background tasks via Celery + Redis                     │
└──────┬──────────────┬──────────────────┬─────────────────┘
       │              │                  │
  PostgreSQL       Redis              AWS S3 / Cloudinary
  (primary DB)  (cache + sessions)   (signed file storage)
```

**Key architectural principle:** The backend is the **single source of truth for all permissions**. The frontend only *reflects* state — it never enforces security.

---

## 3. PROJECT FOLDER STRUCTURE

### Backend (Django)
```
mediid_backend/
├── config/                   # Django settings split by env
│   ├── settings/
│   │   ├── base.py
│   │   ├── development.py
│   │   └── production.py
│   ├── urls.py
│   └── wsgi.py
├── apps/
│   ├── accounts/             # User model, JWT, roles
│   ├── patients/             # HealthID, QR, Emergency data
│   ├── family/               # FamilyProfile model
│   ├── records/              # MedicalRecord CRUD
│   ├── doctors/              # Doctor profile + verification
│   ├── emergency/            # Emergency token system
│   └── audit/                # AccessLog model + signals
├── core/
│   ├── permissions.py        # Custom DRF permission classes
│   ├── encryption.py         # Field-level encryption utils
│   ├── qr.py                 # QR generation helpers
│   └── storage.py            # S3 signed URL helpers
├── requirements/
│   ├── base.txt
│   ├── dev.txt
│   └── prod.txt
└── docker/
    ├── Dockerfile
    └── entrypoint.sh
```

### Frontend (React + TS)
```
mediid_frontend/
├── src/
│   ├── api/                  # Axios instances + endpoint functions
│   ├── components/
│   │   ├── ui/               # Reusable primitives (Button, Card, Modal)
│   │   ├── qr/               # QRDisplay, QRScanner components
│   │   ├── timeline/         # Medical timeline components
│   │   └── family/           # FamilySwitcher, AddMember
│   ├── pages/
│   │   ├── public/           # Landing, About, Contact
│   │   ├── auth/             # Login, Signup
│   │   ├── patient/          # Dashboard, Timeline, Emergency
│   │   └── doctor/           # Scan, PatientView, AddRecord
│   ├── hooks/                # Custom React hooks
│   ├── store/                # Zustand or Context for auth state
│   ├── types/                # TypeScript interfaces
│   └── utils/                # Formatters, validators, constants
├── public/
└── docker/
    └── Dockerfile
```

---

## 4. DATABASE DESIGN (DETAILED)

> **Senior principle:** Design for queries, not just structure. Every foreign key is a JOIN. Every JOIN is a decision.

### 4.1 Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('patient', 'doctor', 'admin')),
    unique_health_id VARCHAR(20) UNIQUE,   -- auto-generated: MID-XXXX-XXXX
    qr_code_url TEXT,                      -- S3 path to generated QR image
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```
**Why UUID?** Prevents ID enumeration attacks. Never expose sequential IDs in healthcare.

### 4.2 Family Profiles
```sql
CREATE TABLE family_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    member_name VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    relation VARCHAR(50),                  -- 'child', 'parent', 'spouse'
    unique_health_id VARCHAR(20) UNIQUE NOT NULL,
    qr_code_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.3 Doctor Profiles
```sql
CREATE TABLE doctor_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    hospital_name VARCHAR(255),
    specialization VARCHAR(100),
    license_number VARCHAR(100) UNIQUE,
    is_verified BOOLEAN DEFAULT false,     -- Admin must verify
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.4 Medical Records
```sql
CREATE TABLE medical_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL,              -- Can be user.id OR family_profile.id
    patient_type VARCHAR(20) NOT NULL CHECK (patient_type IN ('user', 'family')),
    doctor_id UUID REFERENCES doctor_profiles(id),
    diagnosis TEXT NOT NULL,
    prescription TEXT,
    notes TEXT,
    report_file_key TEXT,                  -- S3 object key (NOT full URL)
    record_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```
**Why store S3 key, not URL?** Signed URLs expire. If you store the full URL, it breaks after expiry. Store the key, generate URL on demand.

### 4.5 Emergency Data
```sql
CREATE TABLE emergency_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL,
    patient_type VARCHAR(20) NOT NULL,
    blood_group VARCHAR(5),
    allergies TEXT[],                      -- PostgreSQL array
    chronic_conditions TEXT[],
    current_medications TEXT[],
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relation VARCHAR(50),
    is_emergency_mode_enabled BOOLEAN DEFAULT false,
    emergency_token VARCHAR(64) UNIQUE,    -- bcrypt hash of a random token
    token_expires_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.6 Access Logs
```sql
CREATE TABLE access_logs (
    id BIGSERIAL PRIMARY KEY,             -- Sequential OK here (internal only)
    actor_id UUID,                        -- Who performed the action
    actor_role VARCHAR(20),
    patient_id UUID,
    patient_type VARCHAR(20),
    action VARCHAR(50) NOT NULL,          -- 'view_record', 'add_record', 'emergency_access', 'login'
    ip_address INET,
    user_agent TEXT,
    metadata JSONB,                       -- Extra context
    timestamp TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_access_logs_patient ON access_logs(patient_id);
CREATE INDEX idx_access_logs_timestamp ON access_logs(timestamp);
```

---

## 5. BACKEND IMPLEMENTATION (Django)

### 5.1 Custom User Model
```python
# apps/accounts/models.py
import uuid
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models

class User(AbstractBaseUser, PermissionsMixin):
    ROLES = [('patient', 'Patient'), ('doctor', 'Doctor'), ('admin', 'Admin')]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLES)
    unique_health_id = models.CharField(max_length=20, unique=True, null=True, blank=True)
    qr_code_url = models.TextField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name', 'role']
    
    def save(self, *args, **kwargs):
        if self.role == 'patient' and not self.unique_health_id:
            self.unique_health_id = self._generate_health_id()
        super().save(*args, **kwargs)
    
    def _generate_health_id(self):
        import random, string
        while True:
            hid = 'MID-' + ''.join(random.choices(string.digits, k=4)) + '-' + \
                  ''.join(random.choices(string.ascii_uppercase, k=4))
            if not User.objects.filter(unique_health_id=hid).exists():
                return hid
```

### 5.2 RBAC Permission Classes
```python
# core/permissions.py
from rest_framework.permissions import BasePermission

class IsPatient(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'patient'

class IsDoctor(BasePermission):
    def has_permission(self, request, view):
        return (request.user.is_authenticated and 
                request.user.role == 'doctor' and 
                request.user.doctor_profile.is_verified)

class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'

class IsDoctorOrAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['doctor', 'admin']
```

### 5.3 Medical Record View (with audit logging)
```python
# apps/records/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from core.permissions import IsDoctor
from .models import MedicalRecord
from .serializers import MedicalRecordSerializer
from apps.audit.utils import log_action

class AddMedicalRecord(APIView):
    permission_classes = [IsDoctor]
    
    def post(self, request):
        serializer = MedicalRecordSerializer(data=request.data)
        if serializer.is_valid():
            record = serializer.save(doctor=request.user.doctor_profile)
            log_action(
                actor=request.user,
                patient_id=record.patient_id,
                action='add_record',
                metadata={'record_id': str(record.id)},
                request=request
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
```

### 5.4 Emergency Token System
```python
# apps/emergency/models.py
import secrets, hashlib
from datetime import timedelta
from django.utils import timezone

class EmergencyData(models.Model):
    # ... fields as in DB design ...
    
    def enable_emergency_mode(self, hours=24):
        """Generate a secure emergency token valid for N hours"""
        raw_token = secrets.token_urlsafe(32)
        self.emergency_token = hashlib.sha256(raw_token.encode()).hexdigest()
        self.token_expires_at = timezone.now() + timedelta(hours=hours)
        self.is_emergency_mode_enabled = True
        self.save()
        return raw_token  # Return RAW token to embed in QR — never store raw

    def validate_emergency_token(self, raw_token):
        """Validate a token presented by a scanner"""
        if not self.is_emergency_mode_enabled:
            return False
        if timezone.now() > self.token_expires_at:
            self.is_emergency_mode_enabled = False
            self.save()
            return False
        hashed = hashlib.sha256(raw_token.encode()).hexdigest()
        return secrets.compare_digest(hashed, self.emergency_token)
```

**Why `secrets.compare_digest`?** Prevents timing attacks. Always use this for security-sensitive string comparison.

### 5.5 S3 Signed URL Helper
```python
# core/storage.py
import boto3
from django.conf import settings

def get_signed_url(s3_key: str, expiry_seconds: int = 300) -> str:
    """Generate a pre-signed URL for private S3 objects"""
    s3 = boto3.client(
        's3',
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_REGION
    )
    return s3.generate_presigned_url(
        'get_object',
        Params={'Bucket': settings.AWS_STORAGE_BUCKET_NAME, 'Key': s3_key},
        ExpiresIn=expiry_seconds
    )
```

### 5.6 Key Django Settings
```python
# config/settings/production.py
import os

# Security
SECRET_KEY = os.environ['DJANGO_SECRET_KEY']
DEBUG = False
ALLOWED_HOSTS = [os.environ['DOMAIN']]
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000

# JWT
from datetime import timedelta
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=30),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}

# Redis
CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": os.environ['REDIS_URL'],
    }
}

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ['DB_NAME'],
        'USER': os.environ['DB_USER'],
        'PASSWORD': os.environ['DB_PASSWORD'],
        'HOST': os.environ['DB_HOST'],
        'PORT': '5432',
        'CONN_MAX_AGE': 60,
    }
}
```

---

## 6. API REFERENCE (COMPLETE)

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/api/auth/register/` | ❌ | Any | Register new user |
| POST | `/api/auth/login/` | ❌ | Any | Get JWT tokens |
| POST | `/api/auth/refresh/` | ❌ | Any | Refresh access token |
| POST | `/api/auth/logout/` | ✅ | Any | Blacklist refresh token |
| GET | `/api/patient/me/` | ✅ | Patient | Own profile + health ID |
| GET | `/api/patient/<health_id>/` | ✅ | Doctor/Admin | Full patient profile |
| GET | `/api/records/<patient_id>/` | ✅ | Doctor/Admin/Owner | Medical records list |
| POST | `/api/records/add/` | ✅ | Doctor | Add new medical record |
| GET | `/api/records/<id>/file/` | ✅ | Doctor/Owner | Get signed file URL |
| POST | `/api/family/add/` | ✅ | Patient | Add family member |
| GET | `/api/family/list/` | ✅ | Patient | List family members |
| DELETE | `/api/family/<id>/` | ✅ | Patient | Remove family member |
| POST | `/api/emergency/enable/` | ✅ | Patient | Enable emergency mode |
| POST | `/api/emergency/disable/` | ✅ | Patient | Disable emergency mode |
| GET | `/api/emergency/<token>/` | ❌ | None | Emergency public access |
| GET | `/api/admin/doctors/pending/` | ✅ | Admin | Unverified doctors |
| POST | `/api/admin/doctors/<id>/verify/` | ✅ | Admin | Verify a doctor |
| GET | `/api/audit/logs/` | ✅ | Admin | Access log viewer |

---

## 7. QR CODE SYSTEM (DETAILED)

### 7.1 QR Content Structure
```json
// Standard QR (Full authenticated access)
{
  "type": "standard",
  "health_id": "MID-1234-ABCD",
  "version": 1
}

// Emergency QR (Time-limited, no auth required)
{
  "type": "emergency",
  "token": "raw_token_here",
  "version": 1
}
```

**Never put PII directly in QR.** The QR is a pointer, not a record.

### 7.2 QR Generation (Backend)
```python
# core/qr.py
import qrcode, json, boto3, io
from PIL import Image

def generate_qr_and_upload(data: dict, filename: str) -> str:
    """Generate QR code, upload to S3, return S3 key"""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4
    )
    qr.add_data(json.dumps(data))
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    
    s3_key = f"qr-codes/{filename}.png"
    s3 = boto3.client('s3')
    s3.upload_fileobj(buffer, settings.AWS_STORAGE_BUCKET_NAME, s3_key,
                      ExtraArgs={'ContentType': 'image/png'})
    return s3_key
```

---

## 8. FRONTEND ARCHITECTURE

### 8.1 Axios Setup with JWT Interceptor
```typescript
// src/api/client.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refresh = localStorage.getItem('refresh_token');
        const { data } = await axios.post('/api/auth/refresh/', { refresh });
        localStorage.setItem('access_token', data.access);
        return api(original);
      } catch {
        // Force logout
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
```

### 8.2 React Query Setup
```typescript
// src/hooks/usePatientRecords.ts
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';

export const usePatientRecords = (patientId: string) =>
  useQuery({
    queryKey: ['records', patientId],
    queryFn: () => api.get(`/api/records/${patientId}/`).then(r => r.data),
    staleTime: 1000 * 60 * 5,   // 5 min cache
    enabled: !!patientId,
  });
```

### 8.3 Framer Motion Page Transitions
```typescript
// src/components/PageWrapper.tsx
import { motion } from 'framer-motion';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  enter:   { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -20, transition: { duration: 0.2 } }
};

export const PageWrapper = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    variants={pageVariants}
    initial="initial"
    animate="enter"
    exit="exit"
  >
    {children}
  </motion.div>
);
```

### 8.4 Emergency Mode Toggle Component
```typescript
// src/components/EmergencyToggle.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';

export const EmergencyToggle = ({ patientId }: { patientId: string }) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const queryClient = useQueryClient();

  const toggleMutation = useMutation({
    mutationFn: () => isEnabled 
      ? api.post('/api/emergency/disable/') 
      : api.post('/api/emergency/enable/', { patient_id: patientId, hours: 24 }),
    onSuccess: () => {
      setIsEnabled(prev => !prev);
      queryClient.invalidateQueries({ queryKey: ['patient', patientId] });
    }
  });

  return (
    <div className="flex items-center gap-4">
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => toggleMutation.mutate()}
        className={`relative w-16 h-8 rounded-full transition-colors ${
          isEnabled ? 'bg-red-500' : 'bg-gray-300'
        }`}
      >
        <motion.span
          layout
          className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md"
          animate={{ left: isEnabled ? '2rem' : '0.25rem' }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </motion.button>
      <AnimatePresence>
        {isEnabled && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="text-red-500 font-semibold text-sm"
          >
            🚨 Emergency Mode Active (24h)
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
};
```

---

## 9. DOCKER + NGINX SETUP

### 9.1 docker-compose.yml
```yaml
version: '3.9'
services:
  db:
    image: postgres:15
    volumes: [postgres_data:/var/lib/postgresql/data]
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}

  backend:
    build: ./backend
    depends_on: [db, redis]
    env_file: .env
    volumes: [static_files:/app/static]
    command: >
      sh -c "python manage.py migrate &&
             python manage.py collectstatic --noinput &&
             gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 4"

  frontend:
    build: ./frontend
    depends_on: [backend]

  nginx:
    image: nginx:alpine
    ports: ["80:80", "443:443"]
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/certs:/etc/nginx/certs
      - static_files:/static
    depends_on: [backend, frontend]

volumes:
  postgres_data:
  static_files:
```

### 9.2 Nginx Config
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com;
    
    ssl_certificate /etc/nginx/certs/fullchain.pem;
    ssl_certificate_key /etc/nginx/certs/privkey.pem;
    
    # Frontend
    location / {
        proxy_pass http://frontend:3000;
        proxy_set_header Host $host;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://backend:8000;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        client_max_body_size 20M;
    }
    
    # Rate limiting for auth endpoints
    location /api/auth/ {
        limit_req zone=auth_limit burst=10 nodelay;
        proxy_pass http://backend:8000;
    }
}
```

---

## 10. SECURITY CHECKLIST (SENIOR-LEVEL)

### Backend
- [ ] Custom user model with UUID primary keys
- [ ] JWT with short-lived access tokens (30 min) + refresh rotation
- [ ] Rate limiting on /auth/ endpoints (Nginx + DRF throttling)
- [ ] Doctor accounts require admin verification before API access
- [ ] All file URLs are signed + expiring (never public bucket)
- [ ] Emergency tokens: store hash, expose raw only once at generation
- [ ] `secrets.compare_digest` for all token comparisons
- [ ] CORS restricted to frontend domain only
- [ ] SQL injection: use Django ORM only (no raw queries)
- [ ] HTTPS enforced, HSTS headers set

### Frontend
- [ ] JWT stored in `localStorage` only (consider `httpOnly` cookie in production)
- [ ] Auto-logout on 401 after failed refresh
- [ ] No sensitive data in URL params (use POST body)
- [ ] CSP headers configured
- [ ] Input sanitization before API calls

### Infrastructure
- [ ] S3 bucket has NO public access
- [ ] Environment variables in `.env` (never committed to git)
- [ ] Database not exposed to public internet (private subnet)
- [ ] Redis password-protected
- [ ] Logs do not contain PII

---

## 11. IMPLEMENTATION SEQUENCE (BUILD ORDER)

This is the order a senior dev would actually build this:

```
Phase 1: Foundation (Week 1)
├── Django project setup + custom User model
├── PostgreSQL + Redis connection
├── JWT auth endpoints (register/login/refresh/logout)
└── Basic React app + auth flow (login/register pages)

Phase 2: Core Models (Week 1-2)
├── Patient profile + Health ID generation
├── QR code generation + S3 upload
├── Family profile CRUD
└── Frontend: Dashboard shell + family switcher

Phase 3: Medical Records (Week 2)
├── Doctor profile + admin verification flow
├── Medical record CRUD with file upload to S3
├── Signed URL generation for reports
└── Frontend: Doctor dashboard + add record form

Phase 4: Emergency System (Week 2-3)
├── Emergency data model + token generation
├── Public emergency endpoint (no auth)
├── Emergency mode enable/disable
└── Frontend: Emergency toggle + QR display

Phase 5: Audit + Polish (Week 3)
├── Access logging via Django signals
├── Admin panel customization
├── Framer Motion animations throughout
└── Responsive design + dark mode

Phase 6: DevOps (Week 3-4)
├── Docker Compose setup
├── Nginx config + SSL
├── Environment config for production
└── Testing (pytest + React Testing Library)
```

---

## 12. COMMON PITFALLS TO AVOID

| Pitfall | Correct Approach |
|---------|-----------------|
| Storing full S3 URLs in DB | Store S3 key, generate signed URL on-demand |
| Sequential integer IDs on patient records | Use UUID everywhere sensitive |
| Checking permissions only on frontend | Always validate role on every API endpoint |
| Storing raw emergency token | Hash with SHA-256, return raw once |
| One monolithic Django app | Split into focused apps (accounts, records, etc.) |
| Not logging emergency access | Every emergency scan must create an AccessLog |
| Sharing QR code publicly | QR is only valid with backend validation |
| Storing JWT in cookies without httpOnly | Use httpOnly + Secure cookie flags in prod |

---

## 13. ENVIRONMENT VARIABLES (.env)

```bash
# Django
DJANGO_SECRET_KEY=your-secret-key-here
DEBUG=False
DOMAIN=yourdomain.com
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com

# Database
DB_NAME=mediid_db
DB_USER=mediid_user
DB_PASSWORD=strong_password
DB_HOST=db

# Redis
REDIS_URL=redis://:password@redis:6379/0
REDIS_PASSWORD=strong_redis_password

# AWS
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_STORAGE_BUCKET_NAME=mediid-private
AWS_REGION=ap-southeast-1

# Frontend
VITE_API_URL=https://yourdomain.com
```

---

## 14. TESTING STRATEGY

```python
# Example: Role-based access test
class TestMedicalRecordsAPI(TestCase):
    def test_patient_cannot_add_record(self):
        self.client.force_authenticate(user=self.patient_user)
        response = self.client.post('/api/records/add/', self.record_data)
        self.assertEqual(response.status_code, 403)

    def test_unverified_doctor_cannot_add_record(self):
        self.client.force_authenticate(user=self.unverified_doctor)
        response = self.client.post('/api/records/add/', self.record_data)
        self.assertEqual(response.status_code, 403)

    def test_verified_doctor_can_add_record(self):
        self.client.force_authenticate(user=self.verified_doctor)
        response = self.client.post('/api/records/add/', self.record_data)
        self.assertEqual(response.status_code, 201)
```

---

## 15. QUICK-START CHECKLIST FOR ANTI GRAVITY

When you paste this into Anti Gravity (or any AI coding tool), give it these in order:

1. **Start with:** "Set up Django project with custom User model, PostgreSQL, JWT auth"
2. **Then:** "Create Patient, FamilyProfile, DoctorProfile, MedicalRecord, EmergencyData models"
3. **Then:** "Build all API endpoints with RBAC permission classes"
4. **Then:** "Set up React frontend with Axios interceptor, React Query, and auth flow"
5. **Then:** "Build QR generation system and Emergency token system"
6. **Then:** "Add Framer Motion animations to all dashboard components"
7. **Then:** "Docker Compose + Nginx configuration for deployment"

> **Pro tip:** Never ask AI to build the entire system at once. Feed it module by module, in build-order sequence. You'll get 10x better output.

---

*This blueprint covers ~90% of decisions you'll face during implementation. The remaining 10% are context-specific tradeoffs you'll discover in code review.*
