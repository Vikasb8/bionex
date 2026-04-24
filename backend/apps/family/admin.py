from django.contrib import admin
from .models import FamilyProfile


@admin.register(FamilyProfile)
class FamilyProfileAdmin(admin.ModelAdmin):
    list_display = ('member_name', 'owner', 'relation', 'unique_health_id', 'is_active', 'created_at')
    list_filter = ('relation', 'is_active')
    search_fields = ('member_name', 'unique_health_id', 'owner__name')
