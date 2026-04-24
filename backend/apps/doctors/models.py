"""
Doctor Profile model.
Doctors must be verified by an admin before they can add medical records.
"""
import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone


class DoctorProfile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='doctor_profile',
        limit_choices_to={'role': 'doctor'}
    )
    hospital_name = models.CharField(max_length=255)
    specialization = models.CharField(max_length=100)
    license_number = models.CharField(max_length=100, unique=True)
    is_verified = models.BooleanField(default=False)
    verified_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Doctor Profile'
        verbose_name_plural = 'Doctor Profiles'

    def __str__(self):
        return f"Dr. {self.user.name} - {self.specialization}"

    def verify(self):
        """Mark doctor as verified."""
        self.is_verified = True
        self.verified_at = timezone.now()
        self.save(update_fields=['is_verified', 'verified_at'])
        
        # Also update the user model
        self.user.is_verified = True
        self.user.save(update_fields=['is_verified'])
