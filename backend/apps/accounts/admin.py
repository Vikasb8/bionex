"""
Custom admin registration for User model.
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'name', 'role', 'unique_health_id', 'is_active', 'is_verified', 'created_at')
    list_filter = ('role', 'is_active', 'is_verified')
    search_fields = ('email', 'name', 'unique_health_id')
    ordering = ('-created_at',)

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('name', 'phone', 'date_of_birth', 'address')}),
        ('MediID', {'fields': ('role', 'unique_health_id', 'qr_code_url')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'is_verified')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'name', 'role', 'password1', 'password2'),
        }),
    )
