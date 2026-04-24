"""
Medical Records model.
"""
import uuid
import os
from django.db import models
from apps.doctors.models import DoctorProfile
from core.storage import save_uploaded_file


def record_file_upload_path(instance, filename):
    """Generate path for uploaded report files."""
    ext = filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    return f"medical_reports/{instance.patient_id}/{filename}"


class MedicalRecord(models.Model):
    PATIENT_TYPES = [
        ('user', 'User'),
        ('family', 'Family Profile')
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient_id = models.UUIDField()
    patient_type = models.CharField(max_length=20, choices=PATIENT_TYPES)
    doctor = models.ForeignKey(DoctorProfile, on_delete=models.SET_NULL, null=True, related_name='medical_records')
    
    diagnosis = models.TextField()
    prescription = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    
    # We store the relative path. 
    # In dev, this is the MEDIA_ROOT path. In prod, this would be the S3 key.
    report_file_key = models.CharField(max_length=512, blank=True, null=True)
    
    record_date = models.DateField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Medical Record'
        verbose_name_plural = 'Medical Records'
        ordering = ['-record_date', '-created_at']

    def __str__(self):
        return f"Record for {self.patient_id} on {self.record_date}"
