from django.urls import path
from .views import PatientMeView, PatientByHealthIDView

urlpatterns = [
    path('me/', PatientMeView.as_view(), name='patient-me'),
    path('<str:health_id>/', PatientByHealthIDView.as_view(), name='patient-by-health-id'),
]
