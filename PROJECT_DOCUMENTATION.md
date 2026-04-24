# Bionex Health Identity Platform (formerly MediID)

## 1. Overview and Whole Working
Bionex is an enterprise-grade digital health identity platform that centralizes medical records, family accounts, and emergency protocols. 
- **Patients** generate a secure BIONEX UUID and a corresponding QR code.
- **Doctors/Hospitals** scan the patient's QR code using hardware cameras to instantly verify identity and access medical histories without physical paperwork.
- **System Flow**: The user signs up, the system generates a unique UUID. This UUID is converted into a scannable QR code. When a verified medical professional scans this code, they are granted role-based access to append to the patient's immutable medical timeline.

## 2. System Architecture
The application follows a modern decoupled Client-Server architecture:
- **Client (Frontend)**: A Single Page Application (SPA) built with React and TypeScript, communicating with the backend via RESTful APIs. It handles all UI rendering, complex animations (Framer Motion), hardware camera access (html5-qrcode), and local state management.
- **Server (Backend)**: A monolithic Django application exposing a REST API via Django REST Framework (DRF). It handles core business logic, role-based access control (RBAC), database interactions, and secure token generation (JWT).
- **Database**: Relational database (SQLite/PostgreSQL) storing Users, Profiles, Timelines, and Medical Records.

## 3. Tech Stack Used & How They Help

### Frontend
* **React 18 & TypeScript**: Provides a robust, component-based UI architecture with strict type safety to prevent runtime errors in critical healthcare logic.
* **Vite**: Offers lightning-fast Hot Module Replacement (HMR) and optimized production bundling.
* **Framer Motion**: Powers the premium, cinematic animations (e.g., multi-stage boot sequence, shared layout transitions, glassmorphic UI elements). It helps create an "enterprise yet modern" feel that builds user trust.
* **Zustand**: A lightweight state management tool used for handling global authentication state across the application without the boilerplate of Redux.
* **TanStack React Query**: Manages server state, caching, and data fetching, ensuring the dashboard data is always fresh and synced across components.
* **HTML5-QRCode**: Provides native hardware camera access to scan patient QR codes directly from the browser, critical for the Doctor workflow.

### Backend
* **Django & Python**: A highly secure, "batteries-included" web framework that excels at rapid development and secure data handling.
* **Django REST Framework (DRF)**: Simplifies the creation of robust web APIs, providing powerful serialization and routing.
* **JSON Web Tokens (JWT)**: Ensures stateless, secure authentication. Roles (Patient, Doctor, Admin) are encoded and verified on every request.

## 4. Main Logics & Workflows

1. **Role-Based Access Control (RBAC)**:
   - Users are strictly segmented into `patient`, `doctor`, and `admin` roles at the database level. The frontend utilizes a `<ProtectedRoute>` component to intercept unauthorized navigations based on the JWT token contents.
   
2. **Cinematic Boot & Auth State Sync**:
   - On app load, a multi-stage `BootScreen` runs while the app hydrates the auth state from local storage and verifies the JWT token. Once verified, the boot screen smoothly transitions into the authenticated application.

3. **QR Code Generation & Scanning**:
   - *Patient Side*: The user's unique UUID is rendered into a visual QR code using `react-qr-code`.
   - *Doctor Side*: The dashboard implements `html5-qrcode` to bind to the device's camera stream. The scanner features a custom holographic 3D UI that transitions states (Scanning -> Authenticating -> Verified) before routing the doctor to the specific patient's timeline.

4. **PDF Generation Logic**:
   - Patients can download their medical records. The logic involves dynamically injecting CSS into a hidden print window and triggering the browser's native PDF generation API to create branded, formatted documents.

## 5. Future Scope
* **Hardware Integration**: Integration with physical NFC cards or smart wristbands as physical manifestations of the Bionex ID.
* **Blockchain/Immutable Logs**: Migrating the medical timeline to a private blockchain or ledger database (like Amazon QLDB) to guarantee cryptographic immutability of audit logs.
* **AI Health Insights**: Analyzing the longitudinal medical timeline data to provide predictive health warnings (e.g., spotting adverse drug interactions across different specialists).
* **Emergency Responder Mode**: A specialized low-latency app mode for EMTs to scan a user's code and bypass standard auth to view *only* critical allergies and blood type information during emergencies.
