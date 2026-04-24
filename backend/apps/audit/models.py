"""
Audit Log model.
Tracks all critical actions in the system.
"""
from django.db import models
from django.conf import settings


class AccessLog(models.Model):
    id = models.BigAutoField(primary_key=True)
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='performed_actions'
    )
    actor_role = models.CharField(max_length=20, null=True, blank=True)
    
    patient_id = models.UUIDField(null=True, blank=True)
    patient_type = models.CharField(max_length=20, null=True, blank=True)
    
    action = models.CharField(max_length=50) # 'view_record', 'add_record', 'emergency_access', 'login'
    
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    
    metadata = models.JSONField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Access Log'
        verbose_name_plural = 'Access Logs'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['patient_id']),
            models.Index(fields=['timestamp']),
        ]

    def __str__(self):
        actor_name = self.actor.name if self.actor else "Anonymous"
        return f"{self.action} by {actor_name} on {self.timestamp}"
