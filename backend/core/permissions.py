"""
RBAC Permission Classes for MediID.
Backend is the single source of truth for all permissions.
"""
from rest_framework.permissions import BasePermission


class IsPatient(BasePermission):
    """Allow access only to authenticated patients."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'patient'


class IsDoctor(BasePermission):
    """Allow access only to authenticated AND verified doctors."""
    def has_permission(self, request, view):
        if not (request.user.is_authenticated and request.user.role == 'doctor'):
            return False
        return hasattr(request.user, 'doctor_profile') and request.user.doctor_profile.is_verified


class IsAdmin(BasePermission):
    """Allow access only to admin users."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'


class IsDoctorOrAdmin(BasePermission):
    """Allow access to doctors (verified) or admins."""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.user.role == 'admin':
            return True
        if request.user.role == 'doctor':
            return hasattr(request.user, 'doctor_profile') and request.user.doctor_profile.is_verified
        return False


class IsOwnerOrDoctorOrAdmin(BasePermission):
    """Allow patient to access own data, or doctors/admins to access any."""
    def has_object_permission(self, request, view, obj):
        if request.user.role in ['doctor', 'admin']:
            return True
        # Check if the patient owns this resource
        if hasattr(obj, 'patient_id'):
            return str(obj.patient_id) == str(request.user.id)
        if hasattr(obj, 'owner_id'):
            return str(obj.owner_id) == str(request.user.id)
        return False
