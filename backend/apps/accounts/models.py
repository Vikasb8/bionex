"""
Custom User Model for MediID.
UUID primary keys, email auth, role-based access, auto-generated Health IDs.
"""
import uuid
import random
import string
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from .managers import UserManager


class User(AbstractBaseUser, PermissionsMixin):
    ROLES = [
        ('patient', 'Patient'),
        ('doctor', 'Doctor'),
        ('admin', 'Admin'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLES)
    unique_health_id = models.CharField(max_length=20, unique=True, null=True, blank=True)
    qr_code_url = models.TextField(null=True, blank=True)
    phone = models.CharField(max_length=20, null=True, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    address = models.TextField(null=True, blank=True)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return f"{self.name} ({self.email}) - {self.role}"

    def save(self, *args, **kwargs):
        # Auto-generate Health ID for patients
        if self.role == 'patient' and not self.unique_health_id:
            self.unique_health_id = self._generate_health_id()
        super().save(*args, **kwargs)

    def _generate_health_id(self):
        """Generate a unique Health ID in format MID-XXXX-XXXX."""
        while True:
            digits = ''.join(random.choices(string.digits, k=4))
            letters = ''.join(random.choices(string.ascii_uppercase, k=4))
            hid = f"MID-{digits}-{letters}"
            if not User.objects.filter(unique_health_id=hid).exists():
                return hid 
                