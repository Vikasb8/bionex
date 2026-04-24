# Bionex ID & QR Code Generation Workflow

This document explains the cryptographic generation, formatting, and scanning processes used to identify users globally across the Bionex healthcare platform.

## 1. The Bionex ID (`unique_health_id`)

Every patient and family dependent registered on the platform is assigned a globally unique Bionex ID.

### Generation Logic (`_generate_health_id`)
The generation logic is encapsulated within the Django `User` and `FamilyProfile` models. When a new patient profile is saved to the database without an ID, the system auto-generates one.

1.  **Format**: `MID-XXXX-XXXX`
2.  **Algorithm**:
    *   Generates 4 random numeric digits (e.g., `8392`).
    *   Generates 4 random uppercase alphabetical characters (e.g., `PLZQ`).
    *   Concatenates them with the "MID" (Medical ID) prefix: `MID-8392-PLZQ`.
3.  **Uniqueness Guarantee**: Before assigning the ID, the backend queries the database (`User.objects.filter(unique_health_id=hid).exists()`). If a collision occurs (statistically highly improbable), it loops and generates a new one until a completely unique ID is found.

## 2. Standard QR Code Generation

The platform utilizes the Python `qrcode` library to generate physical QR code images (`backend/core/qr.py`).

### Payload Structure
Instead of just embedding a raw string URL or ID, Bionex embeds a structured JSON payload. This allows the frontend scanner to intelligently understand what *type* of data it just scanned.

For a standard patient:
```json
{
  "type": "standard",
  "health_id": "MID-8392-PLZQ",
  "version": 1
}
```

### Image Creation
*   The JSON payload is converted to a string and injected into the QR grid using high error correction (`ERROR_CORRECT_H`). High error correction allows the QR code to be scanned successfully even if the image is partially damaged or covered by dirt (up to 30% damage recovery).
*   The generated PNG image is securely saved to the server's `MEDIA_ROOT/qr-codes/` directory.
*   A relative path to the image is saved to the user's database profile, which the frontend renders on the Patient Dashboard.

## 3. Emergency QR Code Generation

When a patient activates "Emergency Mode," their standard QR code is temporarily hidden and replaced with an Emergency QR code.

### Cryptographic Token
Instead of exposing the patient's `MID`, the system generates a secure, randomized token using Python's `secrets.token_urlsafe(32)`. This token acts as a temporary, anonymous key.

### Payload Structure
```json
{
  "type": "emergency",
  "token": "a8Bf3_X9zLqP2vM1cT5kR...",
  "version": 1
}
```
This QR code is physically different. If someone scans it, they do not learn the patient's ID, only their emergency protocol via the public API route.

## 4. The Scanning Mechanism

The frontend uses the `html5-qrcode` library to interface with the device's physical camera hardware.

### Scanner Initialization (`frontend/src/pages/doctor/Dashboard.tsx`)
*   The scanner is heavily optimized for speed. It runs at **30 Frames Per Second (FPS)**.
*   It is restricted via `formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE]` to *only* look for QR codes, ignoring 1D barcodes. This dramatically lowers CPU usage and speeds up detection times.

### Scanning Workflow
1.  **Capture**: The camera feed continuously passes frames to the HTML5 canvas.
2.  **Decode**: When the engine detects the positioning squares of a QR code, it decodes the matrix into a string.
3.  **Parse**: The frontend React code intercepts the string and parses it via `JSON.parse()`.
4.  **Routing Logic**:
    *   **If `type === 'standard'`**: It extracts the `health_id` and triggers the DRF API call to fetch the patient's Electronic Health Records.
    *   **If `type === 'emergency'`**: It bypasses the standard authentication checks and forcibly redirects the browser to `window.location.href = '/emergency/<token>'`. The Emergency View component then mounts, fetching the life-saving protocol data publicly.
