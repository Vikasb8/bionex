from django.urls import path
from .views import (
    LabProfileCreateUpdateView,
    PendingLabsView,
    VerifyLabView,
    PrescribeTestView,
    DoctorPendingTestsView,
    LabSearchTestsView,
    LabUpdateResultView,
    DoctorVerifyTestView,
    PatientTestResultsView,
)

urlpatterns = [
    # Lab profile
    path('profile/', LabProfileCreateUpdateView.as_view(), name='labs-profile'),

    # Admin: verify labs
    path('pending/', PendingLabsView.as_view(), name='labs-pending'),
    path('<uuid:pk>/verify-lab/', VerifyLabView.as_view(), name='labs-verify'),

    # Doctor: prescribe tests & view status
    path('prescribe/', PrescribeTestView.as_view(), name='labs-prescribe'),
    path('doctor-tests/', DoctorPendingTestsView.as_view(), name='labs-doctor-tests'),

    # Lab: search & update results
    path('search/', LabSearchTestsView.as_view(), name='labs-search'),
    path('<uuid:pk>/result/', LabUpdateResultView.as_view(), name='labs-update-result'),

    # Doctor: verify results
    path('<uuid:pk>/verify/', DoctorVerifyTestView.as_view(), name='labs-verify-test'),

    # Patient: view test results
    path('patient/<uuid:patient_id>/', PatientTestResultsView.as_view(), name='labs-patient-results'),
]
