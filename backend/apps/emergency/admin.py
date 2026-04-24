from django.contrib import admin
from .models import EmergencyData

@admin.register(EmergencyData)
class EmergencyDataAdmin(admin.ModelAdmin):
    list_display = ('id', 'patient_id', 'patient_type', 'is_emergency_mode_enabled', 'token_expires_at', 'updated_at')
    list_filter = ('patient_type', 'is_emergency_mode_enabled')
    search_fields = ('patient_id', 'blood_group', 'emergency_contact_name')
    readonly_fields = ('id', 'updated_at')
