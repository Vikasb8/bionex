"""
Medical records serializers.
"""
from rest_framework import serializers
from .models import MedicalRecord
from core.storage import get_file_url
from apps.doctors.serializers import DoctorProfileSerializer


class MedicalRecordSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()
    doctor_details = DoctorProfileSerializer(source='doctor', read_only=True)

    class Meta:
        model = MedicalRecord
        fields = [
            'id', 'patient_id', 'patient_type', 'doctor', 'doctor_details',
            'diagnosis', 'prescription', 'notes', 'report_file_key',
            'file_url', 'record_date', 'created_at'
        ]
        read_only_fields = ['id', 'doctor', 'file_url', 'record_date', 'created_at']

    def get_file_url(self, obj):
        if obj.report_file_key:
            url = get_file_url(obj.report_file_key)
            request = self.context.get('request')
            if request and url.startswith('/'):
                return request.build_absolute_uri(url)
            return url
        return None
