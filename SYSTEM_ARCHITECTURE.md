# Bionex Healthcare Platform: System Architecture

This document outlines the high-level system architecture, technology stack, and component interactions for the Bionex Healthcare Platform.

## 1. High-Level Architecture Diagram

The platform follows a decoupled client-server architecture where the React frontend communicates with the Django REST API over HTTP/REST protocols.

```mermaid
graph TD
    %% Define styles
    classDef frontend fill:#3b82f6,stroke:#1d4ed8,stroke-width:2px,color:#fff
    classDef backend fill:#10b981,stroke:#047857,stroke-width:2px,color:#fff
    classDef database fill:#f59e0b,stroke:#b45309,stroke-width:2px,color:#fff
    classDef actor fill:#6366f1,stroke:#4338ca,stroke-width:2px,color:#fff,rx:20,ry:20

    %% Actors
    Patient((Patient)):::actor
    Doctor((Doctor)):::actor
    LabTech((Lab Technician)):::actor
    Admin((Admin)):::actor
    Emergency((Emergency Responder)):::actor

    %% Frontend Components
    subgraph Frontend [React.js + Vite Client]
        UI[User Interface <br/> Framer Motion]:::frontend
        State[Zustand State Management <br/> Auth & Modals]:::frontend
        API_Client[Axios API Client <br/> JWT Interceptor]:::frontend
        Scanner[HTML5 QR Scanner]:::frontend
        
        UI --> State
        UI --> Scanner
        State --> API_Client
    end

    %% Backend Components
    subgraph Backend [Django REST Framework API]
        Auth_App[Accounts / Auth Service <br/> JWT & RBAC]:::backend
        Records_App[Medical Records Service]:::backend
        Labs_App[Lab Tests Service]:::backend
        Emergency_App[Emergency Access Service]:::backend
        Audit_App[Audit Logging Service]:::backend
        Storage[Local File Storage <br/> AWS S3 Ready]:::backend
        
        Auth_App <--> Records_App
        Auth_App <--> Labs_App
        Records_App <--> Audit_App
        Labs_App <--> Audit_App
    end

    %% Database
    DB[(Relational Database <br/> SQLite / PostgreSQL)]:::database

    %% Connections
    Patient -->|Access Dashboard| UI
    Doctor -->|Scan QR & Write Records| UI
    LabTech -->|Scan QR & Submit Results| UI
    Admin -->|Verify Roles & View Logs| UI
    Emergency -->|Scan SOS Token| UI

    Scanner -->|Decodes QR JSON| UI
    API_Client -->|HTTP / JSON requests| Auth_App
    API_Client -->|Read/Write Records| Records_App
    API_Client -->|Prescribe/Submit Tests| Labs_App
    API_Client -->|Access Critical Info| Emergency_App
    
    Auth_App --> DB
    Records_App --> DB
    Labs_App --> DB
    Emergency_App --> DB
    Audit_App --> DB
    
    Records_App -->|Attachments| Storage
    Labs_App -->|Lab Reports| Storage
```

---

## 2. Component Breakdown

### Frontend (Client-Side)
- **Framework:** React.js initialized with Vite for rapid Hot Module Replacement (HMR) and optimized production builds.
- **Language:** TypeScript for strict type checking, preventing runtime errors related to complex medical data structures.
- **State Management:** `Zustand` is utilized for lightweight, global state management, specifically handling the authentication state (`authStore`) and storing the user profile context.
- **API Client:** `Axios` is configured with request and response interceptors. It automatically attaches JWT access tokens to secure requests and silently refreshes tokens in the background if they expire.
- **Styling:** Centralized CSS variables architecture (`index.css`) supporting dynamic theming (Light/Dark mode) with native CSS variables.
- **Animations:** `Framer Motion` powers the immersive, premium micro-animations (e.g., page transitions, modal pop-ups, scanner visualizations).
- **Scanner:** `html5-qrcode` library captures camera feeds to decode encrypted or stringified Bionex UUID JSON payloads.

### Backend (Server-Side)
- **Framework:** Django combined with Django REST Framework (DRF) provides a highly secure, ORM-backed REST API.
- **Authentication:** `djangorestframework-simplejwt` provides stateless JSON Web Tokens. Access tokens are short-lived, while refresh tokens securely extend sessions.
- **Role-Based Access Control (RBAC):** Custom Django permission classes ensure that API endpoints are rigidly locked down. (e.g., Only an approved doctor can write to the `Records` app).
- **Audit Logging:** Every critical action (viewing a record, scanning a patient, verifying a doctor) triggers a signal that writes an immutable record to the `Audit` app.

### Database
- **Engine:** SQLite for local development (easily migratable to PostgreSQL for production environments).
- **Schema Focus:** Highly relational structure connecting the core custom `User` model to `DoctorProfile`, `LabProfile`, `MedicalRecord`, and `LabTest` entities.

### File Storage
- **Media System:** Django's native storage backend handles file attachments (prescriptions, lab reports, avatar images). Files are served dynamically.

---

## 3. Core Interaction Workflows

### The Scanning Workflow (Doctor / Lab Tech)
1. The **Actor** opens the scanner via the UI.
2. The **Scanner Component** accesses the device camera and decodes the patient's QR code.
3. The UI parses the `{"health_id": "MID-XXXX-XXXX"}` JSON payload.
4. The **Axios Client** sends a search query to the backend.
5. The **Backend** validates the Doctor/Lab Tech's authorization, logs the access event in the **Audit DB**, and returns the patient data.

### The Emergency Workflow
1. A bystander or paramedic scans a patient's **Emergency SOS QR Code**.
2. The user is redirected to the `/emergency/:token` public route.
3. The frontend passes the encrypted token to the **Emergency Service** API.
4. The backend decrypts the token, validates its expiry, and returns only critical, life-saving information (blood type, allergies) without requiring a login.
