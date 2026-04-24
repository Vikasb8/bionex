"""
MediID — Development Settings
SQLite, debug mode, permissive CORS.
"""
from .base import *

DEBUG = True

ALLOWED_HOSTS = ['*']

# SQLite for local development
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# CORS — allow frontend dev server
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True
