"""
Audit logging utility.
"""
from .models import AccessLog


def get_client_ip(request):
    """Extract IP address from request."""
    if not request:
        return None
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0]
    return request.META.get('REMOTE_ADDR')


def log_action(actor=None, patient_id=None, patient_type=None, action=None, metadata=None, request=None):
    """
    Helper to create an AccessLog entry.
    """
    if not action:
        return None
        
    actor_role = getattr(actor, 'role', None) if actor else 'anonymous'
    
    ip_address = get_client_ip(request) if request else None
    user_agent = request.META.get('HTTP_USER_AGENT', '') if request else None

    return AccessLog.objects.create(
        actor=actor,
        actor_role=actor_role,
        patient_id=patient_id,
        patient_type=patient_type,
        action=action,
        ip_address=ip_address,
        user_agent=user_agent,
        metadata=metadata
    )
