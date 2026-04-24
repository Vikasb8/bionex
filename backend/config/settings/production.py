"""
MediID — Production Settings
PostgreSQL, S3, strict security.
"""
import os
from .base import *

DEBUG = False

ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '').split(',')

# PostgreSQL
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME', 'mediid_db'),
        'USER': os.environ.get('DB_USER', 'mediid_user'),
        'PASSWORD': os.environ.get('DB_PASSWORD', ''),
        'HOST': os.environ.get('DB_HOST', 'db'),
        'PORT': '5432',
        'CONN_MAX_AGE': 60,
    }
}

# Security
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# CORS
CORS_ALLOWED_ORIGINS = [
    os.environ.get('FRONTEND_URL', 'https://yourdomain.com'),
]
CORS_ALLOW_CREDENTIALS = True
