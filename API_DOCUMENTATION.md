# Bionex API Architecture & Data Flow

This document provides a comprehensive overview of how the Bionex healthcare platform handles data fetching, the types of APIs available, and how the React frontend securely communicates with the Django backend.

## 1. Architecture Overview

Bionex operates on a **decoupled Client-Server architecture**:
*   **Frontend**: React (TypeScript/Vite)
*   **Backend**: Django REST Framework (DRF)
*   **Communication**: RESTful JSON APIs over HTTP
*   **Authentication**: JSON Web Tokens (JWT) using `djangorestframework-simplejwt`

## 2. API Communication Client (`api/client.ts`)

The React frontend does not use standard `fetch()` or raw `axios` calls across components. Instead, it uses a centralized, highly-configured Axios instance (`frontend/src/api/client.ts`). 

### Key Features of the API Client:
1.  **Base URL Proxy**: Requests are sent to `/api/...`, which Vite's dev server proxies to `http://localhost:8000` (the Django backend).
2.  **Request Interceptor**: Automatically attaches the current `Bearer <accessToken>` from the Zustand `authStore` to the HTTP Headers of every outgoing request.
3.  **Response Interceptor (Auto-Refresh)**: If an API responds with `401 Unauthorized` (meaning the access token expired), the client catches the error, automatically makes a background request to `/api/auth/refresh/` using the stored `refreshToken`, and replays the original failed request seamlessly.

## 3. Types of API Endpoints

The backend DRF server provides several modular apps, each exposing specific API endpoints:

### A. Authentication & User Management (`/api/auth/`)
Handles core identity, login, and Role-Based Access Control (RBAC).
*   `POST /api/auth/register/`: Creates a new User (Patient, Doctor, or Admin). Generates a unique `unique_health_id` and standard QR code for patients.
*   `POST /api/auth/login/`: Validates credentials and returns JWT Access and Refresh tokens.
*   `POST /api/auth/refresh/`: Trades a valid refresh token for a new access token.
*   `GET /api/auth/profile/`: Returns the currently authenticated user's profile data.
*   `PUT /api/auth/profile/update/`: Updates user demographics.

### B. Patient & Family Network (`/api/patient/` & `/api/family/`)
Handles the lookup of patients and their dependent family members.
*   `GET /api/patient/lookup/<health_id>/`: Allows doctors to fetch a patient's core profile using their scanned Bionex ID.
*   `GET /api/family/`: Lists dependents connected to the logged-in patient's account.
*   `POST /api/family/`: Registers a new dependent (e.g., child, elderly parent) and automatically generates a unique Bionex ID and QR code for them.

### C. Electronic Health Records (EHR) (`/api/records/`)
Handles medical history, prescriptions, and file attachments.
*   `GET /api/records/<patient_id>/`: Retrieves the full timeline of medical records for a specific patient. Protected by permissions (only the patient, their family owner, or a verified doctor can access).
*   `POST /api/records/add/`: Allows a verified Doctor to upload a new record, diagnosis, and PDF/Image report.
*   `GET /api/records/file/<record_id>/`: Generates and returns a secure, absolute URL to view an attached medical document.

### D. Emergency Protocol (`/api/emergency/`)
Handles critical care scenarios.
*   `GET /api/emergency/status/`: Checks if a patient currently has emergency mode enabled.
*   `POST /api/emergency/toggle/`: Activates or deactivates emergency mode, generating a secure, hashed, time-limited emergency token.
*   `GET /api/emergency/access/<token>/`: **Publicly accessible endpoint**. Allows a paramedic to scan an emergency QR code and retrieve critical data (Blood group, allergies) *without* logging in.

### E. Auditing & Security (`/api/audit/`)
Tracks access for HIPAA compliance.
*   `GET /api/audit/logs/`: Allows patients to see exactly which doctor viewed their records and when. Every `GET` request to `/api/records/` triggers a background write to the Audit Log.

## 4. Data Fetching Workflow Example (Doctor Scanning QR)

1.  **Scan**: Doctor scans a patient's QR code via the React UI.
2.  **Parse**: Frontend parses the JSON payload to extract `{"health_id": "MID-1234-ABCD"}`.
3.  **Lookup**: Frontend calls `api.get('/api/patient/lookup/MID-1234-ABCD/')`. The `api/client.ts` attaches the Doctor's JWT.
4.  **Validate**: Django receives the request, verifies the JWT, and checks if the User has `role='doctor'` and `is_verified=True`.
5.  **Return Data**: DRF queries the PostgreSQL database for the patient and returns the profile JSON.
6.  **Fetch History**: The frontend immediately chains a second request: `api.get('/api/records/<patient_id>/')` to pull the medical history timeline.
7.  **Render**: React state (`useState`) is updated with the fetched records, and Framer Motion animates the data onto the screen.
