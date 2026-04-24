from django.contrib import admin
from .models import MedicalRecord


@admin.register(MedicalRecord)
class MedicalRecordAdmin(admin.ModelAdmin):
    list_display = ('id', 'patient_id', 'patient_type', 'doctor', 'record_date', 'created_at')
    list_filter = ('patient_type', 'record_date')
    search_fields = ('patient_id', 'doctor__user__name', 'diagnosis')
    readonly_fields = ('id', 'created_at')
