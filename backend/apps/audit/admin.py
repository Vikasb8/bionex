from django.contrib import admin
from .models import AccessLog

@admin.register(AccessLog)
class AccessLogAdmin(admin.ModelAdmin):
    list_display = ('timestamp', 'action', 'actor_role', 'actor', 'patient_id', 'ip_address')
    list_filter = ('action', 'actor_role', 'timestamp')
    search_fields = ('actor__name', 'actor__email', 'patient_id', 'action')
    readonly_fields = [f.name for f in AccessLog._meta.fields]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
        
    def has_delete_permission(self, request, obj=None):
        return False
