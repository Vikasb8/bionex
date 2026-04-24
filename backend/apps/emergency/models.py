"""
Emergency data and token system.
"""
import uuid
import secrets
import hashlib
from datetime import timedelta
from django.db import models
from django.utils import timezone


class EmergencyData(models.Model):
    PATIENT_TYPES = [
        ('user', 'User'),
        ('family', 'Family Profile')
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient_id = models.UUIDField(unique=True)
    patient_type = models.CharField(max_length=20, choices=PATIENT_TYPES)
    
    blood_group = models.CharField(max_length=5, blank=True)
    allergies = models.JSONField(default=list, blank=True) # Used JSONField for simplicity in SQLite instead of ArrayField
    chronic_conditions = models.JSONField(default=list, blank=True)
    current_medications = models.JSONField(default=list, blank=True)
    
    emergency_contact_name = models.CharField(max_length=255, blank=True)
    emergency_contact_phone = models.CharField(max_length=20, blank=True)
    emergency_contact_relation = models.CharField(max_length=50, blank=True)
    
    is_emergency_mode_enabled = models.BooleanField(default=False)
    emergency_token = models.CharField(max_length=64, unique=True, null=True, blank=True) # Hash of token
    token_expires_at = models.DateTimeField(null=True, blank=True)
    
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Emergency Data'
        verbose_name_plural = 'Emergency Data'

    def __str__(self):
        return f"Emergency Data for {self.patient_id}"

    def enable_emergency_mode(self, hours=24):
        """Generate a secure emergency token valid for N hours."""
        raw_token = secrets.token_urlsafe(32)
        self.emergency_token = hashlib.sha256(raw_token.encode()).hexdigest()
        self.token_expires_at = timezone.now() + timedelta(hours=hours)
        self.is_emergency_mode_enabled = True
        self.save()
        return raw_token  # Return RAW token to embed in QR — never store raw

    def disable_emergency_mode(self):
        self.is_emergency_mode_enabled = False
        self.emergency_token = None
        self.token_expires_at = None
        self.save()

    def validate_emergency_token(self, raw_token):
        """Validate a token presented by a scanner."""
        if not self.is_emergency_mode_enabled:
            return False
        if not self.token_expires_at or timezone.now() > self.token_expires_at:
            self.disable_emergency_mode()
            return False
        
        hashed = hashlib.sha256(raw_token.encode()).hexdigest()
        return secrets.compare_digest(hashed, self.emergency_token)
