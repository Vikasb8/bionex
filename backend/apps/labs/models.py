"""
Lab Department models.
LabProfile: verified lab technician profile.
LabTest: test prescribed by a doctor, processed by lab, verified by doctor.
"""
import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone
from apps.doctors.models import DoctorProfile


class LabProfile(models.Model):
    """Profile for lab technicians — requires admin verification."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='lab_profile',
        limit_choices_to={'role': 'lab'}
    )
    lab_name = models.CharField(max_length=255)
    department = models.CharField(max_length=100)
    license_number = models.CharField(max_length=100, unique=True)
    is_verified = models.BooleanField(default=False)
    verified_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Lab Profile'
        verbose_name_plural = 'Lab Profiles'

    def __str__(self):
        return f"{self.user.name} - {self.lab_name} ({self.department})"

    def verify(self):
        """Mark lab technician as verified."""
        self.is_verified = True
        self.verified_at = timezone.now()
        self.save(update_fields=['is_verified', 'verified_at'])

        # Also update the user model
        self.user.is_verified = True
        self.user.save(update_fields=['is_verified'])


class LabTest(models.Model):
    """
    A lab test prescribed by a doctor for a patient.
    Lifecycle: PENDING -> COMPLETED (by lab) -> VERIFIED/REJECTED (by doctor)
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('verified', 'Verified'),
        ('rejected', 'Rejected'),
    ]

    PATIENT_TYPES = [
        ('user', 'User'),
        ('family', 'Family Profile'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient_id = models.UUIDField()
    patient_type = models.CharField(max_length=20, choices=PATIENT_TYPES, default='user')

    doctor = models.ForeignKey(
        DoctorProfile,
        on_delete=models.SET_NULL,
        null=True,
        related_name='prescribed_tests'
    )
    lab_technician = models.ForeignKey(
        LabProfile,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='processed_tests'
    )

    test_name = models.CharField(max_length=255)
    test_description = models.TextField(blank=True)

    # Lab fills these in
    result = models.TextField(blank=True, null=True)
    result_file_key = models.CharField(max_length=512, blank=True, null=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    doctor_remarks = models.TextField(blank=True, null=True)

    prescribed_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    verified_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = 'Lab Test'
        verbose_name_plural = 'Lab Tests'
        ordering = ['-prescribed_at']

    def __str__(self):
        return f"{self.test_name} for {self.patient_id} - {self.status}"
