from django.urls import path
from .views import PendingDoctorsView, VerifyDoctorView, DoctorProfileCreateUpdateView

urlpatterns = [
    path('pending/', PendingDoctorsView.as_view(), name='doctors-pending'),
    path('<uuid:pk>/verify/', VerifyDoctorView.as_view(), name='doctors-verify'),
    path('profile/', DoctorProfileCreateUpdateView.as_view(), name='doctors-profile'),
]
