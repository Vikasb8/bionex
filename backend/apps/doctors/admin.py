from django.contrib import admin
from .models import DoctorProfile


@admin.register(DoctorProfile)
class DoctorProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'hospital_name', 'specialization', 'license_number', 'is_verified', 'verified_at')
    list_filter = ('is_verified', 'specialization')
    search_fields = ('user__name', 'user__email', 'hospital_name', 'license_number')
    actions = ['verify_doctors']

    def verify_doctors(self, request, queryset):
        for profile in queryset:
            profile.verify()
        self.message_user(request, f"{queryset.count()} doctors verified.")
    verify_doctors.short_description = "Verify selected doctors"
