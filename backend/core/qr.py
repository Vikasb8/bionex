"""
QR Code generation for MediID.
Generates QR codes and saves them to local media storage.
"""
import json
import io
import os
import qrcode
from django.conf import settings


def generate_qr_code(data: dict, filename: str) -> str:
    """
    Generate a QR code image and save to MEDIA_ROOT.
    Returns the relative media path.
    
    Args:
        data: Dictionary to encode in QR (e.g., {"type": "standard", "health_id": "MID-1234-ABCD"})
        filename: Base filename without extension
    
    Returns:
        Relative path to the saved QR image (e.g., "qr-codes/MID-1234-ABCD.png")
    """
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    qr.add_data(json.dumps(data))
    qr.make(fit=True)
    img = qr.make_image(fill_color="#0f172a", back_color="white")

    # Ensure directory exists
    qr_dir = os.path.join(settings.MEDIA_ROOT, 'qr-codes')
    os.makedirs(qr_dir, exist_ok=True)

    relative_path = f"qr-codes/{filename}.png"
    full_path = os.path.join(settings.MEDIA_ROOT, relative_path)

    img.save(full_path)
    return relative_path


def generate_standard_qr(health_id: str) -> str:
    """Generate a standard QR code for a health ID."""
    data = {
        "type": "standard",
        "health_id": health_id,
        "version": 1,
    }
    return generate_qr_code(data, health_id)


def generate_emergency_qr(token: str, health_id: str) -> str:
    """Generate an emergency QR code with a time-limited token."""
    data = {
        "type": "emergency",
        "token": token,
        "version": 1,
    }
    return generate_qr_code(data, f"emergency-{health_id}")
