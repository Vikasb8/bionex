"""
Family Profile model — one account can manage multiple health profiles.
"""
import uuid
import random
import string
from django.db import models
from django.conf import settings


class FamilyProfile(models.Model):
    RELATIONS = [
        ('child', 'Child'),
        ('parent', 'Parent'),
        ('spouse', 'Spouse'),
        ('sibling', 'Sibling'),
        ('other', 'Other'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='family_members',
    )
    member_name = models.CharField(max_length=255)
    date_of_birth = models.DateField(null=True, blank=True)
    relation = models.CharField(max_length=50, choices=RELATIONS)
    unique_health_id = models.CharField(max_length=20, unique=True)
    qr_code_url = models.TextField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Family Profile'
        verbose_name_plural = 'Family Profiles'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.member_name} ({self.relation} of {self.owner.name})"

    def save(self, *args, **kwargs):
        if not self.unique_health_id:
            self.unique_health_id = self._generate_health_id()
        super().save(*args, **kwargs)

    def _generate_health_id(self):
        """Generate a unique Health ID for family member."""
        while True:
            digits = ''.join(random.choices(string.digits, k=4))
            letters = ''.join(random.choices(string.ascii_uppercase, k=4))
            hid = f"MID-{digits}-{letters}"
            if not FamilyProfile.objects.filter(unique_health_id=hid).exists():
                from django.contrib.auth import get_user_model
                User = get_user_model()
                if not User.objects.filter(unique_health_id=hid).exists():
                    return hid
