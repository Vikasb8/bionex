from django.urls import path
from .views import AddMedicalRecordView, PatientRecordsListView, RecordFileUrlView

urlpatterns = [
    path('add/', AddMedicalRecordView.as_view(), name='records-add'),
    path('<uuid:patient_id>/', PatientRecordsListView.as_view(), name='records-list'),
    path('<uuid:pk>/file/', RecordFileUrlView.as_view(), name='records-file'),
]
