"""
MediID — Root URL Configuration
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.accounts.urls')),
    path('api/patient/', include('apps.patients.urls')),
    path('api/family/', include('apps.family.urls')),
    path('api/records/', include('apps.records.urls')),
    path('api/emergency/', include('apps.emergency.urls')),
    path('api/admin/doctors/', include('apps.doctors.urls')),
    path('api/audit/', include('apps.audit.urls')),
    path('api/labs/', include('apps.labs.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
