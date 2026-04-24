from django.urls import path
from .views import EmergencyDataManageView, EmergencyModeToggleView, PublicEmergencyView

urlpatterns = [
    path('<uuid:patient_id>/manage/', EmergencyDataManageView.as_view(), name='emergency-manage'),
    path('<uuid:patient_id>/toggle/', EmergencyModeToggleView.as_view(), name='emergency-toggle'),
    path('access/<str:token>/', PublicEmergencyView.as_view(), name='emergency-public-access'),
]
