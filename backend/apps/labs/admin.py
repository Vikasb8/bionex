"""
Lab Department admin configuration.
"""
from django.contrib import admin
from .models import LabProfile, LabTest


@admin.register(LabProfile)
class LabProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'lab_name', 'department', 'license_number', 'is_verified')
    list_filter = ('is_verified', 'department')
    search_fields = ('user__name', 'lab_name', 'license_number')


@admin.register(LabTest)
class LabTestAdmin(admin.ModelAdmin):
    list_display = ('test_name', 'patient_id', 'doctor', 'lab_technician', 'status', 'prescribed_at')
    list_filter = ('status',)
    search_fields = ('test_name', 'patient_id')
